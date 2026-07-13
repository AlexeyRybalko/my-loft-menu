import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const isCloudRu = process.env.CLOUDRU_DEPLOY === "true";
const isStaticExport = isGitHubPages || isCloudRu;

const nextConfig: NextConfig = {
  output: isStaticExport ? "export" : undefined,
  basePath: isGitHubPages ? "/my-loft-menu" : "",
  assetPrefix: isGitHubPages ? "/my-loft-menu/" : undefined,
  trailingSlash: isGitHubPages,
};

export default nextConfig;
