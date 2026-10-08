import fs from "fs/promises"
import path from "path"

interface SitemapFileData {
  slug?: string
  unlisted?: boolean
  dates?: { created?: Date; modified?: Date }
}

interface SitemapCtx {
  argv: { output: string }
  cfg: { configuration: { baseUrl?: string } }
}

type ProcessedContent = [unknown, { data?: SitemapFileData }]

// Only the home page and real articles go into the sitemap. Tag pages, folder
// listings and Bases views are thin, auto-generated pages that dilute the
// site's perceived quality when Google weighs whether to index it.
function isIndexable(slug: string): boolean {
  if (slug === "index") return true
  if (slug === "404") return false
  if (slug === "tags" || slug.startsWith("tags/")) return false
  if (slug.endsWith("/index")) return false
  if (slug.endsWith(".base")) return false
  return true
}

function toUrlPath(slug: string): string {
  return slug === "index" ? "" : encodeURI(slug)
}

export const Sitemap = () => ({
  name: "Sitemap",
  async emit(ctx: SitemapCtx, content: ProcessedContent[]): Promise<string[]> {
    const baseUrl = ctx.cfg.configuration.baseUrl
    if (!baseUrl) {
      console.warn("Sitemap emitter requires `baseUrl` to be set in your configuration")
      return []
    }

    const urls = content
      .map(([, file]) => file.data ?? {})
      .filter((data) => data.slug && data.unlisted !== true && isIndexable(data.slug))
      .map((data) => {
        const lastmod = data.dates?.modified ?? data.dates?.created
        return `<url>
    <loc>https://${baseUrl}/${toUrlPath(data.slug!)}</loc>${lastmod ? `\n    <lastmod>${lastmod.toISOString()}</lastmod>` : ""}
  </url>`
      })
      .join("")

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`

    const filePath = path.join(ctx.argv.output, "sitemap.xml")
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, xml)
    return [filePath]
  },
  async *partialEmit() {},
})
