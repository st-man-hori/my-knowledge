/// <reference path="./bases-page.d.ts" />
import { viewRegistry } from "@quartz-community/bases-page/registry"
import type { ViewRenderer } from "@quartz-community/bases-page/types"
import { transformLink, type FullSlug } from "@quartz-community/utils"
import { h } from "preact"

interface EntryLike {
  slug: string
  title: string
  properties: Record<string, unknown>
  fileProperties: Record<string, unknown> & { tags: string[] }
  formulaValues: Record<string, unknown>
}

function columnLabel(
  column: string,
  properties?: Record<string, { displayName?: string }>,
): string {
  const custom = properties?.[column]?.displayName
  if (custom) return custom
  const segment = column.split(".").pop() ?? column
  return segment.charAt(0).toUpperCase() + segment.slice(1)
}

function getPath(obj: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (acc, key) =>
        acc && typeof acc === "object" ? (acc as Record<string, unknown>)[key] : undefined,
      obj,
    )
}

function cellValue(column: string, entry: EntryLike): unknown {
  if (column.startsWith("note.")) return getPath(entry.properties, column.slice(5))
  if (column.startsWith("file.")) return getPath(entry.fileProperties, column.slice(5))
  if (column.startsWith("formula.")) return getPath(entry.formulaValues, column.slice(8))
  return getPath(entry.properties, column)
}

function formatCell(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—"
  if (value instanceof Date) return value.toLocaleDateString("ja-JP")
  if (Array.isArray(value)) return value.join(", ")
  return String(value)
}

// Table view where the `file.tags` column renders each tag as a "#tag" link
// to its tag page, since bases-page's built-in Table has no way to turn
// individual array items into links (its formula language has no map/loop).
const TagTableView: ViewRenderer = ({
  entries,
  view,
  basesData,
  total,
  slug,
  allSlugs,
  linkResolution,
}) => {
  const columns = view.order && view.order.length > 0 ? view.order : ["file.name"]
  const transformOpts = { strategy: linkResolution, allSlugs: allSlugs as FullSlug[] }

  return h("div", { class: "bases-table-wrapper" }, [
    h("div", { class: "bases-view-meta" }, `${entries.length} / ${total} 件を表示`),
    h(
      "table",
      { class: "bases-table", "data-view-type": "table-tags" },
      h(
        "thead",
        {},
        h(
          "tr",
          {},
          columns.map((column) =>
            h("th", { "data-column": column }, columnLabel(column, basesData.properties)),
          ),
        ),
      ),
      h(
        "tbody",
        {},
        (entries as EntryLike[]).map((entry) =>
          h(
            "tr",
            {},
            columns.map((column) => {
              if (column === "file.tags") {
                const tags = entry.fileProperties.tags ?? []
                if (tags.length === 0) return h("td", {}, h("span", { class: "bases-empty" }, "—"))
                return h(
                  "td",
                  {},
                  h(
                    "ul",
                    { class: "tags" },
                    tags.map((tag) =>
                      h(
                        "li",
                        {},
                        h(
                          "a",
                          {
                            href: transformLink(slug as FullSlug, `tags/${tag}`, transformOpts),
                            class: "internal tag-link",
                          },
                          `${tag}`,
                        ),
                      ),
                    ),
                  ),
                )
              }
              if (column === "file.name" || column === "title") {
                return h(
                  "td",
                  {},
                  h(
                    "a",
                    {
                      href: transformLink(slug as FullSlug, entry.slug, transformOpts),
                      class: "internal internal-link",
                    },
                    entry.title,
                  ),
                )
              }
              return h("td", {}, formatCell(cellValue(column, entry)))
            }),
          ),
        ),
      ),
    ),
  ])
}

viewRegistry.register({
  id: "table-tags",
  name: "Table (tag links)",
  icon: "table",
  render: TagTableView,
  css: `
.bases-table-wrapper .tags {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin: 0;
  padding: 0;
}
.bases-table-wrapper .tags > li {
  display: inline-block;
}
.bases-table-wrapper a.internal.tag-link {
  border-radius: 8px;
  background-color: var(--highlight);
  padding: 0.1rem 0.4rem;
  white-space: nowrap;
}
`,
})

export {}
