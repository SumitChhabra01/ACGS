/** True when built for GitHub Pages (static shell; live data via browser Supabase). */
export const isPublicDemo = process.env.NEXT_PUBLIC_GITHUB_PAGES === "true";
