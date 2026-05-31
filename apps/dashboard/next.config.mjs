/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@aicos/shared-types", "@aicos/config", "@aicos/prompts"],
  typedRoutes: !isGitHubPages,
  ...(isGitHubPages
    ? {
        output: "export",
        basePath: "/ACGS",
        assetPrefix: "/ACGS/",
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
