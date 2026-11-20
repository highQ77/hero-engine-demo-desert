const t={chromaticAberration:()=>({name:"chromaticAberration",uniforms:{amount:.004},fragment:`
      vec2 offset = (uv - 0.5) * amount * 2.0;
      color.r = texture2D(tDiffuse, uv + offset).r;
      color.b = texture2D(tDiffuse, uv - offset).b;
    `}),rainOnWindow:()=>({name:"rainOnWindow",uniforms:{amount:.7,speed:1,scale:5,distortion:.6,fog:5,darken:.08},header:`
      float rainHash(vec2 p) {
        p = fract(p * vec2(233.34, 851.73));
        p += dot(p, p + 23.45);
        return fract(p.x * p.y);
      }

      // 水滴到目前為止滑了多遠：一直往下（不會停住或倒退），速度忽快忽慢，像被玻璃卡住又滑下去
      float rainFall(float t, float seed) {
        float v = 0.3 + seed * 0.35;
        float w = 1.2 + seed * 1.8;
        return t * v + (v / w) * 0.85 * sin(t * w + seed * 6.2831);
      }

      // 水滴在玻璃上走的路線：高度 y 時的水平位置（左右彎曲，不是直線）
      float rainPath(float y, float seed) {
        return (seed - 0.5) * 0.3 + 0.06 * sin(y * 2.1 + seed * 40.0) + 0.035 * sin(y * 5.3 + seed * 17.0);
      }

      // 一層往下滑的大水滴（p 的單位：一欄寬 1，y 往上）。
      // 整欄的水滴跟著同一條往下的座標移動：從畫面上方滑進來、從下方滑出去，中途不會消失。
      // 回傳 vec2(水的高度 0~1，算法線用；水滴剛擦過的範圍 0~1，小水滴會被擦掉)
      vec2 rainSliding(vec2 p, float t, float amount) {
        float col = floor(p.x);
        float lx = fract(p.x) - 0.5;                 // 欄裡的水平位置 -0.5~0.5
        float fall = rainFall(t, rainHash(vec2(col, 7.7)));
        float spanY = 3.0;                           // 同一欄水滴的間距
        float trailLen = spanY * 0.8;                // 水痕的長度（不超過間距：只要看這一格和下面一格）
        float cell = floor((p.y + fall) / spanY);
        float h = 0.0;
        float wiped = 0.0;
        for (int k = 0; k < 2; k++) {
          float id = cell - float(k);
          float s = rainHash(vec2(col, id));
          if (s > amount) continue;                  // 雨量少：有些位置沒有水滴
          float dropY = (id + 0.5 + (rainHash(vec2(id, col)) - 0.5) * 0.5) * spanY - fall; // 水滴現在的高度
          float rn = rainHash(vec2(id * 3.1, col));
          float r = 0.06 + 0.09 * rn * rn;             // 大小不一：多數中小、少數比較大
          float dx = lx - rainPath(dropY, s);
          float dy = p.y - dropY;
          // 水滴的形狀：接近圓形（表面張力），上方稍微拉長一點點
          vec2 d = vec2(dx, dy > 0.0 ? dy * 0.85 : dy);
          // 球冠的高度：邊緣陡、中間平，折射起來像透鏡（邊緣俐落）
          h = max(h, sqrt(clamp(1.0 - dot(d, d) / (r * r), 0.0, 1.0)));
          // 水痕：沿著水滴走過的路線，留在水滴上方
          if (dy > r * 0.9 && dy < trailLen) {
            float fade = sqrt(1.0 - dy / trailLen);    // 離水滴越遠（越早留下的）越小，最後蒸發
            float px = lx - rainPath(p.y, s);          // 路線在這個高度的水平位置
            wiped = max(wiped, smoothstep(r * 1.2, r * 0.5, abs(px)) * fade);
            // 小水珠固定在玻璃上（用玻璃的座標 p.y，不跟著水滴移動），大小不一、有的地方斷掉
            float spacing = 0.16;
            float slot = floor(p.y / spacing);
            float kn = rainHash(vec2(slot, id + col * 13.0));
            float ty = (fract(p.y / spacing) - 0.5 - (kn - 0.5) * 0.3) * spacing;
            float tr = min(r * (0.28 + 0.6 * kn * kn), spacing * 0.48) * fade * step(0.2, kn);
            float tx = px + (rainHash(vec2(slot, col)) - 0.5) * r * 0.4; // 稍微偏離路線
            if (tr > 0.0) {
              vec2 td = vec2(tx, ty);
              h = max(h, sqrt(clamp(1.0 - dot(td, td) / (tr * tr), 0.0, 1.0)) * 0.9);
            }
          }
        }
        return vec2(h, wiped);
      }

      // 靜止的小水滴：隨機出現、慢慢蒸發
      float rainStatic(vec2 p, float t, float amount) {
        vec2 id = floor(p);
        vec2 st = fract(p) - 0.5;
        float n = rainHash(id);
        if (n > amount) return 0.0;
        vec2 pos = vec2(rainHash(id + 1.7), rainHash(id + 9.2)) - 0.5;
        pos *= 0.7;
        float life = fract(t * 0.12 + n * 13.0);
        float size = smoothstep(0.0, 0.05, life) * smoothstep(1.0, 0.4, life);
        float sn = rainHash(id + 4.4);
        float r = 0.2 * size * (0.25 + 0.75 * sn * sn);  // 多數很小、少數比較大
        if (r <= 0.0) return 0.0;
        vec2 d = st - pos;
        return sqrt(clamp(1.0 - dot(d, d) / (r * r), 0.0, 1.0));
      }

      // 整片玻璃上的水（兩層大水滴 + 小水滴；大水滴滑過的地方小水滴被擦掉）
      float rainHeight(vec2 uv, float t, float aspect, float scale, float amount) {
        vec2 p = vec2(uv.x * aspect, uv.y) * scale;
        vec2 a = rainSliding(p, t, amount);
        vec2 b = rainSliding(p * 1.45 + vec2(0.37, 5.0), t * 1.1 + 3.0, amount * 0.7);
        // 散落的小水滴少一點：讓一串一串的水痕看得清楚
        float c = max(rainStatic(p * 3.0, t, amount * 0.7), rainStatic(p * 6.0 + 2.7, t * 0.8, amount * 0.4));
        c *= 1.0 - max(a.y, b.y);
        return max(max(a.x, b.x), c * 0.9);
      }
    `,fragment:`
      float aspect = uResolution.x / uResolution.y;
      float t = uTime * speed;
      vec2 e = vec2(1.0 / uResolution.y, 0.0);
      float h = rainHeight(uv, t, aspect, scale, amount);
      float hx = rainHeight(uv + e.xy, t, aspect, scale, amount);
      float hy = rainHeight(uv + e.yx, t, aspect, scale, amount);
      vec2 slope = vec2(hx - h, hy - h) / e.x;   // 水面的斜率（畫面座標）
      float wet = smoothstep(0.0, 0.06, h);      // 1 = 在水滴上（邊緣俐落）
      // 起霧的玻璃：後面的畫面很模糊（圓盤狀取樣，亮的地方會散成一團團柔和的光斑），稍微變暗
      vec4 misty = vec4(0.0);
      for (int i = 0; i < 16; i++) {
        float ang = float(i) * 2.39996;          // 黃金角：取樣點均勻散在圓盤裡
        float rad = sqrt((float(i) + 0.5) / 16.0);
        misty += texture2D(tDiffuse, uv + vec2(cos(ang), sin(ang)) * rad * fog / uResolution);
      }
      misty /= 16.0;
      misty.rgb *= 1.0 - darken;
      // 水滴像一顆小凸透鏡：看到的是清楚、上下左右顛倒的畫面（中心附近顛倒，越靠邊偏移越大）
      vec2 bend = clamp(slope * distortion * 0.003, vec2(-0.06), vec2(0.06));
      vec4 through = texture2D(tDiffuse, clamp(uv + bend, 0.0, 1.0));
      color = mix(misty, through, wet);
      // 邊緣：光被折射出去，看起來比較暗的一圈
      float rim = wet * (1.0 - smoothstep(0.0, 0.4, h));
      color.rgb *= 1.0 - rim * 0.45;
      // 反光：左上方的光源在水滴上的小亮點
      vec3 normal = normalize(vec3(-slope * 0.0025, 1.0));
      float glint = pow(max(dot(normal, normalize(vec3(-0.45, 0.6, 0.9))), 0.0), 28.0);
      color.rgb += glint * wet * 0.7;
    `}),pixelate:()=>({name:"pixelate",uniforms:{pixelSize:6},fragment:`
      vec2 cell = pixelSize / uResolution;
      color = texture2D(tDiffuse, (floor(uv / cell) + 0.5) * cell);
    `})};export{t as EffectPresets};
