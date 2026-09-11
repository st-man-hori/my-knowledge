import fs from "fs"
import path from "path"
import { fromHtml } from "hast-util-from-html"
import type { Root, Element } from "hast"
import { visit } from "unist-util-visit"

export interface LinkMetadata {
  url: string
  hostname: string
  title: string
  description?: string
  image?: string
  favicon?: string
  siteName?: string
}

const CACHE_PATH = path.join(process.cwd(), ".quartz-cache", "link-preview-cache.json")
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const FETCH_TIMEOUT_MS = 8000

type Cache = Record<string, { data: LinkMetadata; fetchedAt: number }>

let cache: Cache | null = null

function loadCache(): Cache {
  if (cache) return cache
  try {
    cache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"))
  } catch {
    cache = {}
  }
  return cache
}

function saveCache(next: Cache) {
  cache = next
  try {
    fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true })
    // Write to a temp file first: several worker threads may hold this
    // module and flush around the same time, and a half-written file would
    // otherwise corrupt every other entry's read on the next build.
    const tmpPath = `${CACHE_PATH}.${process.pid}.tmp`
    fs.writeFileSync(tmpPath, JSON.stringify(next))
    fs.renameSync(tmpPath, CACHE_PATH)
  } catch {
    // Best-effort cache; a failed write just means a re-fetch next build.
  }
}

function textOf(node: Element): string {
  return node.children
    .filter((c): c is { type: "text"; value: string } => c.type === "text")
    .map((c) => c.value)
    .join("")
    .trim()
}

function resolveUrl(maybeRelative: string, base: string): string | undefined {
  try {
    return new URL(maybeRelative, base).toString()
  } catch {
    return undefined
  }
}

async function fetchFresh(url: string): Promise<LinkMetadata> {
  const hostname = new URL(url).hostname
  const fallback: LinkMetadata = { url, hostname, title: hostname }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; my-knowledge-link-preview/1.0)",
        accept: "text/html",
      },
    })
    if (!res.ok) return fallback
    const html = await res.text()
    const finalUrl = res.url || url

    const tree = fromHtml(html, { fragment: false })
    let title: string | undefined
    let description: string | undefined
    let image: string | undefined
    let siteName: string | undefined
    let icon: string | undefined

    visit(tree, "element", (node: Element) => {
      if (node.tagName === "title" && !title) {
        const t = textOf(node)
        if (t) title = t
      }
      if (node.tagName === "meta") {
        const props = node.properties ?? {}
        const key = (props.property ?? props.name) as string | undefined
        const content = props.content as string | undefined
        if (!key || !content) return
        if (key === "og:title") title = content
        else if (key === "og:description") description = content
        else if (key === "description" && !description) description = content
        else if (key === "og:image" || key === "og:image:url") image = content
        else if (key === "og:site_name") siteName = content
      }
      if (node.tagName === "link") {
        const rel = node.properties?.rel
        const relList = Array.isArray(rel) ? (rel as string[]) : rel ? [String(rel)] : []
        if (relList.some((r) => r.includes("icon")) && typeof node.properties?.href === "string") {
          icon = node.properties.href as string
        }
      }
    })

    return {
      url,
      hostname,
      title: title?.trim() || hostname,
      description: description?.trim(),
      image: image ? resolveUrl(image, finalUrl) : undefined,
      favicon: resolveUrl(icon ?? "/favicon.ico", finalUrl),
      siteName: siteName?.trim(),
    }
  } catch {
    return fallback
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchLinkMetadata(url: string): Promise<LinkMetadata> {
  const c = loadCache()
  const cached = c[url]
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data
  }

  const data = await fetchFresh(url)
  // A network failure returns just {url, hostname, title: hostname}; prefer
  // stale cached data over that thin fallback so a flaky fetch doesn't
  // regress a card that already looked good.
  const isThin = !data.description && !data.image && data.title === data.hostname
  const finalData = isThin && cached ? cached.data : data

  saveCache({ ...c, [url]: { data: finalData, fetchedAt: Date.now() } })
  return finalData
}
