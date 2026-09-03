// Ambient shims for @quartz-community/bases-page's subpath exports.
//
// The package publishes valid types at ./dist/registry.d.ts and
// ./dist/types.d.ts (declared via package.json "exports"), but this
// project's tsconfig uses moduleResolution: "node", which predates the
// "exports" field and can't resolve those subpaths. These declarations
// mirror the package's real public types so tsc can typecheck this
// plugin without changing the project-wide moduleResolution setting.
declare module "@quartz-community/bases-page/registry" {
  export const viewRegistry: {
    register(registration: import("@quartz-community/bases-page/types").ViewTypeRegistration): void
    get(id: string): import("@quartz-community/bases-page/types").ViewTypeRegistration | undefined
    getAll(): import("@quartz-community/bases-page/types").ViewTypeRegistration[]
    has(id: string): boolean
    unregister(id: string): boolean
  }
}

declare module "@quartz-community/bases-page/types" {
  import type { ComponentChild } from "preact"

  export interface BasesEntry {
    slug: string
    title: string
    properties: Record<string, unknown>
    fileProperties: {
      name: string
      basename: string
      path: string
      folder: string
      ext: string
      tags: string[]
      links: string[]
      embeds?: string[]
      created?: string | Date
      modified?: string | Date
      ctime?: Date
      mtime?: Date
      size?: number
    }
    formulaValues: Record<string, unknown>
  }

  export interface PropertyConfig {
    displayName?: string
  }

  export interface BasesView {
    type: string
    name?: string
    limit?: number
    order?: string[]
    sort?: { property: string; direction?: "ASC" | "DESC" }[]
    summaries?: Record<string, string>
    columnSize?: Record<string, number>
    [key: string]: unknown
  }

  export interface BasesData {
    formulas?: Record<string, string>
    properties?: Record<string, PropertyConfig>
    summaries?: Record<string, string>
    views?: BasesView[]
  }

  export interface ViewRendererProps {
    entries: BasesEntry[]
    view: BasesView
    basesData: BasesData
    total: number
    locale: string
    slug: string
    allSlugs: string[]
    linkResolution: "absolute" | "relative" | "shortest"
    options?: Record<string, unknown>
  }

  export type ViewRenderer = (props: ViewRendererProps) => ComponentChild

  export interface ViewTypeRegistration {
    id: string
    name: string
    icon?: string
    render: ViewRenderer
    css?: string
    afterDOMLoaded?: string
    options?: Record<string, unknown>
  }
}
