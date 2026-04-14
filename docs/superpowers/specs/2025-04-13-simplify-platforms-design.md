# 精简平台支持设计文档

## 目标
将项目从支持多平台（Android/iOS/Desktop/Aurora/Browser）精简为仅支持 Android 和 iOS 平台（本地模拟器 + Sonic 远程设备）。

## 背景
当前项目支持过多的平台类型，导致代码复杂度高、维护困难。根据实际需求，只需保留 Android 和 iOS 两个核心移动平台。

## 最终保留内容

### 平台支持
- ✅ Android（本地 ADB + Sonic 远程）
- ✅ iOS（本地 simctl + Sonic 远程）

### 核心工具
- 设备管理（device-tools）
- 截图（screenshot-tools）
- 交互操作（interaction-tools）
- UI 检查（ui-tools）
- 应用管理（app-tools）
- 权限管理（permission-tools）
- 系统操作（system-tools）
- 剪贴板（clipboard-tools，移除 desktop 相关）
- 流程控制（flow-tools）

## 需要移除的内容

### 1. MCP Server（TypeScript）

#### 删除的文件/目录
| 路径 | 说明 |
|------|------|
| `src/adapters/desktop-adapter.ts` | Desktop 平台适配器 |
| `src/adapters/aurora-adapter.ts` | Aurora 平台适配器 |
| `src/adapters/browser-adapter.ts` | Browser 平台适配器 |
| `src/desktop/` | Desktop 客户端实现 |
| `src/aurora/` | Aurora 客户端实现 |
| `src/browser/` | Browser 客户端实现 |
| `src/store/` | 应用商店管理（Google Play/Huawei/RuStore） |
| `src/tools/desktop-tools.ts` | Desktop 专用工具 |
| `src/tools/aurora-tools.ts` | Aurora 专用工具 |
| `src/tools/browser-tools.ts` | Browser 专用工具 |
| `src/tools/store-tools.ts` | Google Play 商店工具 |
| `src/tools/huawei-tools.ts` | 华为商店工具 |
| `src/tools/rustore-tools.ts` | RuStore 商店工具 |
| `src/store/google-play.test.ts` | 商店测试文件 |
| `desktop-companion/` | Desktop 伴侣应用 |

#### 需要修改的文件

**`src/index.ts`**
- 移除 desktop/aurora/browser/store/huawei/rustore 工具导入
- 更新 `registerTools` 调用，仅保留核心工具
- 移除 desktop/aurora/browser 相关的别名映射
- 更新 server instructions，仅提及 Android 和 iOS

**`src/device-manager.ts`**
- 移除 DesktopAdapter、AuroraAdapter、BrowserAdapter 导入
- 从 adapters Map 中移除 desktop/aurora/browser
- 移除 getBrowserAdapter、getDesktopClient、getAuroraClient 方法
- 移除 desktop 相关的特殊处理逻辑

**`src/adapters/index.ts`**
- 移除 DesktopAdapter、AuroraAdapter 导出

**`src/tools/device-tools.ts`**
- 更新 platform enum: `["android", "ios"]`
- 移除 desktop/aurora/browser 设备列表展示逻辑

**`src/tools/clipboard-tools.ts`**
- 移除 desktop 相关的剪贴板工具

**`src/tools/context.ts`**
- 移除 getDesktopClient、getAuroraClient、getBrowserAdapter 方法

**`src/client-adapter.ts`**
- 更新 INSTRUCTIONS，移除 desktop/aurora/browser 提及
- 更新 description

**`package.json`**
- 更新 description 和 keywords
- 移除 desktop-companion 相关脚本和文件配置

### 2. CLI（Rust）

#### 删除的文件
| 路径 | 说明 |
|------|------|
| `cli/src/aurora.rs` | Aurora 平台实现 |
| `cli/src/desktop.rs` | Desktop 平台实现 |

#### 需要修改的文件

**`cli/Cargo.toml`**
- 更新 description: `"Fast native CLI for mobile device automation (Android/iOS)"`

**`cli/src/platform.rs`**
```rust
// 更新前
pub enum Platform {
    Android,
    Ios,
    Desktop,
    Aurora,
}

// 更新后
pub enum Platform {
    Android,
    Ios,
}
```

**`cli/src/main.rs`**
- 移除 `mod aurora;` 和 `mod desktop;`
- 移除以下 Commands 变体：
  - `GetPerformanceMetrics`
  - `GetMonitors`
  - `LaunchDesktopApp`
  - `StopDesktopApp`
  - `GetWindowInfo`
  - `FocusWindow`
  - `ResizeWindow`
- 更新各命令的 platform 参数，移除 `aurora` 和 `desktop` 选项
- 移除所有 desktop/aurora 相关的命令处理分支
- 更新 `Commands::Devices` 的 platform 参数为 `["android", "ios", "all"]`

**`cli/README.md`**
- 更新文档，仅保留 Android 和 iOS 的说明

**`cli/plugin/`**
- 更新 `plugin.json` 和 `SKILL.md` 中的平台支持说明

## 平台类型定义变更

### 当前
```typescript
type Platform = "android" | "ios" | "desktop" | "aurora" | "browser";
```

### 更新后
```typescript
type Platform = "android" | "ios";
```

## Sonic 设备支持

Sonic 远程设备支持保持不变，继续支持通过 Sonic 云真平台连接远端 Android 和 iOS 设备。

相关文件：
- `src/sonic/sonic-device-source.ts`
- `src/sonic/sonic-android-adapter.ts`
- `src/sonic/sonic-ios-adapter.ts`
- `cli/src/sonic.rs`

## 验证清单

实施完成后需要验证：

1. **TypeScript 编译**
   - [ ] `npm run build` 成功
   - [ ] 无类型错误

2. **Rust CLI 编译**
   - [ ] `cargo build` 成功
   - [ ] 无编译警告

3. **功能测试**
   - [ ] Android 本地设备连接
   - [ ] iOS 本地模拟器连接
   - [ ] Sonic 远程 Android 设备
   - [ ] Sonic 远程 iOS 设备
   - [ ] 截图功能
   - [ ] 点击/滑动操作
   - [ ] 应用安装/启动/停止

## 影响评估

### 破坏性变更
- 移除 Desktop/Aurora/Browser 平台支持
- 移除应用商店管理功能
- CLI 命令参数变更

### 迁移指南
对于使用被移除平台的用户：
- Desktop 自动化：使用专门的桌面自动化工具
- Browser 自动化：使用 Playwright/Puppeteer 等专门工具
- 应用商店管理：使用各平台官方 CLI 工具

## 后续优化

1. 简化后的代码库更容易维护
2. 可以专注于优化 Android/iOS 的核心体验
3. 减少依赖包大小
4. 提高启动速度
