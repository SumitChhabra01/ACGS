/** True when built for GitHub Pages (static public demo; no API routes). */
export const isPublicDemo = process.env.NEXT_PUBLIC_GITHUB_PAGES === "true";
