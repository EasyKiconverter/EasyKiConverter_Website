const site = new URL(import.meta.env.SITE);
const base = new URL(import.meta.env.BASE_URL, site);
const pages = [base.href, new URL('en/', base).href];

export const GET = (): Response => new Response(
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}\n</urlset>\n`,
  { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
);
