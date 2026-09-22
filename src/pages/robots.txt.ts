const site = new URL(import.meta.env.SITE);
const base = new URL(import.meta.env.BASE_URL, site);

export const GET = (): Response => new Response(
  `User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap.xml', base).href}\n`,
  { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
);
