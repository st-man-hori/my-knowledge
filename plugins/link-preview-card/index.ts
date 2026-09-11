import type { Root, Element, ElementContent, Parent } from "hast"
import { visit } from "unist-util-visit"
import { fetchLinkMetadata, type LinkMetadata } from "./fetchMetadata.ts"

// A paragraph whose only meaningful content is a single external link is
// treated as an intentional "embed this" signal (the same convention
// Notion/Obsidian use), so plain inline links like `[GitHub](...)` mid
// sentence are left alone.
function findCardLink(node: Element): string | null {
  if (node.tagName !== "p") return null
  const meaningful = node.children.filter((c) => !(c.type === "text" && c.value.trim() === ""))
  if (meaningful.length !== 1) return null
  const child = meaningful[0]
  if (child.type !== "element" || child.tagName !== "a") return null
  const href = child.properties?.href
  if (typeof href !== "string" || !/^https?:\/\//.test(href)) return null
  return href
}

function buildCardNode(meta: LinkMetadata): Element {
  const contentChildren: ElementContent[] = [
    {
      type: "element",
      tagName: "span",
      properties: { className: ["link-preview-card-title"] },
      children: [{ type: "text", value: meta.title }],
    },
  ]

  if (meta.description) {
    contentChildren.push({
      type: "element",
      tagName: "span",
      properties: { className: ["link-preview-card-description"] },
      children: [{ type: "text", value: meta.description }],
    })
  }

  const hostChildren: ElementContent[] = []
  if (meta.favicon) {
    hostChildren.push({
      type: "element",
      tagName: "img",
      properties: { className: ["link-preview-card-favicon"], src: meta.favicon, alt: "" },
      children: [],
    })
  }
  hostChildren.push({ type: "text", value: meta.siteName || meta.hostname })
  contentChildren.push({
    type: "element",
    tagName: "span",
    properties: { className: ["link-preview-card-host"] },
    children: hostChildren,
  })

  const cardChildren: ElementContent[] = [
    {
      type: "element",
      tagName: "span",
      properties: { className: ["link-preview-card-content"] },
      children: contentChildren,
    },
  ]

  if (meta.image) {
    cardChildren.push({
      type: "element",
      tagName: "span",
      properties: {
        className: ["link-preview-card-thumb"],
        style: `background-image: url("${meta.image.replace(/"/g, "%22")}")`,
      },
      children: [],
    })
  }

  return {
    type: "element",
    tagName: "a",
    properties: {
      className: ["link-preview-card", "external", "external-link"],
      href: meta.url,
      target: "_blank",
      rel: ["noopener", "noreferrer"],
    },
    children: cardChildren,
  }
}

export const LinkPreviewCard = () => {
  return {
    name: "LinkPreviewCard",
    htmlPlugins() {
      return [
        () => async (tree: Root) => {
          const matches: { parent: Parent; index: number; href: string }[] = []
          visit(tree, "element", (node, index, parent) => {
            if (index === undefined || !parent) return
            const href = findCardLink(node as Element)
            if (href) matches.push({ parent: parent as Parent, index, href })
          })

          await Promise.all(
            matches.map(async ({ parent, index, href }) => {
              const meta = await fetchLinkMetadata(href)
              ;(parent.children as ElementContent[])[index] = buildCardNode(meta)
            }),
          )
        },
      ]
    },
  }
}
