# wavesurfer.js 本地开发指南

## 一、项目概览

| 项目 | 说明 |
|---|---|
| **名称** | wavesurfer.js v7.12.6 |
| **定位** | 交互式音频波形渲染与播放库 |
| **语言** | TypeScript (ES Modules) |
| **构建工具** | TypeScript Compiler + Rollup |
| **包管理器** | Yarn 1.22.22 (经典版，请勿使用 Yarn 2+/Berry) |
| **模块格式** | ESM / CJS / UMD 三种输出 |
| **测试框架** | Jest (单元测试) + Cypress (E2E + 视觉回归) |
| **代码规范** | ESLint + Prettier |

## 二、环境配置要求

### 2.1 必备软件

| 软件 | 最低版本 | 推荐版本 |
|---|---|---|
| **Node.js** | >= 18 | v22.x LTS |
| **Yarn** | 1.22.x | 1.22.22 |
| **Chrome 浏览器** | 最新稳定版 | E2E 测试必需 |

### 2.2 可选软件

| 软件 | 用途 |
|---|---|
| **Chrome Canary** | 运行 `yarn cypress:canary` 进行前瞻性兼容测试 |

### 2.3 安装 Node.js 与 Yarn

推荐使用 nvm-windows 管理 Node 版本：

```powershell
nvm install 22
nvm use 22
```

安装 Yarn 1.x（经典版）：

```powershell
npm install -g yarn@1.22.22
```

验证安装：

```powershell
node --version   # 应输出 v22.x
yarn --version   # 应输出 1.22.22
```

## 三、依赖安装

```powershell
yarn
```

此命令根据 `yarn.lock` 安装所有开发依赖（项目无生产依赖，全部为 devDependencies）。

如果安装缓慢，可切换镜像源：

```powershell
yarn config set registry https://registry.npmmirror.com
```

## 四、核心命令一览

| 命令 | 作用 | 说明 |
|---|---|---|
| `yarn` | 安装依赖 | 根据 yarn.lock 安装 |
| `yarn start` | **启动开发模式** | 同时运行 TS watch + HTTP 服务器 |
| `yarn build` | 完整构建 | clean -> tsc -> rollup |
| `yarn build:dev` | TS watch 模式 | 仅 tsc -w，不打包 |
| `yarn serve` | 启动 HTTP 服务器 | live-server, 端口 9090 |
| `yarn lint` | ESLint 检查 + 自动修复 | 检查 `src/**/*.ts` |
| `yarn lint:report` | 生成 ESLint 报告 | 输出 JSON 格式 |
| `yarn prettier` | 格式化代码 | 处理 `*.js, *.ts, *.css` |
| `yarn test:unit` | 运行单元测试 | Jest + 覆盖率 |
| `yarn cypress` | 打开 Cypress 交互式测试 | 需先 build |
| `yarn test` | 运行 E2E 测试（无头） | Cypress headless Chrome |
| `yarn clean` | 清理 dist 目录 | 删除构建产物 |
| `yarn make-plugin` | 创建新插件脚手架 | 交互式脚本 |

## 五、本地开发调试流程

### 5.1 启动开发环境

```powershell
yarn start
```

此命令实际执行：`npm run build:dev & npm run serve`

- **build:dev**：运行 `tsc -w --target ESNext`，TypeScript 编译器以 watch 模式运行，源文件变更时自动增量编译到 `dist/`
- **serve**：运行 `npx live-server --port=9090`，在 `http://localhost:9090` 启动带 live reload 的 HTTP 服务器

启动后浏览器访问 **http://localhost:9090** 即可看到示例页面。

### 5.2 Windows 下的替代方案

`yarn start` 在 Windows 上使用 `&` 后台运行可能不兼容，建议拆分为两个终端：

```powershell
# 终端 1：启动 TS watch 编译
yarn build:dev

# 终端 2：启动 HTTP 服务器
yarn serve
```

然后手动访问 http://localhost:9090。

### 5.3 开发工作流

1. **修改源码**：编辑 `src/` 下的 `.ts` 文件
2. **自动编译**：`tsc -w` 检测变更并重新编译到 `dist/`
3. **自动刷新**：`live-server` 检测到 `dist/` 文件变化后自动刷新浏览器
4. **验证效果**：在示例页面中选择对应示例查看效果

### 5.4 示例系统

项目内置了丰富的示例（`examples/` 目录），通过 `index.html` 主页访问：

- 左侧边栏列出所有示例分类（Basics / Plugins / Advanced）
- 点击示例名在 iframe 中加载预览
- 右侧文本框显示示例源码，**可直接编辑并实时预览**
- 示例中的 `import ... from 'wavesurfer.js'` 会被 `_preview.js` 自动替换为本地 `dist/` 路径

### 5.5 调试特定功能

1. 在 `examples/` 目录下找到对应示例（如 `regions.js`）
2. 启动 `yarn start`
3. 在浏览器中访问 `http://localhost:9090/#regions.js`
4. 打开浏览器 DevTools (F12) 进行断点调试

如需 source map 调试，可在 `tsconfig.json` 中添加 `"sourceMap": true`。

## 六、构建系统详解

### 6.1 构建流程

```
yarn build = yarn clean -> tsc -> rollup -c
```

1. **yarn clean**：删除 `dist/` 目录
2. **tsc**：TypeScript 编译器编译，输出 `.js` + `.d.ts` 到 `dist/`
3. **rollup -c**：打包生成最终产物

### 6.2 Rollup 输出格式

为主库和每个插件分别生成三种格式：

| 格式 | 文件后缀 | 用途 |
|---|---|---|
| **ESM** | `.esm.js` | `import WaveSurfer from 'wavesurfer.js'` |
| **CJS** | `.cjs` | `const WaveSurfer = require('wavesurfer.js')` |
| **UMD** | `.min.js` | `<script src="...">` 浏览器直接引用 |

所有 Rollup 输出都经过 terser 压缩，并使用 web-worker-loader 处理 Web Worker（频谱图插件）。

## 七、测试体系

### 7.1 单元测试 (Jest)

```powershell
yarn test:unit
```

- 测试环境：jsdom
- 测试目录：`src/__tests__/`、`src/reactive/__tests__/`、`src/state/__tests__/`
- 使用 ts-jest + ESM 模式
- 自动收集覆盖率

### 7.2 E2E 测试 (Cypress)

```powershell
# 交互式模式（推荐开发时使用）
yarn cypress

# 无头模式（CI 使用）
yarn test
```

- 测试目录：`cypress/e2e/`
- 包含视觉回归测试（cypress-image-snapshot）
- **前提**：运行 E2E 测试前必须先执行 `yarn build`

## 八、代码规范

### 8.1 Prettier 配置

```json
{
  "tabWidth": 2,
  "printWidth": 120,
  "trailingComma": "all",
  "singleQuote": true,
  "semi": false,
  "endOfLine": "auto"
}
```

### 8.2 代码检查

```powershell
# ESLint 检查并自动修复
yarn lint

# Prettier 格式化
yarn prettier
```

**每次代码变更后必须运行 `yarn lint` 确保通过检查。**

## 九、项目目录结构

```
wavesurfer/
├── src/                          # 源代码
│   ├── wavesurfer.ts             # 主入口文件
│   ├── player.ts                 # 音频播放器
│   ├── renderer.ts               # 波形渲染器
│   ├── renderer-utils.ts         # 渲染工具函数
│   ├── decoder.ts                # 音频解码器
│   ├── webaudio.ts               # Web Audio API 封装
│   ├── event-emitter.ts          # 事件发射器
│   ├── base-plugin.ts            # 插件基类
│   ├── dom.ts                    # DOM 工具
│   ├── draggable.ts              # 拖拽交互
│   ├── fetcher.ts                # 网络请求
│   ├── fft.ts                    # FFT 算法
│   ├── timer.ts                  # 定时器
│   ├── plugins/                  # 官方插件
│   │   ├── regions.ts            # 区域标注
│   │   ├── timeline.ts           # 时间轴
│   │   ├── minimap.ts            # 缩略图
│   │   ├── envelope.ts           # 包络线
│   │   ├── hover.ts              # 悬停提示
│   │   ├── record.ts             # 录音
│   │   ├── spectrogram.ts        # 频谱图
│   │   └── zoom.ts               # 缩放插件
│   ├── reactive/                 # 响应式系统
│   ├── state/                    # 状态管理
│   └── __tests__/                # 单元测试
├── examples/                     # 示例页面
├── cypress/                      # E2E 测试
├── scripts/                      # 构建脚本
├── dist/                         # 构建产物（gitignore）
├── index.html                    # 示例主页
├── package.json
├── tsconfig.json
├── rollup.config.js
├── jest.config.js
├── cypress.config.js
├── eslint.config.js
└── .prettierrc
```

## 十、常见问题排查

### Q1: `yarn start` 后浏览器白屏/无法访问

Windows 上 `&` 后台运行可能不兼容。拆分为两个终端分别运行 `yarn build:dev` 和 `yarn serve`。

### Q2: `yarn build` 报 TypeScript 编译错误

1. 确认 Node.js 版本 >= 18：`node --version`
2. 删除 `node_modules` 后重新安装：`rm -rf node_modules && yarn`
3. 确认 TypeScript 版本：`npx tsc --version`（应为 5.9.x）

### Q3: E2E 测试失败 / Cypress 无法启动

1. 确保已安装 Chrome 浏览器
2. 确保先执行了 `yarn build`
3. 确保本地 HTTP 服务器正在运行（`yarn serve`）
4. 视觉回归测试失败时，检查系统显示缩放应为 100%

### Q4: 修改源码后浏览器没有自动刷新

1. 确认 `build:dev`（tsc -w）正在运行且编译成功
2. 检查 `dist/` 目录下文件是否已更新
3. 手动刷新浏览器页面

### Q5: 单元测试报 ts-jest 相关错误

Jest 使用独立的 `tsconfig.test.json`，如遇模块解析问题，检查 `jest.config.js` 中的 `moduleNameMapper` 配置。

### Q6: Windows 下行尾符 (CRLF/LF) 问题

运行 `yarn prettier` 格式化修复。

### Q7: 创建新插件

```powershell
yarn make-plugin
```

## 十一、二次开发入口

| 修改目标 | 关键文件 |
|---|---|
| 核心功能 | `src/wavesurfer.ts` |
| 新增/修改插件 | `src/plugins/`，参考 `src/base-plugin.ts` |
| 渲染逻辑 | `src/renderer.ts`、`src/renderer-utils.ts` |
| 播放逻辑 | `src/player.ts`、`src/webaudio.ts` |
| 响应式系统 | `src/reactive/` |
| 状态管理 | `src/state/` |
