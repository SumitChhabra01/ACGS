// Server-side Instagram Graph API client (read-only). Mirrors the Python client
// in services/integrations/instagram.py. Used by the Analytics page to render
// live @cineai_diaries data. Reads creds from env (never exposed to the client).

const GRAPH = "https://graph.facebook.com/v21.0";

// `impressions`/`plays` were deprecated by Meta on 2025-04-21 → use `views`.
const MEDIA_METRICS: Record<string, string> = {
  REELS: "reach,saved,likes,comments,shares,total_interactions,views",
  FEED: "reach,saved,likes,comments,shares,total_interactions,views",
  STORY: "reach,replies,views",
};

export interface RawMedia {
  id: string;
  caption: string;
  mediaType: string;
  mediaProductType: string;
  permalink: string;
  timestamp: string;
  likeCount: number;
  commentsCount: number;
  insights: Record<string, number>;
}

export interface IgAccount {
  username: string;
  followersCount: number;
  followsCount: number;
  mediaCount: number;
  biography: string;
}

export function isInstagramConfigured(): boolean {
  return Boolean(process.env.META_ACCESS_TOKEN);
}

function token(): string {
  const t = process.env.META_ACCESS_TOKEN;
  if (!t) throw new Error("META_ACCESS_TOKEN not set");
  return t;
}

async function graph<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${GRAPH}/${path}`);
  url.search = new URLSearchParams({ access_token: token(), ...params }).toString();
  const res = await fetch(url, { next: { revalidate: 3600 } });
  const json = await res.json();
  if (!res.ok) {
    const err = (json as { error?: { message?: string } }).error;
    throw new Error(err?.message ?? `Graph error ${res.status}`);
  }
  return json as T;
}

async function resolveIgId(): Promise<string> {
  const explicit = process.env.IG_BUSINESS_ACCOUNT_ID;
  if (explicit) return explicit;
  const pages = await graph<{ data: Array<{ instagram_business_account?: { id: string } }> }>(
    "me/accounts",
    { fields: "instagram_business_account{id}" },
  );
  for (const p of pages.data) {
    if (p.instagram_business_account) return p.instagram_business_account.id;
  }
  throw new Error("No Instagram Business Account linked to any Page on this token.");
}

export async function getAccount(): Promise<IgAccount> {
  const id = await resolveIgId();
  const a = await graph<Record<string, string | number>>(id, {
    fields: "username,followers_count,follows_count,media_count,biography",
  });
  return {
    username: String(a.username ?? ""),
    followersCount: Number(a.followers_count ?? 0),
    followsCount: Number(a.follows_count ?? 0),
    mediaCount: Number(a.media_count ?? 0),
    biography: String(a.biography ?? ""),
  };
}

export async function getMedia(limit = 25): Promise<RawMedia[]> {
  const id = await resolveIgId();
  const data = await graph<{ data: Array<Record<string, string | number>> }>(`${id}/media`, {
    limit: String(limit),
    fields:
      "id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count",
  });

  const items = await Promise.all(
    data.data.map(async (m) => {
      const productType = String(m.media_product_type ?? "FEED");
      let insights: Record<string, number> = {};
      try {
        const metric = MEDIA_METRICS[productType] ?? MEDIA_METRICS.FEED;
        const ins = await graph<{ data: Array<{ name: string; values: Array<{ value: number }> }> }>(
          `${m.id}/insights`,
          { metric: metric as string },
        );
        insights = Object.fromEntries(
          ins.data.map((row) => [row.name, Number(row.values?.[0]?.value ?? 0)]),
        );
      } catch {
        insights = {};
      }
      return {
        id: String(m.id),
        caption: String(m.caption ?? ""),
        mediaType: String(m.media_type ?? ""),
        mediaProductType: productType,
        permalink: String(m.permalink ?? ""),
        timestamp: String(m.timestamp ?? ""),
        likeCount: Number(m.like_count ?? 0),
        commentsCount: Number(m.comments_count ?? 0),
        insights,
      } satisfies RawMedia;
    }),
  );
  return items;
}
