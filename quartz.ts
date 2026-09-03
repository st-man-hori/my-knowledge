import "./plugins/bases-tag-table/index"
import { componentRegistry } from "./quartz/components/registry"
import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"

// Explorer's sortFn is serialized via `.toString()` and rebuilt with `new
// Function(...)` client-side, so it must stay self-contained — no closures
// over anything outside its own parameters.
componentRegistry.setOptionOverrides("explorer", {
  sortFn: (a: { slugSegment?: string; isFolder: boolean; displayName?: string }, b: typeof a) => {
    // bases-page keeps the ".base" extension in the slug, so
    // content/notes.base's slugSegment is "notes.base", not "notes".
    // (No inner named function here: esbuild's keepNames wraps those in a
    // __name() helper that doesn't exist once this is reconstructed
    // client-side via `new Function(...)`, which throws silently.)
    const aIsNotes = a.slugSegment === "notes" || a.slugSegment === "notes.base"
    const bIsNotes = b.slugSegment === "notes" || b.slugSegment === "notes.base"
    if (aIsNotes !== bIsNotes) return aIsNotes ? -1 : 1
    if (a.isFolder === b.isFolder) {
      return (a.displayName || "").localeCompare(b.displayName || "", undefined, {
        numeric: true,
        sensitivity: "base",
      })
    }
    return a.isFolder ? -1 : 1
  },
  // "notes" (content/notes.base) is the all-notes listing, but that's not
  // obvious from the bare filename alone — relabel it in the sidebar only
  // (the page's own title stays "notes", set by bases-page from the
  // filename with no frontmatter override available for .base files).
  mapFn: (node: { slugSegment?: string; displayName?: string }) => {
    if (node.slugSegment === "notes" || node.slugSegment === "notes.base") {
      node.displayName = "ノート一覧"
    }
    return node
  },
})

const config = await loadQuartzConfig()
export default config
export const layout = await loadQuartzLayout()
