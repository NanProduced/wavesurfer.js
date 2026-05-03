# Examples 页面 UI 重构计划 — 从原生 HTML 到音频 Playground

## 现状分析

### 当前架构
```
index.html (项目根目录)
├── <header> 标题
├── <main>
│   ├── <aside> 硬编码的侧边栏导航
│   ├── <textarea> 代码编辑器 (40% 宽度)
│   └── <iframe> 预览区 (srcdoc 注入)
├── <footer> GitHub 链接
└── <script> 加载 examples/_preview.js

examples/_preview.js
├── fetch .js 文件 → 提取 <html> 注释 → 重写 imports → 构建 iframe srcdoc
├── 侧边栏 active 状态管理
└── textarea 实时编辑 (500ms debounce)

examples/*.js (每个 demo)
├── JS 代码 (ES module, import WaveSurfer)
└── /* <html>...</html> */ 注释 (DOM 结构)
```

### 关键约束
- Demo 运行在 iframe 内 (srcdoc), 无法使用相对路径加载外部文件
- `_preview.js` 通过正则提取 `<html>` 注释, 重写 import 路径
- 项目使用 `live-server` (端口 9090) 开发, 根目录即项目根
- 纯 CSS + 原生 JS, 不引入框架
- 不修改 wavesurfer 核心代码

### 技术方案：共享组件注入
由于 iframe 使用 srcdoc, 共享资源需要通过绝对路径注入:
- CSS: `<link rel="stylesheet" href="/examples/shared/styles.css" />`
- JS: `<script src="/examples/shared/components.js"></script>` (非 module, 先于 demo module 执行)
- Demo script 保持 `type="module"`, 可访问 `window.WS` 全局对象

---

## 实施步骤

### 阶段 1: 基础设施 — CSS 变量系统 + 共享目录

**1.1 创建 `examples/shared/` 目录结构**
```
examples/shared/
├── styles.css          # CSS 变量 + 组件样式 + 暗色主题 + 响应式
├── components.js       # 共享 UI 组件 (PlayerBar, WaveformContainer, ControlPanel, InfoPanel)
└── region-list.js      # Regions 专用组件 (RegionList, RegionEditForm, RegionStats)
```

**1.2 创建 `examples/shared/styles.css`**
- CSS 自定义属性体系:
  ```css
  :root {
    --ws-bg: #ffffff;
    --ws-bg-secondary: #f5f5f7;
    --ws-text: #1d1d1f;
    --ws-text-secondary: #6e6e73;
    --ws-accent: #0071e3;
    --ws-accent-hover: #0077ed;
    --ws-border: #d2d2d7;
    --ws-border-radius: 12px;
    --ws-shadow: 0 2px 8px rgba(0,0,0,0.08);
    --ws-wave: #999;
    --ws-progress: #555;
    --ws-card-bg: #ffffff;
    --ws-control-bg: #e8e8ed;
    --ws-toggle-on: #34c759;
    --ws-toggle-off: #e8e8ed;
    --ws-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --ws-font-mono: 'SF Mono', 'Menlo', 'Consolas', monospace;
    --ws-spacing-xs: 4px;
    --ws-spacing-sm: 8px;
    --ws-spacing-md: 16px;
    --ws-spacing-lg: 24px;
    --ws-spacing-xl: 32px;
  }

  [data-theme='dark'] {
    --ws-bg: #1c1c1e;
    --ws-bg-secondary: #2c2c2e;
    --ws-text: #f5f5f7;
    --ws-text-secondary: #98989d;
    --ws-accent: #0a84ff;
    --ws-accent-hover: #409cff;
    --ws-border: #3a3a3c;
    --ws-shadow: 0 2px 8px rgba(0,0,0,0.3);
    --ws-wave: #6e6e73;
    --ws-progress: #0a84ff;
    --ws-card-bg: #2c2c2e;
    --ws-control-bg: #3a3a3c;
    --ws-toggle-on: #30d158;
    --ws-toggle-off: #3a3a3c;
  }
  ```
- 组件样式: PlayerBar, WaveformContainer, ControlPanel, InfoPanel, RegionList
- 自定义表单控件: toggle switch, styled range slider, styled select
- 骨架屏动画 `@keyframes`
- 响应式断点 (在 iframe 内部)

**1.3 修改 `_preview.js` — 注入共享资源到 iframe**
- 在 iframe srcdoc 模板的 `<head>` 中添加:
  ```html
  <link rel="stylesheet" href="/examples/shared/styles.css" />
  ```
- 在 `<body>` 底部 (demo script 之前) 添加:
  ```html
  <script src="/examples/shared/components.js"></script>
  <script src="/examples/shared/region-list.js"></script>
  ```
- 保持现有的 import 重写逻辑不变

---

### 阶段 2: PlayerBar 组件

**2.1 创建 `examples/shared/components.js` — PlayerBar 部分**

PlayerBar API 设计:
```js
WS.PlayerBar.create(wavesurfer, container)
// → 在 container 内创建底部播放控制栏
// → 返回 { destroy(), updateTheme(colors) }
```

功能实现:
- **播放/暂停按钮**: SVG 三角形/双竖线图标, 点击调用 `wavesurfer.playPause()`
- **时间显示**: `mm:ss.ms` 格式, 监听 `timeupdate` 事件更新 `getCurrentTime()`, `getDuration()`
- **音量滑块**: 自定义样式 range input (0-1), `oninput` 调用 `wavesurfer.setVolume(value)`
- **静音按钮**: SVG 喇叭图标, 点击调用 `wavesurfer.setMuted(!muted)`, 图标随状态变化
- **播放速率选择器**: styled select dropdown, options: 0.5x/0.75x/1x/1.25x/1.5x/2x, `onchange` 调用 `wavesurfer.setPlaybackRate(rate)`
- **固定在容器底部**: `position: sticky; bottom: 0`

SVG 图标 (内联, 不用外部文件):
- Play: `<polygon points="5,3 19,12 5,21" />`
- Pause: `<rect x="5" y="3" width="4" height="18" /><rect x="15" y="3" width="4" height="18" />`
- Volume on/off: 喇叭 + 声波 / 喇叭 + 斜线

**2.2 自定义 range slider 样式**
- 使用 CSS `appearance: none` + 自定义 track/thumb
- WebKit + Firefox 双前缀
- 音量滑块: 水平, 高度 4px, 圆角 thumb
- 带当前值 tooltip (CSS `::after` + `attr()` 或 JS 动态更新)

---

### 阶段 3: WaveformContainer 组件

**3.1 WaveformContainer 实现**

API 设计:
```js
WS.WaveformContainer.create(wavesurfer, existingContainer)
// → 将 existingContainer 包裹在卡片容器中
// → 添加元信息栏 + 骨架屏
// → 返回 { destroy(), updateMeta(info) }
```

功能实现:
- **卡片样式**: `border-radius: var(--ws-border-radius)`, `box-shadow: var(--ws-shadow)`, `overflow: hidden`
- **元信息栏** (容器顶部):
  - 从 `wavesurfer.getDecodedData()` 的 AudioBuffer 读取: 采样率 (`sampleRate`), 通道数 (`numberOfChannels`), 时长 (`duration`)
  - 文件名: 从 wavesurfer 的 URL 选项中提取
  - 格式: `mm:ss.ms` 时长 | `sampleRate` Hz | `ch` 通道
- **骨架屏**: 音频加载中显示 CSS 动画
  - 监听 `load` 事件显示骨架屏, `ready` 事件隐藏
  - 动画: `@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`
  - 模拟波形形状的灰色条块

---

### 阶段 4: ControlPanel 组件

**4.1 ControlPanel 实现**

API 设计:
```js
const panel = WS.ControlPanel.create(container)
panel.addToggle({ id, label, checked, onChange })
panel.addSlider({ id, label, min, max, step, value, unit, onChange })
panel.addSelect({ id, label, options, value, onChange })
```

功能实现:
- **统一控件样式**:
  - Toggle switch: 自定义 checkbox, 圆形滑块 + 轨道, CSS transition
  - Styled range slider: 与 PlayerBar 音量滑块一致, 带值 tooltip
  - Styled select: 自定义下拉箭头, 圆角边框
- **CSS Grid 两列布局**: `grid-template-columns: auto 1fr`, label 右对齐 + 控件左对齐
- **值标签**: slider 旁显示当前值 + 单位 (如 "120 px/s")
- **窄屏单列**: `@media (max-width: 600px) { grid-template-columns: 1fr; }`

---

### 阶段 5: InfoPanel 组件

**5.1 InfoPanel 实现**

API 设计:
```js
WS.InfoPanel.create(wavesurfer, container, { pluginInstances?: { regions?, record? } })
// → 在波形容器右上角添加 ℹ️ 图标
// → 点击展开/收起信息面板
```

功能实现:
- **触发按钮**: 绝对定位在 WaveformContainer 右上角, ℹ️ SVG 图标
- **面板内容** (两栏):
  - 基本信息: 文件名, 格式 (从 URL 推断), 时长, 采样率, 通道数
  - 实时信息: 当前播放位置 (监听 `timeupdate`), zoom level (监听 `zoom`), peaks 数量
  - 插件状态: Regions 数量 (`regions.getRegions().length`), Record 状态
- **数据来源**: 全部来自 wavesurfer 事件和 API, 不硬编码
- **展开/收起**: CSS `max-height` transition, 点击 ℹ️ toggle

---

### 阶段 6: Regions Demo 增强

**6.1 创建 `examples/shared/region-list.js`**

RegionList API:
```js
WS.RegionList.create(wavesurfer, regionsPlugin, container)
// → 创建 region 列表面板
// → 返回 { destroy() }
```

功能实现:
- **Region 列表** (表格形式):
  - 列: 颜色预览块 | label | start | end | duration | 删除按钮
  - 点击行 → `wavesurfer.setTime(region.start)` + 高亮选中行
  - 删除按钮 → `region.remove()`
  - 监听 `region-created` / `region-removed` / `region-updated` 实时更新列表
- **Inline 编辑表单** (双击行展开):
  - label 文本输入
  - 颜色选择器 (`<input type="color">`)
  - start/end 数字输入 (step=0.01)
  - 修改后调用 `region.setOptions({ label, color, start, end })`
- **Region 统计** (列表底部):
  - 共 N 个 regions
  - 总覆盖时长 (合并重叠后计算)
  - 覆盖率 = 总覆盖时长 / 音频总时长 × 100%

**6.2 修改 `examples/regions.js`**
- 在 HTML 注释中添加 `<div id="region-list"></div>` 容器
- 在 JS 中调用 `WS.RegionList.create(ws, regions, document.querySelector('#region-list'))`
- 替换原生 checkbox/range 为 `WS.ControlPanel` 控件

---

### 阶段 7: 修改各 Demo 使用共享组件

**7.1 修改每个 demo 的 JS 文件**

对每个 demo (basic.js, zoom.js, hover.js, timeline.js 等) 添加:
```js
// 在 WaveSurfer.create() 之后:
WS.WaveformContainer.create(ws, ws.getWrapper().parentElement)
WS.PlayerBar.create(ws, document.body)
WS.InfoPanel.create(ws, ws.getWrapper().parentElement)

// 替换原生控件为 ControlPanel:
const panel = WS.ControlPanel.create(document.querySelector('#controls'))
panel.addSlider({ id: 'zoom', label: 'Zoom', min: 10, max: 1000, value: 10, unit: 'px/s', onChange: (v) => ws.zoom(v) })
```

**7.2 Demo 分类处理**
- **简单 demo** (basic, events, zoom, bars): 只需 PlayerBar + WaveformContainer + InfoPanel
- **插件 demo** (regions, hover, timeline, minimap, envelope, spectrogram, record): 额外添加 ControlPanel + 插件专用组件
- **特殊 demo** (react, video, webaudio, fm-synth, multitrack): 最小改动, 仅添加 PlayerBar (如适用)
- **all-options.js**: 保持现有动态表单生成, 仅添加主题适配

**7.3 Demo HTML 注释修改**
- 添加 `<div id="controls"></div>` 容器 (用于 ControlPanel)
- 移除原生 `<input type="checkbox/range">`, 改由 ControlPanel 动态生成
- 保持 `<div id="waveform"></div>` 等必要容器

---

### 阶段 8: 侧边栏导航改造

**8.1 修改 `index.html` 的 `<aside>` 结构**

```html
<aside id="sidebar">
  <details open>
    <summary><span class="nav-icon">🎵</span> Basics</summary>
    <ul>
      <li><a href="#basic.js"><span class="nav-icon">▶️</span> Basic</a></li>
      <li><a href="#all-options.js"><span class="nav-icon">⚙️</span> Options</a></li>
      ...
    </ul>
  </details>
  <details open>
    <summary><span class="nav-icon">🔌</span> Plugins</summary>
    <ul>...</ul>
  </details>
  <details open>
    <summary><span class="nav-icon">🧪</span> Advanced</summary>
    <ul>...</ul>
  </details>
  <div class="sidebar-footer">
    <a href="https://github.com/katspaugh/wavesurfer.js" target="_blank" aria-label="GitHub">
      <!-- GitHub SVG icon -->
    </a>
    <a href="https://www.npmjs.com/package/wavesurfer.js" target="_blank" aria-label="npm">
      <!-- npm SVG icon -->
    </a>
  </div>
</aside>
```

**8.2 侧边栏样式增强**
- 当前选中: `border-left: 3px solid var(--ws-accent); background: var(--ws-bg-secondary); font-weight: 600;`
- `<details>/<summary>`: 纯 HTML 折叠, 自定义 summary 箭头
- 分类图标: emoji 前缀
- 底部外链: SVG 图标

---

### 阶段 9: 响应式适配

**9.1 Shell 页面 (index.html) 响应式**

```css
/* ≥1024px: 完整侧边栏 */
@media (min-width: 1024px) {
  aside { width: 200px; }
}

/* 768-1024px: 图标模式侧边栏 */
@media (min-width: 768px) and (max-width: 1023px) {
  aside { width: 48px; }
  aside .nav-icon { display: none; }
  aside a { font-size: 0; } /* 隐藏文字 */
  aside a:hover::after { content: attr(data-name); font-size: 14px; position: absolute; }
  aside details summary { font-size: 0; }
}

/* <768px: hamburger 菜单 */
@media (max-width: 767px) {
  aside { display: none; }
  aside.open { display: block; position: fixed; top: 0; left: 0; width: 260px; height: 100vh; z-index: 100; }
  .hamburger { display: block; }
}
```

- 添加 hamburger 按钮 (`☰` SVG) 到 header
- 点击 hamburger → toggle `aside.open` class
- 遮罩层: 点击遮罩关闭侧边栏

**9.2 iframe 内容响应式 (styles.css)**
- ControlPanel: 窄屏单列
- PlayerBar: 窄屏隐藏速率选择器, 简化布局
- InfoPanel: 窄屏全宽

---

### 阶段 10: 暗色主题

**10.1 主题切换机制**

Shell 页面 (index.html):
- header 右上角添加主题切换按钮 (🌙/☀️ SVG)
- 点击 toggle `<html data-theme="dark">`
- 存入 `localStorage.setItem('ws-theme', 'dark'|'light')`
- 页面加载时读取 `localStorage` 并应用

iframe 内容:
- `_preview.js` 在 iframe srcdoc 中注入当前主题:
  ```js
  const theme = localStorage.getItem('ws-theme') || 'light'
  iframe.srcdoc = `...<html data-theme="${theme}">...`
  ```
- `styles.css` 中的 `[data-theme='dark']` 选择器自动生效

**10.2 wavesurfer 颜色动态更新**

在 `components.js` 中:
```js
WS.applyTheme(wavesurfer, isDark) {
  wavesurfer.setOptions({
    waveColor: isDark ? '#6e6e73' : '#999',
    progressColor: isDark ? '#0a84ff' : '#555',
    cursorColor: isDark ? '#f5f5f7' : '#333',
  })
}
```

Shell 页面主题切换时, 通过 `postMessage` 通知 iframe:
```js
iframe.contentWindow.postMessage({ type: 'ws-theme-change', theme: isDark ? 'dark' : 'light' }, '*')
```

iframe 内监听:
```js
window.addEventListener('message', (e) => {
  if (e.data.type === 'ws-theme-change') {
    document.documentElement.setAttribute('data-theme', e.data.theme)
    if (window.__ws_instances) {
      window.__ws_instances.forEach(ws => WS.applyTheme(ws, e.data.theme === 'dark'))
    }
  }
})
```

---

### 阶段 11: Cypress 测试

**11.1 Visual regression 测试**

新建 `cypress/e2e/examples-ui.cy.js`:

```js
describe('Examples UI visual regression', () => {
  const viewports = [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'tablet', width: 800, height: 600 },
    { name: 'mobile', width: 375, height: 812 },
  ]

  const themes = ['light', 'dark']

  viewports.forEach(({ name, width, height }) => {
    themes.forEach((theme) => {
      it(`Basic demo - ${theme} theme at ${width}px`, () => {
        cy.viewport(width, height)
        cy.visit('/index.html#basic.js')
        if (theme === 'dark') {
          cy.get('#theme-toggle').click()
        }
        cy.get('#preview').its('0.contentDocument').should('exist')
        cy.wait(2000) // 等待波形渲染
        cy.get('#preview').matchImageSnapshot(`basic-${theme}-${name}`)
      })
    })
  })

  it('Regions demo - region list expanded', () => {
    cy.viewport(1280, 800)
    cy.visit('/index.html#regions.js')
    cy.wait(2000)
    cy.get('#preview').matchImageSnapshot('regions-list-expanded')
  })

  it('PlayerBar - playing state', () => {
    cy.viewport(1280, 800)
    cy.visit('/index.html#basic.js')
    cy.wait(2000)
    // 触发播放
    cy.get('#preview').then(($iframe) => {
      const doc = $iframe[0].contentDocument
      doc.querySelector('.ws-play-btn').click()
    })
    cy.wait(500)
    cy.get('#preview').matchImageSnapshot('playerbar-playing')
  })
})
```

**11.2 E2E 功能测试**

```js
describe('Examples UI E2E', () => {
  it('Play button triggers wavesurfer playback', () => {
    cy.visit('/index.html#basic.js')
    cy.wait(2000)
    cy.get('#preview').then(($iframe) => {
      const win = $iframe[0].contentWindow
      const ws = win.__ws_instances[0]
      expect(ws.isPlaying()).to.be.false
      win.document.querySelector('.ws-play-btn').click()
      expect(ws.isPlaying()).to.be.true
    })
  })

  it('Volume slider changes wavesurfer volume', () => {
    cy.visit('/index.html#basic.js')
    cy.wait(2000)
    cy.get('#preview').then(($iframe) => {
      const win = $iframe[0].contentWindow
      const ws = win.__ws_instances[0]
      const slider = win.document.querySelector('.ws-volume-slider')
      slider.value = 0.3
      slider.dispatchEvent(new Event('input'))
      expect(ws.getVolume()).to.equal(0.3)
    })
  })

  it('Theme toggle updates CSS variables and wavesurfer colors', () => {
    cy.visit('/index.html#basic.js')
    cy.wait(2000)
    cy.get('#theme-toggle').click()
    cy.get('#preview').then(($iframe) => {
      const doc = $iframe[0].contentDocument
      const theme = doc.documentElement.getAttribute('data-theme')
      expect(theme).to.equal('dark')
    })
  })

  it('Responsive: hamburger menu appears at 375px', () => {
    cy.viewport(375, 812)
    cy.visit('/index.html#basic.js')
    cy.get('.hamburger-btn').should('be.visible')
    cy.get('.hamburger-btn').click()
    cy.get('aside').should('have.class', 'open')
  })

  it('Region list: add region → list updates → click seeks', () => {
    cy.visit('/index.html#regions.js')
    cy.wait(2000)
    cy.get('#preview').then(($iframe) => {
      const win = $iframe[0].contentWindow
      const regions = win.__ws_regions
      regions.addRegion({ start: 5, end: 8, content: 'Test', color: 'rgba(255,0,0,0.3)' })
      const rows = win.document.querySelectorAll('.ws-region-row')
      expect(rows.length).to.be.greaterThan(0)
      rows[rows.length - 1].click()
      const ws = win.__ws_instances[0]
      expect(ws.getCurrentTime()).to.be.closeTo(5, 0.5)
    })
  })
})
```

---

## 文件变更清单

| 操作 | 文件路径 | 说明 |
|------|----------|------|
| 新建 | `examples/shared/styles.css` | CSS 变量 + 组件样式 + 暗色主题 + 响应式 |
| 新建 | `examples/shared/components.js` | PlayerBar, WaveformContainer, ControlPanel, InfoPanel |
| 新建 | `examples/shared/region-list.js` | RegionList, RegionEditForm, RegionStats |
| 修改 | `examples/_preview.js` | 注入共享 CSS/JS, 主题传递, postMessage 监听 |
| 修改 | `index.html` | 侧边栏重构, 主题切换按钮, hamburger, 响应式样式 |
| 修改 | `examples/basic.js` | 使用共享组件 |
| 修改 | `examples/regions.js` | 使用共享组件 + RegionList |
| 修改 | `examples/zoom.js` | 使用共享组件 |
| 修改 | `examples/hover.js` | 使用共享组件 |
| 修改 | `examples/timeline.js` | 使用共享组件 |
| 修改 | `examples/record.js` | 使用共享组件 |
| 修改 | 其他 ~20 个 demo JS 文件 | 逐一添加共享组件调用 |
| 新建 | `cypress/e2e/examples-ui.cy.js` | Visual regression + E2E 测试 |

---

## 执行顺序

1. **阶段 1**: 创建 shared 目录 + styles.css + 修改 _preview.js 注入机制
2. **阶段 2**: 实现 PlayerBar 组件
3. **阶段 3**: 实现 WaveformContainer 组件
4. **阶段 4**: 实现 ControlPanel 组件
5. **阶段 5**: 实现 InfoPanel 组件
6. **阶段 6**: 实现 RegionList + 修改 regions.js
7. **阶段 7**: 逐一修改各 demo 使用共享组件
8. **阶段 8**: 侧边栏导航改造
9. **阶段 9**: 响应式适配
10. **阶段 10**: 暗色主题
11. **阶段 11**: Cypress 测试
12. **最终**: `yarn lint` 检查 + 手动验证所有 demo
