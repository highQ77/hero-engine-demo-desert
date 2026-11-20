const e=`<!--
  介面檔：可以用 UI 編輯器（/ui-editor.html）編輯
  版面尺寸：滿版（auto × auto）
  右邊是後製調控面板：控制項的 id 和 postfx.settings 的對應寫在 src/postfx-panel.ts
-->
<UI width="auto" height="auto" padding="24" gap="10" align="start">
  <UISkin for="UIButton" radius="6" padding="5 10" background="#26304a" hoverBackground="#33405f" color="#dfe7ff" fontSize="12"/>
  <UISkin for="UISlider" width="100%"/>
  <UISkin for="UIToggle" fontSize="13" fontWeight="bold" color="#b9cbff"/>
  <UISkin for="UISelect" width="100%" fontSize="12"/>
  <UIStyle name="field" fontSize="12" color="#c3cbe0"/>
  <UIStyle name="hint" fontSize="11" color="#7f8aa6" lineHeight="1.4"/>
  <UIStyle name="group" gap="5" padding="10" background="rgba(255,255,255,0.04)" radius="8"/>

  <UILabel fontSize="28" fontWeight="bold" color="#ffffff">desert</UILabel>

  <!-- ───────── 右：後製調控面板（預設收合，按右上角「後製調整」展開） ───────── -->
  <UILayout id="fxPanel" hidden="true" position="absolute" top="16" right="16" bottom="16" width="300" padding="12" gap="10"
            background="rgba(12,15,24,0.88)" radius="10">
    <UILayout dir="h" align="center" gap="6">
      <UILabel flex="1" fontSize="16" fontWeight="bold" color="#ffffff">後製調整</UILabel>
      <UIButton text="還原" onClick="fxReset"/>
      <UIButton text="收合" onClick="fxHide"/>
    </UILayout>
    <UILabel style="hint">拖曳滑桿立即生效。「還原」回到場景檔（scenes/main.xml）的設定。</UILabel>

    <UIScrollView flex="1" gap="10">
      <!-- 色調 -->
      <UILayout style="group">
        <UILabel fontSize="13" fontWeight="bold" color="#b9cbff">色調</UILabel>
        <UILabel style="field">色調映射</UILabel>
        <UISelect id="toneMapping" value="aces" onChange="fx">
          <UIOption value="aces">aces：電影感</UIOption>
          <UIOption value="agx">agx：自然</UIOption>
          <UIOption value="neutral">neutral：中性</UIOption>
          <UIOption value="reinhard">reinhard：柔和</UIOption>
          <UIOption value="cineon">cineon：底片</UIOption>
          <UIOption value="linear">linear：線性</UIOption>
          <UIOption value="none">none：不處理</UIOption>
        </UISelect>
        <UILabel style="field">曝光</UILabel>
        <UISlider id="exposure" min="0.1" max="2.5" step="0.01" showValue="true" onInput="fx"/>
      </UILayout>

      <!-- 光暈 -->
      <UILayout style="group">
        <UIToggle id="bloom" text="光暈（bloom）" onChange="fx"/>
        <UILabel style="field">強度</UILabel>
        <UISlider id="bloomStrength" min="0" max="3" step="0.05" showValue="true" onInput="fx"/>
        <UILabel style="field">擴散範圍</UILabel>
        <UISlider id="bloomRadius" min="0" max="1" step="0.01" showValue="true" onInput="fx"/>
        <UILabel style="field">門檻（多亮才發光）</UILabel>
        <UISlider id="bloomThreshold" min="0" max="5" step="0.05" showValue="true" onInput="fx"/>
      </UILayout>

      <!-- 調色 -->
      <UILayout style="group">
        <UIToggle id="color" text="調色（color）" onChange="fx"/>
        <UILabel style="field">亮度</UILabel>
        <UISlider id="brightness" min="-0.5" max="0.5" step="0.01" showValue="true" onInput="fx"/>
        <UILabel style="field">對比</UILabel>
        <UISlider id="contrast" min="0.5" max="2" step="0.01" showValue="true" onInput="fx"/>
        <UILabel style="field">飽和度</UILabel>
        <UISlider id="saturation" min="0" max="2" step="0.01" showValue="true" onInput="fx"/>
        <UILabel style="field">色偏：色相（0～360）</UILabel>
        <UISlider id="tintHue" min="0" max="360" step="1" showValue="true" onInput="fx"/>
        <UILabel style="field">色偏：濃度（0 = 不偏色）</UILabel>
        <UISlider id="tintAmount" min="0" max="1" step="0.01" showValue="true" onInput="fx"/>
        <UILabel id="tintHex" style="hint"> </UILabel>
      </UILayout>

      <!-- 暗角 -->
      <UILayout style="group">
        <UIToggle id="vignette" text="暗角（vignette）" onChange="fx"/>
        <UILabel style="field">範圍（越小暗得越多）</UILabel>
        <UISlider id="vignetteOffset" min="0" max="2" step="0.01" showValue="true" onInput="fx"/>
        <UILabel style="field">深淺</UILabel>
        <UISlider id="vignetteDarkness" min="0" max="3" step="0.05" showValue="true" onInput="fx"/>
      </UILayout>

      <!-- 底片顆粒 -->
      <UILayout style="group">
        <UIToggle id="film" text="底片顆粒（film）" onChange="fx"/>
        <UILabel style="field">顆粒強度</UILabel>
        <UISlider id="filmIntensity" min="0" max="1" step="0.01" showValue="true" onInput="fx"/>
        <UICheckBox id="grayscale" text="黑白" fontSize="12" color="#c3cbe0" onChange="fx"/>
      </UILayout>

      <!-- 景深 -->
      <UILayout style="group">
        <UIToggle id="dof" text="景深（dof）" onChange="fx"/>
        <UILabel style="field">對焦距離（公尺）</UILabel>
        <UISlider id="dofFocus" min="1" max="200" step="1" showValue="true" onInput="fx"/>
        <UILabel style="field">光圈（越大越模糊）</UILabel>
        <UISlider id="dofAperture" min="0" max="0.02" step="0.0005" showValue="true" onInput="fx"/>
        <UILabel style="field">最大模糊</UILabel>
        <UISlider id="dofMaxBlur" min="0" max="0.03" step="0.001" showValue="true" onInput="fx"/>
      </UILayout>

      <!-- 環境光遮蔽 -->
      <UILayout style="group">
        <UIToggle id="ao" text="環境光遮蔽（ao）" onChange="fx"/>
        <UILabel style="hint">角落、縫隙變暗；比較耗效能</UILabel>
        <UILabel style="field">範圍</UILabel>
        <UISlider id="aoRadius" min="0.05" max="3" step="0.05" showValue="true" onInput="fx"/>
        <UILabel style="field">強度</UILabel>
        <UISlider id="aoIntensity" min="0" max="3" step="0.05" showValue="true" onInput="fx"/>
      </UILayout>

      <!-- 月光光束（自訂後製，設定在 src/godrays.ts） -->
      <UILayout style="group">
        <UIToggle id="godrays" text="月光光束（god rays）" onChange="godrays"/>
        <UILabel style="hint">月光從船身、船帆的縫隙透出來</UILabel>
        <UILabel style="field">強度</UILabel>
        <UISlider id="godrayIntensity" min="0" max="2" step="0.01" showValue="true" onInput="godrays"/>
        <UILabel style="field">長度</UILabel>
        <UISlider id="godrayLength" min="0" max="1" step="0.01" showValue="true" onInput="godrays"/>
        <UILabel style="field">衰減</UILabel>
        <UISlider id="godrayDecay" min="0.9" max="1" step="0.001" showValue="true" onInput="godrays"/>
      </UILayout>

      <!-- 沙塵（不是後製，是粒子；設定在 src/dust.ts） -->
      <UILayout style="group">
        <UIToggle id="dust" text="沙塵" onChange="dust"/>
        <UILabel style="field">濃度</UILabel>
        <UISlider id="dustDensity" min="0" max="2" step="0.05" showValue="true" onInput="dust"/>
        <UILabel style="field">大小</UILabel>
        <UISlider id="dustSize" min="0.3" max="3" step="0.05" showValue="true" onInput="dust"/>
        <UILabel style="field">風速</UILabel>
        <UISlider id="dustWind" min="0" max="3" step="0.05" showValue="true" onInput="dust"/>
      </UILayout>

      <!-- 反鋸齒 -->
      <UILayout style="group">
        <UILabel fontSize="13" fontWeight="bold" color="#b9cbff">反鋸齒</UILabel>
        <UISelect id="antialias" value="auto" onChange="fx">
          <UIOption value="auto">auto：依螢幕自動選擇</UIOption>
          <UIOption value="msaa">msaa：品質好、耗效能</UIOption>
          <UIOption value="smaa">smaa：銳利</UIOption>
          <UIOption value="fxaa">fxaa：最便宜</UIOption>
          <UIOption value="none">none：關閉</UIOption>
        </UISelect>
      </UILayout>

      <UILabel id="fxPasses" style="hint"> </UILabel>
    </UIScrollView>
  </UILayout>

  <!-- 收合後只留一顆按鈕 -->
  <UIButton id="fxShow" text="後製調整" position="absolute" top="16" right="16" onClick="fxShow"/>
</UI>
`;export{e as default};
