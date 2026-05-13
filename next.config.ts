import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // nanoid v5 是纯 ESM 包，在服务端 bundle 中 webpack 无法正确 require() 它
  // 标记为 external 使 Node.js 直接 import() 而非打包
  serverExternalPackages: ["nanoid"],
};

export default nextConfig;
