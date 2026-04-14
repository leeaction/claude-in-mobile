# 精简平台支持实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将项目从支持多平台（Android/iOS/Desktop/Aurora/Browser/Store）精简为仅支持 Android 和 iOS 平台（本地模拟器 + Sonic 远程设备）。

**Architecture:** 通过删除不需要的平台适配器、工具文件和 CLI 模块来简化代码库。保持 Sonic 远程设备支持不变。按依赖关系顺序修改文件，确保编译始终通过。

**Tech Stack:** TypeScript (MCP Server), Rust (CLI), Node.js, Cargo

---

## 文件结构概览

### 需要删除的文件

**TypeScript (MCP Server):**
- `src/adapters/desktop-adapter.ts`
- `src/adapters/aurora-adapter.ts`
- `src/adapters/browser-adapter.ts`
- `src/desktop/` (整个目录)
- `src/aurora/` (整个目录)
- `src/browser/` (整个目录)
- `src/store/` (整个目录)
- `src/tools/desktop-tools.ts`
- `src/tools/aurora-tools.ts`
- `src/tools/browser-tools.ts`
- `src/tools/store-tools.ts`
- `src/tools/huawei-tools.ts`
- `src/tools/rustore-tools.ts`
- `src/store/google-play.test.ts`
- `desktop-companion/` (整个目录)

**Rust (CLI):**
- `cli/src/aurora.rs`
- `cli/src/desktop.rs`

### 需要修改的文件

**TypeScript:**
- `src/index.ts` - 移除工具导入和注册
- `src/device-manager.ts` - 移除适配器
- `src/adapters/index.ts` - 移除导出
- `src/tools/device-tools.ts` - 更新 platform enum
- `src/tools/clipboard-tools.ts` - 移除 desktop 支持
- `src/tools/context.ts` - 移除客户端访问方法
- `src/client-adapter.ts` - 更新 instructions
- `package.json` - 更新描述和脚本

**Rust:**
- `cli/Cargo.toml` - 更新 description
- `cli/src/platform.rs` - 简化 Platform enum
- `cli/src/main.rs` - 移除 desktop/aurora 命令

---

## Task 1: 删除不需要的适配器文件

**Files:**
- Delete: `src/adapters/desktop-adapter.ts`
- Delete: `src/adapters/aurora-adapter.ts`
- Delete: `src/adapters/browser-adapter.ts`
- Modify: `src/adapters/index.ts`

- [ ] **Step 1: 删除 desktop-adapter.ts**

```bash
rm src/adapters/desktop-adapter.ts
```

- [ ] **Step 2: 删除 aurora-adapter.ts**

```bash
rm src/adapters/aurora-adapter.ts
```

- [ ] **Step 3: 删除 browser-adapter.ts**

```bash
rm src/adapters/browser-adapter.ts
```

- [ ] **Step 4: 更新 adapters/index.ts**

将文件内容替换为：

```typescript
export type { PlatformAdapter } from "./platform-adapter.js";
export { AndroidAdapter } from "./android-adapter.js";
export { IosAdapter } from "./ios-adapter.js";
```

- [ ] **Step 5: 验证文件已删除**

```bash
ls src/adapters/
```

Expected: `android-adapter.ts`, `ios-adapter.ts`, `index.ts`, `platform-adapter.ts`

- [ ] **Step 6: Commit**

```bash
git add src/adapters/
git commit -m "refactor: remove desktop, aurora, browser adapters"
```

---

## Task 2: 删除客户端实现目录

**Files:**
- Delete: `src/desktop/` (整个目录)
- Delete: `src/aurora/` (整个目录)
- Delete: `src/browser/` (整个目录)

- [ ] **Step 1: 删除 desktop 目录**

```bash
rm -rf src/desktop/
```

- [ ] **Step 2: 删除 aurora 目录**

```bash
rm -rf src/aurora/
```

- [ ] **Step 3: 删除 browser 目录**

```bash
rm -rf src/browser/
```

- [ ] **Step 4: 验证目录已删除**

```bash
ls src/
```

Expected: `adb/`, `adapters/`, `client-adapter.ts`, `device-manager.ts`, `errors.ts`, `index.ts`, `ios/`, `sonic/`, `tools/`, `utils/`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove desktop, aurora, browser client implementations"
```

---

## Task 3: 删除商店相关文件

**Files:**
- Delete: `src/store/` (整个目录)
- Delete: `src/tools/store-tools.ts`
- Delete: `src/tools/huawei-tools.ts`
- Delete: `src/tools/rustore-tools.ts`

- [ ] **Step 1: 删除 store 目录**

```bash
rm -rf src/store/
```

- [ ] **Step 2: 删除商店工具文件**

```bash
rm src/tools/store-tools.ts
rm src/tools/huawei-tools.ts
rm src/tools/rustore-tools.ts
```

- [ ] **Step 3: 验证文件已删除**

```bash
ls src/tools/
```

Expected: `app-tools.ts`, `clipboard-tools.ts`, `context.ts`, `device-tools.ts`, `flow-tools.ts`, `interaction-tools.ts`, `permission-tools.ts`, `registry.test.ts`, `registry.ts`, `screenshot-tools.ts`, `system-tools.ts`, `ui-tools.ts`

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: remove store management tools (Google Play, Huawei, RuStore)"
```

---

## Task 4: 删除专用工具文件

**Files:**
- Delete: `src/tools/desktop-tools.ts`
- Delete: `src/tools/aurora-tools.ts`
- Delete: `src/tools/browser-tools.ts`

- [ ] **Step 1: 删除工具文件**

```bash
rm src/tools/desktop-tools.ts
rm src/tools/aurora-tools.ts
rm src/tools/browser-tools.ts
```

- [ ] **Step 2: 验证**

```bash
ls src/tools/
```

Expected 不包含: `desktop-tools.ts`, `aurora-tools.ts`, `browser-tools.ts`

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor: remove desktop, aurora, browser specific tools"
```

---

## Task 5: 更新主入口文件 (index.ts)

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: 读取当前 index.ts 内容**

```bash
cat src/index.ts
```

- [ ] **Step 2: 更新导入语句**

移除以下导入：
```typescript
import { desktopTools } from "./tools/desktop-tools.js";
import { auroraTools } from "./tools/aurora-tools.js";
import { browserTools } from "./tools/browser-tools.js";
import { storeTools } from "./tools/store-tools.js";
import { huaweiTools } from "./tools/huawei-tools.js";
import { ruStoreTools } from "./tools/rustore-tools.js";
```

- [ ] **Step 3: 更新 registerTools 调用**

将：
```typescript
registerTools([
  ...deviceTools,
  ...screenshotTools,
  ...interactionTools,
  ...uiTools,
  ...appTools,
  ...permissionTools,
  ...systemTools,
  ...desktopTools,
  ...auroraTools,
  ...flowTools,
  ...clipboardTools,
  ...browserTools,
  ...storeTools,
  ...huaweiTools,
  ...ruStoreTools,
]);
```

改为：
```typescript
registerTools([
  ...deviceTools,
  ...screenshotTools,
  ...interactionTools,
  ...uiTools,
  ...appTools,
  ...permissionTools,
  ...systemTools,
  ...flowTools,
  ...clipboardTools,
]);
```

- [ ] **Step 4: 更新别名映射**

移除以下别名：
```typescript
// desktop
"launch_desktop_app": "desktop_launch",
"stop_desktop_app": "desktop_stop",
"get_window_info": "desktop_windows",
"focus_window": "desktop_focus",
"resize_window": "desktop_resize",
"get_performance_metrics": "desktop_performance",
"get_monitors": "desktop_monitors",
"get_clipboard": "clipboard_get",
"set_clipboard": "clipboard_set",
// clipboard (desktop aliases)
"select_text": "clipboard_select",
"copy_text": "clipboard_copy",
"paste_text": "clipboard_paste",
"get_clipboard_android": "clipboard_get_android",
// file (aurora)
"push_file": "file_push",
"pull_file": "file_pull",
```

- [ ] **Step 5: 更新 server instructions**

将：
```typescript
instructions: "Mobile, desktop, browser automation + store management (Google Play, Huawei AppGallery, RuStore). IMPORTANT: Always use 'ui_tree' first to inspect the screen — it is text-based and ~10x cheaper than screenshots. Use 'screen_capture' only as fallback when visual verification is required or ui_tree is insufficient. Use 'input_tap' to interact. For stores: 'store_upload' → 'store_set_notes' → 'store_submit' (Google Play), 'huawei_upload' → 'huawei_set_notes' → 'huawei_submit' (Huawei), 'rustore_upload' → 'rustore_set_notes' → 'rustore_submit' (RuStore). Use 'device_list' to see connected devices.",
```

改为：
```typescript
instructions: "Mobile automation for Android and iOS. IMPORTANT: Always use 'ui_tree' first to inspect the screen — it is text-based and ~10x cheaper than screenshots. Use 'screen_capture' only as fallback when visual verification is required or ui_tree is insufficient. Use 'input_tap' to interact. Use 'device_list' to see connected devices.",
```

- [ ] **Step 6: 更新启动日志**

将：
```typescript
console.error("Claude Mobile MCP server running (Android + iOS + Desktop + Aurora + Browser)");
```

改为：
```typescript
console.error("Claude Mobile MCP server running (Android + iOS)");
```

- [ ] **Step 7: 编译验证**

```bash
npm run build
```

Expected: 编译成功，无错误

- [ ] **Step 8: Commit**

```bash
git add src/index.ts
git commit -m "refactor: update index.ts to only support android and ios"
```

---

## Task 6: 更新 DeviceManager

**Files:**
- Modify: `src/device-manager.ts`

- [ ] **Step 1: 更新导入语句**

移除：
```typescript
import { DesktopAdapter } from "./adapters/desktop-adapter.js";
import { AuroraAdapter } from "./adapters/aurora-adapter.js";
import { BrowserAdapter } from "./adapters/browser-adapter.js";
import { DesktopClient } from "./desktop/client.js";
import type { AuroraClient } from "./aurora/index.js";
import type { LaunchOptions } from "./desktop/types.js";
```

- [ ] **Step 2: 更新 Platform 类型**

将：
```typescript
export type Platform = "android" | "ios" | "desktop" | "aurora" | "browser";
```

改为：
```typescript
export type Platform = "android" | "ios";
```

- [ ] **Step 3: 移除适配器字段**

从类中移除：
```typescript
private desktopAdapter: DesktopAdapter;
private auroraAdapter: AuroraAdapter;
private browserAdapter: BrowserAdapter;
```

- [ ] **Step 4: 简化构造函数**

移除 desktop/aurora/browser 适配器的初始化和 adapters Map 中的相关条目。

- [ ] **Step 5: 移除 Desktop 相关方法**

移除以下方法：
- `launchDesktopApp`
- `stopDesktopApp`
- `isDesktopRunning`
- `getDesktopClient`
- `getAuroraClient`

- [ ] **Step 6: 简化 getAdapter 方法**

移除 desktop/browser 的特殊处理逻辑。

- [ ] **Step 7: 简化 getTarget 方法**

移除 desktop 的特殊处理。

- [ ] **Step 8: 简化 getAllDevices 方法**

移除 aurora 和 browser 的设备列表获取。

- [ ] **Step 9: 简化 setDevice 方法**

移除 desktop 的特殊处理。

- [ ] **Step 10: 简化 getActiveDevice 方法**

移除 desktop 的特殊处理。

- [ ] **Step 11: 编译验证**

```bash
npm run build
```

- [ ] **Step 12: Commit**

```bash
git add src/device-manager.ts
git commit -m "refactor: simplify DeviceManager to only support android and ios"
```

---

## Task 7: 更新工具文件

### 7.1 更新 device-tools.ts

**Files:**
- Modify: `src/tools/device-tools.ts`

- [ ] **Step 1: 更新 platform enum**

将所有 `enum: ["android", "ios", "desktop", "aurora", "browser"]` 改为 `enum: ["android", "ios"]`

- [ ] **Step 2: 简化设备列表展示**

移除 desktop、aurora、browser 的设备列表展示逻辑。

- [ ] **Step 3: Commit**

```bash
git add src/tools/device-tools.ts
git commit -m "refactor: update device-tools to only support android and ios"
```

### 7.2 更新 clipboard-tools.ts

**Files:**
- Modify: `src/tools/clipboard-tools.ts`

- [ ] **Step 1: 读取当前内容**

```bash
cat src/tools/clipboard-tools.ts
```

- [ ] **Step 2: 移除 desktop 相关工具**

如果存在 desktop 专用的剪贴板工具，将其移除。

- [ ] **Step 3: Commit**

```bash
git add src/tools/clipboard-tools.ts
git commit -m "refactor: remove desktop support from clipboard-tools"
```

### 7.3 更新 context.ts

**Files:**
- Modify: `src/tools/context.ts`

- [ ] **Step 1: 读取当前内容**

```bash
cat src/tools/context.ts
```

- [ ] **Step 2: 移除客户端访问方法**

移除 `getDesktopClient`、`getAuroraClient`、`getBrowserAdapter` 等方法。

- [ ] **Step 3: Commit**

```bash
git add src/tools/context.ts
git commit -m "refactor: remove desktop/aurora/browser client accessors from context"
```

---

## Task 8: 更新 client-adapter.ts

**Files:**
- Modify: `src/client-adapter.ts`

- [ ] **Step 1: 更新 INSTRUCTIONS**

将所有 instructions 中的 "desktop"、"aurora" 提及移除。

例如：
```typescript
"claude-code": "Mobile automation server. Supports Android (ADB) and iOS Simulator (simctl+WDA). Use 'screen_capture' to see the screen, 'input_tap' to interact with elements, 'ui_tree' for the accessibility tree.",
```

- [ ] **Step 2: Commit**

```bash
git add src/client-adapter.ts
git commit -m "refactor: update client instructions to only mention android and ios"
```

---

## Task 9: 更新 package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 更新 description**

将：
```json
"description": "MCP server for mobile, desktop and browser automation - Android (ADB), iOS Simulator (simctl), Desktop (Compose), Browser (CDP)"
```

改为：
```json
"description": "MCP server for mobile automation - Android (ADB) and iOS Simulator (simctl)"
```

- [ ] **Step 2: 更新 keywords**

移除 "desktop", "browser", "compose", "cdp" 等关键词。

- [ ] **Step 3: 移除 desktop-companion 相关脚本**

移除：
```json
"build:desktop": "cd desktop-companion && ./gradlew installDist",
"build:all": "npm run build && npm run build:desktop",
```

- [ ] **Step 4: 更新 files 配置**

移除 desktop-companion 相关文件配置。

- [ ] **Step 5: Commit**

```bash
git add package.json
git commit -m "refactor: update package.json for simplified platform support"
```

---

## Task 10: 删除 desktop-companion 目录

**Files:**
- Delete: `desktop-companion/` (整个目录)

- [ ] **Step 1: 删除目录**

```bash
rm -rf desktop-companion/
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "refactor: remove desktop-companion application"
```

---

## Task 11: 更新 Rust CLI

### 11.1 更新 Cargo.toml

**Files:**
- Modify: `cli/Cargo.toml`

- [ ] **Step 1: 更新 description**

将：
```toml
description = "Fast native CLI for mobile device automation (Android/iOS/Aurora/Desktop)"
```

改为：
```toml
description = "Fast native CLI for mobile device automation (Android/iOS)"
```

- [ ] **Step 2: Commit**

```bash
git add cli/Cargo.toml
git commit -m "refactor(cli): update description for simplified platforms"
```

### 11.2 更新 platform.rs

**Files:**
- Modify: `cli/src/platform.rs`

- [ ] **Step 1: 简化 Platform enum**

将文件内容替换为：

```rust
//! Platform enum and utilities

use std::fmt;
use std::str::FromStr;
use anyhow::{Result, bail};

/// Supported platforms
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Platform {
    Android,
    Ios,
}

impl FromStr for Platform {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self> {
        match s.to_lowercase().as_str() {
            "android" => Ok(Platform::Android),
            "ios" => Ok(Platform::Ios),
            _ => bail!("Unknown platform: {}. Use 'android' or 'ios'", s),
        }
    }
}

impl fmt::Display for Platform {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Platform::Android => write!(f, "android"),
            Platform::Ios => write!(f, "ios"),
        }
    }
}

impl Platform {
    pub fn is_android(&self) -> bool {
        matches!(self, Platform::Android)
    }

    pub fn is_ios(&self) -> bool {
        matches!(self, Platform::Ios)
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add cli/src/platform.rs
git commit -m "refactor(cli): simplify Platform enum to android and ios only"
```

### 11.3 删除 aurora.rs 和 desktop.rs

**Files:**
- Delete: `cli/src/aurora.rs`
- Delete: `cli/src/desktop.rs`

- [ ] **Step 1: 删除文件**

```bash
rm cli/src/aurora.rs
rm cli/src/desktop.rs
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "refactor(cli): remove aurora and desktop modules"
```

### 11.4 更新 main.rs

**Files:**
- Modify: `cli/src/main.rs`

- [ ] **Step 1: 更新模块导入**

移除：
```rust
mod aurora;
mod desktop;
```

- [ ] **Step 2: 更新 Commands enum**

对于每个包含 platform 参数的命令，更新其 value_parser：

将：
```rust
#[arg(value_parser = ["android", "ios", "aurora", "desktop"])]
```

改为：
```rust
#[arg(value_parser = ["android", "ios"])]
```

特殊处理：
- `Commands::Devices`: 改为 `["android", "ios", "all"]`
- `Commands::UiDump`: 改为 `["android", "ios"]`
- `Commands::Annotate`: 改为 `["android", "ios"]`
- `Commands::Find`: 改为 `["android", "ios"]`
- `Commands::TapText`: 改为 `["android", "ios"]`
- `Commands::CurrentActivity`: 改为 `["android", "ios"]`
- `Commands::ScreenSize`: 改为 `["android", "ios"]`
- `Commands::Reboot`: 改为 `["android", "ios"]`

- [ ] **Step 3: 移除 Desktop-only 命令**

完全移除以下 Commands 变体：
- `GetPerformanceMetrics`
- `GetMonitors`
- `LaunchDesktopApp`
- `StopDesktopApp`
- `GetWindowInfo`
- `FocusWindow`
- `ResizeWindow`

- [ ] **Step 4: 移除 companion_path 参数**

从所有命令中移除 `companion_path` 参数。

- [ ] **Step 5: 移除 aurora 支持**

从 `PushFile` 和 `PullFile` 命令中移除 aurora 支持。

- [ ] **Step 6: 更新 run 函数**

移除所有 desktop 和 aurora 的命令处理分支，只保留 android 和 ios 的处理。

- [ ] **Step 7: 编译验证**

```bash
cd cli && cargo build
```

Expected: 编译成功

- [ ] **Step 8: Commit**

```bash
git add cli/src/main.rs
git commit -m "refactor(cli): update main.rs to only support android and ios"
```

---

## Task 12: 最终验证

- [ ] **Step 1: TypeScript 编译验证**

```bash
npm run build
```

Expected: 编译成功，无错误

- [ ] **Step 2: Rust 编译验证**

```bash
cd cli && cargo build
```

Expected: 编译成功，无警告

- [ ] **Step 3: 运行测试（如果有）**

```bash
npm test
```

- [ ] **Step 4: 检查剩余文件**

确认以下文件/目录已删除：
- `src/adapters/desktop-adapter.ts`
- `src/adapters/aurora-adapter.ts`
- `src/adapters/browser-adapter.ts`
- `src/desktop/`
- `src/aurora/`
- `src/browser/`
- `src/store/`
- `src/tools/desktop-tools.ts`
- `src/tools/aurora-tools.ts`
- `src/tools/browser-tools.ts`
- `src/tools/store-tools.ts`
- `src/tools/huawei-tools.ts`
- `src/tools/rustore-tools.ts`
- `desktop-companion/`
- `cli/src/aurora.rs`
- `cli/src/desktop.rs`

- [ ] **Step 5: 最终 Commit**

```bash
git add -A
git commit -m "chore: finalize platform simplification - only android and ios supported"
```

---

## 总结

实施完成后，项目将仅支持：
- Android（本地 ADB + Sonic 远程）
- iOS（本地 simctl + Sonic 远程）

所有 Desktop、Aurora、Browser 和 Store 相关的代码将被移除，代码库将显著简化。
