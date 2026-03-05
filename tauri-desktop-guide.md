# SigmaFlow 桌面端开发与打包指南（Windows / macOS）

当前项目技术栈：

- 前端：`Vue 3 + Vite`
- 桌面壳：`Tauri 2`

可用脚本：

- 开发启动：`npm run tauri:dev`
- 生产打包：`npm run tauri:build`

## 1. 通用准备

在项目根目录先安装依赖：

```bash
npm install
```

建议先验证：

```bash
npm run build
```

## 2. Windows：开发启动与打包

### 2.1 环境要求

需要安装：

1. Node.js（建议 20+）
2. Rust（rustup）
3. Visual Studio Build Tools（必须包含 C++）
4. WebView2 Runtime

安装后建议检查：

```powershell
node -v
npm -v
rustc --version
cargo --version
```

### 2.2 开发启动（Windows）

在项目根目录执行：

```powershell
npm run tauri:dev
```

行为说明：

1. 启动 Vite 开发服务
2. 编译并启动 Tauri 桌面窗口

### 2.3 Windows 打包

在项目根目录执行：

```powershell
npm run tauri:build
```

常见输出目录：

- 可执行文件：`src-tauri/target/release/`
- 安装包目录：
  - `src-tauri/target/release/bundle/msi/`
  - `src-tauri/target/release/bundle/nsis/`

## 3. macOS：开发启动与打包

### 3.1 环境要求

需要安装：

1. Node.js（建议 20+）
2. Rust（rustup）
3. Xcode Command Line Tools

安装命令（命令行工具）：

```bash
xcode-select --install
```

安装后建议检查：

```bash
node -v
npm -v
rustc --version
cargo --version
```

### 3.2 开发启动（macOS）

在项目根目录执行：

```bash
npm run tauri:dev
```

### 3.3 macOS 打包

在项目根目录执行：

```bash
npm run tauri:build
```

常见输出目录：

- `.app`：`src-tauri/target/release/bundle/macos/`
- `.dmg`：`src-tauri/target/release/bundle/dmg/`

## 4. 推荐流程（两端通用）

### 日常开发

```bash
npm install
npm run tauri:dev
```

### 打包前检查

```bash
npm run build
cargo check --manifest-path src-tauri/Cargo.toml
```

### 正式打包

```bash
npm run tauri:build
```

## 5. 常见问题

### Q1: Windows 编译报找不到 C++ 工具链

安装 Visual Studio Build Tools，并确认勾选 `Desktop development with C++`。

### Q2: Windows 打开应用白屏

先确认：

1. `npm run build` 能成功
2. WebView2 Runtime 已安装

### Q3: macOS 应用无法直接双击打开

未签名应用可能被 Gatekeeper 拦截，可右键应用选择“打开”首次放行。正式分发建议做签名与公证。

## 6. 官方参考

- Tauri Prerequisites：
  - https://v2.tauri.app/start/prerequisites/
- Tauri Windows 分发：
  - https://v2.tauri.app/distribute/windows-installer/
- Tauri macOS 分发：
  - https://v2.tauri.app/distribute/macos-application-bundle/

