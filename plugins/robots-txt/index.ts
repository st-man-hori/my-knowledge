import fs from "fs/promises"
import path from "path"

interface RobotsCtx {
  argv: { output: string }
  cfg: { configuration: { baseUrl?: string } }
}

function extractDomainFromBaseUrl(baseUrl: string): string {
  const url = new URL(`https://${baseUrl}`)
  return url.hostname
}

export const Robots = () => ({
  name: "Robots",
  async emit(ctx: RobotsCtx): Promise<string[]> {
    const baseUrl = ctx.cfg.configuration.baseUrl
    if (!baseUrl) {
      console.warn("Robots emitter requires `baseUrl` to be set in your configuration")
      return []
    }

    const domain = extractDomainFromBaseUrl(baseUrl)
    const content = `User-agent: *\nAllow: /\n\nSitemap: https://${domain}/sitemap.xml\n`

    const filePath = path.join(ctx.argv.output, "robots.txt")
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, content)
    return [filePath]
  },
  async *partialEmit() {},
})
