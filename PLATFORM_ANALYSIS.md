# 平台支持分析与精简方案

## 项目概述

本项目包含两个主要组件：
1. **MCP 服务器**（TypeScript/Node.js）- 提供 Model Context Protocol 接口
2. **CLI 工具**（Rust）- 提供命令行接口

---

## 一、MCP 服务器分析

### 1.1 当前支持的平台（5个）

```typescript
export type Platform = "android" | "ios" | "desktop" | "aurora" | "browser";
```

- **Android** - 通过 ADB 连接 Android 设备/模拟器
- **iOS** - 通过 simctl 连接 iOS 模拟器
- **Desktop** - Compose Desktop 应用自动化
- **Aurora** - Aurora OS 设备
- **Browser** - 浏览器自动化（Chrome DevTools Protocol）

### 1.2 设备连接方式

#### 本地设备
- **Android**: ADB 连接（`src/adb/client.ts`）
- **iOS**: simctl + WebDriverAgent（`src/ios/client.ts`）
- **Desktop**: Gradle + Java Robot API（`src/desktop/client.ts`）
- **Aurora**: SSH 连接（`src/aurora/client.ts`）
- **Browser**: Chrome DevTools Protocol（`src/browser/client.ts`）

#### 远程设备（Sonic）
- **Android**: `src/sonic/sonic-android-adapter.ts`
- **iOS**: `src/sonic/sonic-ios-adapter.ts`
- **其他平台**: 无 Sonic 支持

### 1.3 代码结构

```
DeviceManager (设备管理器)
    ↓
PlatformAdapter (平台适配器接口)
    ↓
具体平台实现
    ├── AndroidAdapter → AdbClient / SonicAndroidAdapter
    ├── IosAdapter → IosClient / SonicIosAdapter
    ├── DesktopAdapter → DesktopClient
    ├── AuroraAdapter → AuroraClient
    └── BrowserAdapter → BrowserClient
```

### 1.4 文件分布

#### Adapter层（`src/adapters/`）
- `platform-adapter.ts` - 接口定义 ✅ 保留
- `android-adapter.ts` - ✅ 保留
- `ios-adapter.ts` - ✅ 保留
- `desktop-adapter.ts` - ❌ 删除
- `aurora-adapter.ts` - ❌ 删除
- `browser-adapter.ts` - ❌ 删除

#### Client层（平台特定实现）
- `src/adb/` - ✅ 保留（Android ADB）
- `src/ios/` - ✅ 保留（iOS simctl + WDA）
- `src/desktop/` - ❌ 删除
- `src/aurora/` - ❌ 删除
- `src/browser/` - ❌ 删除
- `src/store/` - ❌ 删除（商店发布功能）

#### Sonic层（远程设备）
- `src/sonic/sonic-device-source.ts` - ✅ 保留
- `src/sonic/sonic-ws-client.ts` - ✅ 保留
- `src/sonic/sonic-android-adapter.ts` - ✅ 保留
- `src/sonic/sonic-ios-adapter.ts` - ✅ 保留

#### Tools层（MCP工具定义）

**通用工具** - ✅ 全部保留
- `device-tools.ts` - 设备管理（4个工具）
- `screenshot-tools.ts` - 截图（2个工具）
- `interaction-tools.ts` - 交互（6个工具）
- `ui-tools.ts` - UI检查（7个工具）
- `app-tools.ts` - 应用管理（4个工具）
- `permission-tools.ts` - 权限管理（3个工具）
- `system-tools.ts` - 系统操作（7个工具）
- `clipboard-tools.ts` - 剪贴板（4个工具）
- `flow-tools.ts` - 批量操作（2个工具）

**平台特定工具** - ❌ 全部删除
- `desktop-tools.ts` - ❌ 删除（8个工具）
- `aurora-tools.ts` - ❌ 删除（2个工具）
- `browser-tools.ts` - ❌ 删除（15个工具）
- `store-tools.ts` - ❌ 删除（Google Play）
- `huawei-tools.ts` - ❌ 删除（华为应用市场）
- `rustore-tools.ts` - ❌ 删除（RuStore）

---

## 二、CLI 工具分析

### 2.1 当前支持的平台（4个）

```rust
pub enum Platform {
    Android,
    Ios,
    Desktop,
    Aurora,
}
```

注意：CLI 不支持 Browser 平台

### 2.2 模块结构

- `cli/src/android.rs` - ❌ 部分保留（移除 Aurora 相关）
- `cli/src/ios.rs` - ✅ 保留
- `cli/src/desktop.rs` - ❌ 删除
- `cli/src/aurora.rs` - ❌ 删除
- `cli/src/sonic.rs` - ✅ 保留
- `cli/src/screenshot.rs` - ✅ 保留
- `cli/src/platform.rs` - ✅ 修改（只保留 Android 和 iOS）

### 2.3 CLI 命令统计

#### 通用命令（支持多平台）
1. **Screenshot** - android, ios, aurora, desktop
2. **Annotate** - android, ios
3. **Tap** - android, ios, aurora, desktop
4. **Swipe** - android, ios, aurora
5. **Input** - android, ios, aurora, desktop
6. **Key** - android, ios, aurora, desktop
7. **UiDump** - android, ios, desktop
8. **Devices** - android, ios, aurora, all
9. **Apps** - android, ios, aurora
10. **Launch** - android, ios, aurora, desktop
11. **Stop** - android, ios, aurora, desktop
12. **Install** - android, ios, aurora
13. **Uninstall** - android, ios, aurora
14. **Find** - android, ios
15. **Logs** - android, ios, aurora
16. **ClearLogs** - android, ios, aurora
17. **SystemInfo** - android, ios, aurora
18. **LongPress** - android, ios, aurora
19. **OpenUrl** - android, ios, aurora
20. **Shell** - android, ios, aurora
21. **Wait** - 通用
22. **ScreenSize** - android, ios

#### Android 特定命令
23. **TapText** - android, desktop
24. **CurrentActivity** - android, aurora
25. **Reboot** - android, aurora
26. **Screen** - android only
27. **AnalyzeScreen** - android only
28. **FindAndTap** - android only

#### 文件传输命令
29. **PushFile** - android, aurora
30. **PullFile** - android, aurora

#### 剪贴板命令
31. **GetClipboard** - android, ios, desktop
32. **SetClipboard** - android, ios, desktop

#### Desktop 特定命令 - ❌ 全部删除
33. **GetPerformanceMetrics** - desktop only
34. **GetMonitors** - desktop only
35. **LaunchDesktopApp** - desktop only
36. **StopDesktopApp** - desktop only
37. **GetWindowInfo** - desktop only
38. **FocusWindow** - desktop only
39. **ResizeWindow** - desktop only

**总计**: 39个命令
- 需要删除: 7个 Desktop 特定命令
- 需要修改: 约 20个命令（移除 aurora/desktop 平台支持）
- 保留: 约 25个命令（Android/iOS）

---

## 三、精简方案

### 3.1 目标

1. 只保留 **Android** 和 **iOS** 平台
2. 支持 **本地设备**（ADB + simctl）
3. 支持 **远程Sonic设备**
4. 保持核心自动化功能完整
5. **移除所有商店发布功能**
6. **移除 Desktop 和 Aurora 平台**

### 3.2 MCP 服务器修改

#### 删除目录
```bash
rm -rf src/desktop/
rm -rf src/aurora/
rm -rf src/browser/
rm -rf src/store/
rm -rf desktop-companion/
rm -rf dist/desktop/
rm -rf dist/aurora/
rm -rf dist/browser/
rm -rf dist/store/
```

#### 删除文件
```bash
# Adapters
rm src/adapters/desktop-adapter.ts
rm src/adapters/aurora-adapter.ts
rm src/adapters/browser-adapter.ts

# Tools
rm src/tools/desktop-tools.ts
rm src/tools/aurora-tools.ts
rm src/tools/browser-tools.ts
rm src/tools/store-tools.ts
rm src/tools/huawei-tools.ts
rm src/tools/rustore-tools.ts
```

#### 修改 `src/device-manager.ts`
```typescript
// 修改前
export type Platform = "android" | "ios" | "desktop" | "aurora" | "browser";

// 修改后
export type Platform = "android" | "ios";
```

移除：
- `desktopAdapter`, `auroraAdapter`, `browserAdapter` 属性
- 相关构造函数初始化
- Desktop/Aurora/Browser 特定方法
- `getDesktopClient()`, `getAuroraClient()`, `getBrowserAdapter()`
- `isDesktopRunning()`

#### 修改 `src/index.ts`

移除导入：
```typescript
import { desktopTools } from "./tools/desktop-tools.js";
import { auroraTools } from "./tools/aurora-tools.js";
import { browserTools } from "./tools/browser-tools.js";
import { storeTools } from "./tools/store-tools.js";
import { huaweiTools } from "./tools/huawei-tools.js";
import { ruStoreTools } from "./tools/rustore-tools.js";
```

移除注册：
```typescript
registerTools([
  // 删除这些
  ...desktopTools,
  ...auroraTools,
  ...browserTools,
  ...storeTools,
  ...huaweiTools,
  ...ruStoreTools,
]);
```

更新启动日志：
```typescript
// 修改前
console.error("Claude Mobile MCP server running (Android + iOS + Desktop + Aurora + Browser)");

// 修改后
console.error("Claude Mobile MCP server running (Android + iOS)");
```

#### 修改 `package.json`

移除依赖：
```json
"dependencies": {
  // 删除以下三个
  // "chrome-launcher": "^1.1.0",
  // "chrome-remote-interface": "^0.33.0",
  // "google-auth-library": "^10.6.2",
}
```

更新描述：
```json
{
  "description": "MCP server for mobile automation - Android (ADB + Sonic) and iOS (simctl + Sonic)",
  "keywords": [
    "mcp",
    "android",
    "ios",
    "mobile",
    "automation",
    "adb",
    "simctl",
    "sonic",
    "claude",
    "anthropic",
    "model-context-protocol"
  ]
}
```

移除构建脚本：
```json
// 删除
"build:desktop": "cd desktop-companion && ./gradlew installDist",
"build:all": "npm run build && npm run build:desktop",
```

### 3.3 CLI 工具修改

#### 删除文件
```bash
rm cli/src/desktop.rs
rm cli/src/aurora.rs
```

#### 修改 `cli/src/platform.rs`
```rust
// 修改前
pub enum Platform {
    Android,
    Ios,
    Desktop,
    Aurora,
}

// 修改后
pub enum Platform {
    Android,
    Ios,
}
```

移除相关的 `FromStr` 和 `Display` 实现中的 Desktop/Aurora 分支。

#### 修改 `cli/src/lib.rs`
```rust
// 修改前
pub mod android;
pub mod aurora;
pub mod desktop;
pub mod ios;

// 修改后
pub mod android;
pub mod ios;
```

#### 修改 `cli/src/main.rs`

删除模块导入：
```rust
// 删除
mod aurora;
mod desktop;
```

删除命令：
- `GetPerformanceMetrics`
- `GetMonitors`
- `LaunchDesktopApp`
- `StopDesktopApp`
- `GetWindowInfo`
- `FocusWindow`
- `ResizeWindow`

修改命令的平台参数：
- 将所有 `["android", "ios", "aurora", "desktop"]` 改为 `["android", "ios"]`
- 将所有 `["android", "ios", "aurora"]` 改为 `["android", "ios"]`
- 将所有 `["android", "ios", "desktop"]` 改为 `["android", "ios"]`

删除命令实现中的 aurora/desktop 分支：
```rust
// 删除这些分支
"aurora" => aurora::xxx(),
"desktop" => desktop::xxx(),
```

#### 修改 `cli/Cargo.toml`
```toml
# 修改前
description = "Fast native CLI for mobile device automation (Android/iOS/Aurora/Desktop)"

# 修改后
description = "Fast native CLI for mobile device automation (Android/iOS)"
```

---

## 四、保留的功能

### 4.1 Android 平台
✅ 本地 ADB 连接
✅ Sonic 远程连接
✅ 所有通用工具（tap, swipe, screenshot, ui_tree等）
✅ 应用管理（install, launch, stop, uninstall）
✅ 权限管理
✅ 剪贴板操作
✅ WebView 检查
✅ 系统日志
✅ UI 分析和查找

### 4.2 iOS 平台
✅ 本地 simctl 连接
✅ Sonic 远程连接
✅ 所有通用工具
✅ 应用管理
✅ 权限管理
✅ 剪贴板操作
✅ 系统日志

### 4.3 Sonic 支持
✅ 设备发现和连接
✅ WebSocket 通信
✅ Android 和 iOS 适配器
✅ 自动设备管理

---

## 五、影响评估

### 5.1 移除的功能
❌ Desktop 应用自动化（Compose Desktop）
❌ Aurora OS 支持
❌ 浏览器自动化（Chrome DevTools）
❌ Desktop 特定工具（窗口管理、性能监控等）
❌ Aurora 文件传输（push/pull）
❌ Browser 工具（导航、点击、表单填充等）
❌ 商店发布功能（Google Play, Huawei, RuStore）

### 5.2 保留的核心能力
✅ Android 和 iOS 的完整自动化能力
✅ 本地设备和远程 Sonic 设备支持
✅ 所有移动端通用工具
✅ 高性能 CLI 工具（Rust）
✅ MCP 协议完整支持

### 5.3 代码量减少估算

#### MCP 服务器
- 删除约 **4个平台实现目录**（desktop, aurora, browser, store）
- 删除约 **9个 adapter/tools 文件**
- 删除约 **1个完整的 Gradle 项目**（desktop-companion）
- 删除约 **3个 npm 依赖**
- 预计减少 **40-50%** 的代码量

#### CLI 工具
- 删除约 **2个平台实现文件**（desktop.rs, aurora.rs）
- 修改约 **20个命令**（移除平台支持）
- 删除约 **7个命令**
- 预计减少 **30-35%** 的代码量

### 5.4 工具统计

#### MCP 服务器
- **删除的工具**: ~42个（Desktop 8 + Aurora 2 + Browser 15 + Store 17）
- **保留的工具**: ~39个（通用工具）

#### CLI 工具
- **删除的命令**: 7个（Desktop 特定）
- **修改的命令**: ~20个（移除 aurora/desktop 支持）
- **保留的命令**: ~25个（Android/iOS）

---

## 六、实施步骤

### Phase 1: 准备工作
1. ✅ 完成当前分析
2. 创建备份分支 `git checkout -b backup/platform-full`
3. 创建工作分支 `git checkout -b feature/slim-platform-android-ios`
4. 确认没有未提交的更改

### Phase 2: MCP 服务器修改
1. 删除目录和文件
2. 修改 `src/device-manager.ts`
3. 修改 `src/index.ts`
4. 修改 `package.json`
5. 运行 `npm install`

### Phase 3: CLI 工具修改
1. 删除 `cli/src/desktop.rs` 和 `cli/src/aurora.rs`
2. 修改 `cli/src/platform.rs`
3. 修改 `cli/src/lib.rs`
4. 修改 `cli/src/main.rs`
5. 修改 `cli/Cargo.toml`

### Phase 4: 测试验证
1. MCP 服务器：
   - 运行 `npm run build`
   - 运行 `npm test`
   - 测试 Android 本地设备
   - 测试 iOS 本地设备
   - 测试 Sonic 连接（如果可用）

2. CLI 工具：
   - 运行 `cd cli && cargo build`
   - 运行 `cargo test`
   - 测试基本命令

### Phase 5: 文档更新
1. 更新 README.md
2. 更新相关文档
3. 删除 Desktop/Aurora/Browser 相关文档
4. 提交更改

### Phase 6: 清理
1. 删除未使用的测试文件
2. 清理配置文件
3. 更新 .gitignore（如需要）

---

## 七、风险和注意事项

### 7.1 潜在问题
1. **类型引用**: 确保没有其他文件引用被删除的平台类型
2. **测试文件**: 检查是否有 Desktop/Aurora/Browser/Store 的测试文件需要删除
3. **配置文件**: 检查是否有平台特定的配置需要清理
4. **文档**: 确保所有文档都更新到新的平台列表
5. **环境变量**: 检查是否有 Store 相关的环境变量文档需要清理
6. **CLI 依赖**: 确保 Rust 依赖没有 Desktop/Aurora 特定的库

### 7.2 兼容性
- MCP 协议保持不变
- 工具名称保持不变（Android/iOS 相关）
- Sonic 协议保持不变
- CLI 命令接口保持向后兼容（仅移除平台选项）

### 7.3 回滚方案
- 保留 Git 历史，可以随时恢复被删除的平台
- 备份分支 `backup/platform-full` 保存完整代码
- 可以通过 `git revert` 或 `git reset` 回滚

---

## 八、总结

### 8.1 精简后的项目特点

**专注移动端**
- 只支持 Android 和 iOS 两个移动平台
- 移除所有桌面和其他平台支持

**双连接方式**
- 本地设备：ADB（Android）+ simctl（iOS）
- 远程设备：Sonic（Android + iOS）

**核心功能完整**
- 所有移动端自动化能力保留
- UI 检查、交互、截图、应用管理等

**代码更简洁**
- MCP 服务器减少 40-50% 代码
- CLI 工具减少 30-35% 代码
- 总体减少约 40% 代码量

**维护更容易**
- 只需关注两个移动平台
- 减少 3 个 npm 依赖
- 移除复杂的 Desktop companion 项目

**性能更好**
- 更小的包体积
- 更快的构建速度
- 更少的依赖加载

### 8.2 适用场景

这个精简方案适合：
- 专注于移动应用测试的团队
- 需要 Android 和 iOS 自动化的项目
- 使用 Sonic 远程设备管理的场景
- 希望减少项目复杂度的维护者

### 8.3 项目定位

精简后的项目定位：
**纯移动端自动化 MCP 服务器**，专注于 Android 和 iOS 平台的本地和远程设备自动化，提供完整的 MCP 协议支持和高性能 CLI 工具。
