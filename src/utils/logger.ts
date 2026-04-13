import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log file path - in project root
const LOG_FILE = path.join(__dirname, "../../mcp-server.log");

// Ensure log file exists
try {
  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, "");
  }
} catch (e) {
  // Ignore if we can't create the log file
}

export function log(message: string, ...args: any[]): void {
  const timestamp = new Date().toISOString();
  const formattedArgs = args.map(arg =>
    typeof arg === "object" ? JSON.stringify(arg) : String(arg)
  ).join(" ");
  const logMessage = `[${timestamp}] ${message} ${formattedArgs}\n`;

  // Write to stderr (for terminal when running directly)
  console.error(message, ...args);

  // Also write to log file
  try {
    fs.appendFileSync(LOG_FILE, logMessage);
  } catch (e) {
    // Ignore write errors
  }
}

export function logError(message: string, error?: any): void {
  const timestamp = new Date().toISOString();
  const errorDetails = error ? `\n${error.stack || error.message || error}` : "";
  const logMessage = `[${timestamp}] ERROR: ${message}${errorDetails}\n`;

  console.error(message, error);

  try {
    fs.appendFileSync(LOG_FILE, logMessage);
  } catch (e) {
    // Ignore write errors
  }
}
