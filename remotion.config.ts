import fs from "fs";
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
Config.setPixelFormat("yuv420p");
Config.setCodec("h264");

// This VM has no GPU and a known Chrome path. Other machines use Remotion's browser.
const chrome = "/usr/local/bin/google-chrome";
if (fs.existsSync(chrome)) {
  Config.setBrowserExecutable(chrome);
  Config.setChromiumOpenGlRenderer("swiftshader");
}
