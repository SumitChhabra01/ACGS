/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@aicos/shared-types", "@aicos/config", "@aicos/prompts"],
  typedRoutes: true,
};

export default nextConfig;
