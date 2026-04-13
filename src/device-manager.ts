/**
 * DeviceManager — thin orchestrator that delegates to platform adapters.
 *
 * Refactored from a 715-line God Object into a ~230-line routing layer.
 * All platform-specific logic lives in src/adapters/*.
 *
 * FIX #8: auto-detect device when no deviceId is selected — see getAdapter().
 */

import type { PlatformAdapter } from "./adapters/platform-adapter.js";
import { AndroidAdapter } from "./adapters/android-adapter.js";
import { IosAdapter } from "./adapters/ios-adapter.js";

import { SonicDeviceSource } from "./sonic/sonic-device-source.js";
import { SonicAndroidAdapter } from "./sonic/sonic-android-adapter.js";
import { SonicIosAdapter } from "./sonic/sonic-ios-adapter.js";

import { AdbClient } from "./adb/client.js";
import { IosClient } from "./ios/client.js";
import type { CompressOptions } from "./utils/image.js";
import { WebViewInspector } from "./adb/webview.js";

export type Platform = "android" | "ios";

export interface Device {
  id: string;
  name: string;
  platform: Platform;
  state: string;
  isSimulator: boolean;
}

export class DeviceManager {
  private androidAdapter: AndroidAdapter;
  private iosAdapter: IosAdapter;

  private adapters: Map<Platform, PlatformAdapter>;
  private activeDevice?: Device;
  private activeTarget: Platform = "android";
  private webViewInspector?: WebViewInspector;

  private sonicSource?: SonicDeviceSource;
  private sonicEnabled = false;
  private activeSonicAdapter?: SonicAndroidAdapter | SonicIosAdapter;

  constructor() {
    const androidDeviceId = process.env.DEVICE_ID ?? process.env.ANDROID_SERIAL ?? undefined;
    const iosDeviceId = process.env.IOS_DEVICE_ID ?? undefined;

    this.androidAdapter = androidDeviceId
      ? new AndroidAdapter(new AdbClient(androidDeviceId))
      : new AndroidAdapter();

    this.iosAdapter = iosDeviceId
      ? new IosAdapter(new IosClient(iosDeviceId))
      : new IosAdapter();

    this.adapters = new Map<Platform, PlatformAdapter>([
      ["android", this.androidAdapter],
      ["ios", this.iosAdapter],
    ]);

    // If env var specified a device, set it as active target
    if (androidDeviceId) {
      this.activeTarget = "android";
    } else if (iosDeviceId) {
      this.activeTarget = "ios";
    }
  }

  setSonicSource(source: SonicDeviceSource): void {
    this.sonicSource = source;
    this.sonicEnabled = true;
  }

  isSonicMode(): boolean {
    return this.sonicEnabled;
  }

  /**
   * Resolve the correct adapter for a given platform (or the active platform).
   *
   * FIX #8: If the adapter has no selected device, attempt auto-detection.
   * This ensures commands work after a server restart without requiring
   * an explicit set_device call.
   */
  private getAdapter(platform?: Platform): PlatformAdapter {
    const target = platform ?? this.activeTarget;
    const adapter = this.adapters.get(target);
    if (!adapter) {
      throw new Error(`Unknown platform: ${target}`);
    }

    // FIX #8 — auto-detect device when none is selected.
    // After a server restart the in-memory deviceId is lost, so we probe
    // the platform for a connected device before the command runs.
    if (!adapter.getSelectedDeviceId()) {
      const detected = adapter.autoDetectDevice();
      if (detected) {
        adapter.selectDevice(detected.id);
        this.activeDevice = detected;
        this.activeTarget = detected.platform;
      }
    }

    return adapter;
  }

  // ============ Target Management ============

  setTarget(target: Platform): void {
    this.activeTarget = target;
  }

  getTarget(): { target: Platform; status: string } {
    const device = this.activeDevice;
    if (device) {
      return { target: device.platform, status: device.state };
    }

    return { target: this.activeTarget, status: "no device" };
  }

  async cleanup(): Promise<void> {
    try { await this.activeSonicAdapter?.dispose?.(); } catch {}
    try { this.iosAdapter.getClient().cleanup(); } catch {}
    try { this.webViewInspector?.cleanup(); } catch {}
  }

  // ============ Device Management ============

  getAllDevices(): Device[] {
    if (this.sonicEnabled && this.sonicSource) {
      return this.sonicSource.listDevices();
    }
    const devices: Device[] = [];
    for (const adapter of this.adapters.values()) {
      devices.push(...adapter.listDevices());
    }
    return devices;
  }

  getDevices(platform?: Platform): Device[] {
    if (platform) {
      const adapter = this.adapters.get(platform);
      return adapter ? adapter.listDevices() : [];
    }
    return this.getAllDevices();
  }

  async setDevice(deviceId: string, platform?: Platform): Promise<Device> {
    const devices = this.getAllDevices();

    // Find device by ID
    let device = devices.find((d) => d.id === deviceId);

    // If platform specified but device not found, try to match any booted device on that platform
    if (!device && platform) {
      device = devices.find(
        (d) =>
          d.platform === platform &&
          (d.state === "device" || d.state === "booted" || d.state === "connected"),
      );
    }

    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }

    if (this.sonicEnabled && (device.platform === "android" || device.platform === "ios")) {
      const conn = this.sonicSource!.getConnectionInfo();
      const newAdapter = device.platform === "android"
        ? new SonicAndroidAdapter(device.id, conn)
        : new SonicIosAdapter(device.id, conn);

      await this.activeSonicAdapter?.dispose?.();
      await newAdapter.connect();
      this.activeSonicAdapter = newAdapter;

      this.adapters.set(device.platform, newAdapter);
      this.activeDevice = device;
      this.activeTarget = device.platform;
      return device;
    }

    this.activeDevice = device;
    this.activeTarget = device.platform;

    // Propagate to the adapter
    const adapter = this.adapters.get(device.platform);
    adapter?.selectDevice(device.id);

    return device;
  }

  getActiveDevice(): Device | undefined {
    return this.activeDevice;
  }

  getCurrentPlatform(): Platform {
    return this.activeTarget;
  }

  // ============ Unified Commands (delegate to adapters) ============

  async screenshot(
    platform?: Platform,
    compress: boolean = true,
    options?: CompressOptions & { monitorIndex?: number },
  ): Promise<{ data: string; mimeType: string }> {
    return this.screenshotAsync(platform, compress, options);
  }

  async getScreenshotBuffer(platform?: Platform): Promise<Buffer> {
    return this.getScreenshotBufferAsync(platform);
  }

  screenshotRaw(platform?: Platform): string {
    const adapter = this.getAdapter(platform);
    return adapter.screenshotRaw();
  }

  async tap(x: number, y: number, platform?: Platform, targetPid?: number): Promise<void> {
    const adapter = this.getAdapter(platform);
    await adapter.tap(x, y, targetPid);
  }

  async doubleTap(
    x: number,
    y: number,
    intervalMs: number = 100,
    platform?: Platform,
  ): Promise<void> {
    const adapter = this.getAdapter(platform);
    await adapter.doubleTap(x, y, intervalMs);
  }

  async longPress(
    x: number,
    y: number,
    durationMs: number = 1000,
    platform?: Platform,
  ): Promise<void> {
    const adapter = this.getAdapter(platform);
    await adapter.longPress(x, y, durationMs);
  }

  async swipe(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    durationMs: number = 300,
    platform?: Platform,
  ): Promise<void> {
    const adapter = this.getAdapter(platform);
    await adapter.swipe(x1, y1, x2, y2, durationMs);
  }

  async swipeDirection(
    direction: "up" | "down" | "left" | "right",
    platform?: Platform,
  ): Promise<void> {
    const adapter = this.getAdapter(platform);
    await adapter.swipeDirection(direction);
  }

  async inputText(text: string, platform?: Platform, targetPid?: number): Promise<void> {
    const adapter = this.getAdapter(platform);
    await adapter.inputText(text, targetPid);
  }

  async pressKey(key: string, platform?: Platform, targetPid?: number): Promise<void> {
    const adapter = this.getAdapter(platform);
    await adapter.pressKey(key, targetPid);
  }

  async launchApp(packageOrBundleId: string, platform?: Platform): Promise<string> {
    const adapter = this.getAdapter(platform);
    return await adapter.launchApp(packageOrBundleId);
  }

  async stopApp(packageOrBundleId: string, platform?: Platform): Promise<void> {
    const adapter = this.getAdapter(platform);
    await adapter.stopApp(packageOrBundleId);
  }

  async installApp(path: string, platform?: Platform): Promise<string> {
    const adapter = this.getAdapter(platform);
    return await adapter.installApp(path);
  }

  async grantPermission(
    packageOrBundleId: string,
    permission: string,
    platform?: Platform,
  ): Promise<string> {
    const adapter = this.getAdapter(platform);
    return await adapter.grantPermission(packageOrBundleId, permission);
  }

  async revokePermission(
    packageOrBundleId: string,
    permission: string,
    platform?: Platform,
  ): Promise<string> {
    const adapter = this.getAdapter(platform);
    return await adapter.revokePermission(packageOrBundleId, permission);
  }

  async resetPermissions(packageOrBundleId: string, platform?: Platform): Promise<string> {
    const adapter = this.getAdapter(platform);
    return await adapter.resetPermissions(packageOrBundleId);
  }

  async getUiHierarchy(platform?: Platform): Promise<string> {
    const adapter = this.getAdapter(platform);
    return adapter.getUiHierarchy();
  }

  async getUiHierarchyAsync(platform?: Platform): Promise<string> {
    const adapter = this.getAdapter(platform);
    return adapter.getUiHierarchy();
  }

  async shell(command: string, platform?: Platform): Promise<string> {
    const adapter = this.getAdapter(platform);
    return await adapter.shell(command);
  }

  // ============ Raw client accessors (used by tools directly) ============

  getAndroidClient(): AdbClient {
    return this.androidAdapter.getClient();
  }

  getIosClient(): IosClient {
    return this.iosAdapter.getClient();
  }

  getWebViewInspector(): WebViewInspector {
    if (!this.webViewInspector) {
      this.webViewInspector = new WebViewInspector(this.androidAdapter.getClient());
    }
    return this.webViewInspector;
  }

  // ============ Async screenshot helpers ============

  async screenshotAsync(
    platform?: Platform,
    compress: boolean = true,
    options?: CompressOptions & { monitorIndex?: number },
  ): Promise<{ data: string; mimeType: string }> {
    const adapter = this.getAdapter(platform);
    return adapter.screenshotAsync(compress, options);
  }

  async getScreenshotBufferAsync(platform?: Platform): Promise<Buffer> {
    const adapter = this.getAdapter(platform);
    return adapter.getScreenshotBufferAsync();
  }

  // ============ Logs & System ============

  async getLogs(
    options: {
      platform?: Platform;
      level?: string;
      tag?: string;
      lines?: number;
      package?: string;
    } = {},
  ): Promise<string> {
    const adapter = this.getAdapter(options.platform);
    return await adapter.getLogs({
      level: options.level,
      tag: options.tag,
      lines: options.lines,
      package: options.package,
    });
  }

  async clearLogs(platform?: Platform): Promise<string> {
    const adapter = this.getAdapter(platform);
    return await adapter.clearLogs();
  }

  async getSystemInfo(platform?: Platform): Promise<string> {
    const adapter = this.getAdapter(platform);
    return adapter.getSystemInfo();
  }

  // ============ App Listing ============

  async getAppList(platform?: Platform): Promise<Array<{
    appName: string;
    packageName: string;
    versionName?: string;
    versionCode?: string;
  }>> {
    const adapter = this.getAdapter(platform);
    return adapter.getAppList();
  }

  // ============ Clipboard Operations ============

  async setClipboard(text: string, platform?: Platform): Promise<void> {
    const adapter = this.getAdapter(platform);
    return adapter.setClipboard(text);
  }

  async getClipboard(platform?: Platform): Promise<string> {
    const adapter = this.getAdapter(platform);
    return adapter.getClipboard();
  }

  // ============ WebView Inspection ============

  async getWebViews(platform?: Platform): Promise<Array<{ packageName?: string; socket?: string; [key: string]: any }>> {
    const adapter = this.getAdapter(platform);
    return adapter.getWebViews();
  }
}
