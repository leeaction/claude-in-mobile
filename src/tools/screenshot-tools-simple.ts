import type { ToolDefinition } from "./registry.js";
import type { ToolContext } from "./context.js";
import type { Platform } from "../device-manager.js";
import { annotateScreenshot } from "../utils/image.js";
import { parseUiHierarchy, UiElement } from "../adb/ui-parser.js";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// Directory for saving debug screenshots (current working directory)
const DEBUG_SCREENSHOT_DIR = process.env.DEBUG_SCREENSHOT_DIR || process.cwd();

// Ensure directory exists
try {
  mkdirSync(DEBUG_SCREENSHOT_DIR, { recursive: true });
} catch {
  // Directory may already exist
}

function saveDebugScreenshot(buffer: Buffer, prefix: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `${prefix}_${timestamp}.png`;
  const filepath = join(DEBUG_SCREENSHOT_DIR, filename);
  writeFileSync(filepath, buffer);
  return filepath;
}

export const screenshotToolsSimple: ToolDefinition[] = [
  {
    tool: {
      name: "screen_capture",
      description: "Take a screenshot of the device screen.",
      inputSchema: {
        type: "object",
        properties: {
          platform: {
            type: "string",
            enum: ["android", "ios"],
            description: "Target platform. If not specified, uses the active target.",
          },
        },
      },
    },
    handler: async (args, ctx) => {
      const platform = args.platform as Platform | undefined;
      const currentPlatform = platform ?? ctx.deviceManager.getCurrentPlatform() ?? "android";

      const pngBuffer = await ctx.deviceManager.getScreenshotBufferAsync(currentPlatform);
      ctx.lastScreenshotMap.set(currentPlatform, pngBuffer);

      // Save debug screenshot to local file
      const debugPath = saveDebugScreenshot(pngBuffer, "screen_capture");
      console.error(`[Debug] Screenshot saved to: ${debugPath}`);

      return {
        image: { data: pngBuffer.toString("base64"), mimeType: "image/png" },
        text: `Screenshot saved to: ${debugPath}`,
      };
    },
  },
  {
    tool: {
      name: "screen_annotate",
      description: "Take a screenshot with colored bounding boxes and numbered labels overlaid on UI elements. Green = clickable, Red = non-clickable. Returns annotated image + element index. Useful for visual understanding of UI layout. Android and iOS only.",
      inputSchema: {
        type: "object",
        properties: {
          platform: {
            type: "string",
            enum: ["android", "ios"],
            description: "Target platform. If not specified, uses the active target.",
          },
        },
      },
    },
    handler: async (args, ctx) => {
      const platform = args.platform as Platform | undefined;
      const currentPlat = platform ?? ctx.deviceManager.getCurrentPlatform();
      if (!currentPlat || currentPlat === "android" || currentPlat === "ios") {
        // Supported platforms, continue
      } else {
        return { text: `annotate_screenshot is not supported for ${currentPlat} platform. Use screenshot + get_ui instead.` };
      }

      const pngBuffer = await ctx.deviceManager.getScreenshotBufferAsync(currentPlat);

      let uiElements: UiElement[] = [];
      if (currentPlat === "android" || !currentPlat) {
        const xml = await ctx.deviceManager.getUiHierarchyAsync("android");
        uiElements = parseUiHierarchy(xml);
      } else if (currentPlat === "ios") {
        try {
          const json = await ctx.deviceManager.getUiHierarchy("ios");
          const tree = JSON.parse(json);
          uiElements = ctx.iosTreeToUiElements(tree);
        } catch (iosUiErr: any) {
          console.error(`[annotate_screenshot] iOS UI hierarchy unavailable: ${iosUiErr?.message}`);
        }
      }

      if (uiElements.length === 0) {
        // Save debug screenshot to local file
        const debugPath = saveDebugScreenshot(pngBuffer, "screen_annotate");
        console.error(`[Debug] Screenshot saved to: ${debugPath}`);

        return {
          image: { data: pngBuffer.toString("base64"), mimeType: "image/png" },
          text: `No UI elements found to annotate. Screenshot saved to: ${debugPath}`,
        };
      }

      const annotResult = await annotateScreenshot(pngBuffer, uiElements);

      // Save annotated screenshot to local file
      const annotBuffer = Buffer.from(annotResult.image.data, "base64");
      const debugPath = saveDebugScreenshot(annotBuffer, "screen_annotate");
      console.error(`[Debug] Annotated screenshot saved to: ${debugPath}`);

      const elementsList = annotResult.elements
        .map(el => `  ${el.index}: ${el.clickable ? "[clickable] " : ""}${el.label} @ (${el.center.x}, ${el.center.y})`)
        .join("\n");

      return {
        image: {
          data: annotResult.image.data,
          mimeType: annotResult.image.mimeType,
        },
        text: `Annotated ${annotResult.elements.length} elements. Screenshot saved to: ${debugPath}\n${elementsList}`,
      };
    },
  },
];
