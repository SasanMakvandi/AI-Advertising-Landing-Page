import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  // Keep ffmpeg-static's binary as a real file on disk in the serverless
  // bundle instead of letting the bundler try to process it as JS.
  serverExternalPackages: ["ffmpeg-static"],
};

export default nextConfig;
