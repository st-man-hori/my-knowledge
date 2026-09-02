import { h } from "preact"

interface Options {
  /** URL the icon links to */
  link: string
  /** Accessible label / tooltip */
  label: string
}

const defaultOptions: Options = {
  link: "https://github.com",
  label: "GitHub",
}

// GitHub mark from GitHub's Octicons (mark-github-16, MIT licensed)
const GITHUB_MARK_PATH =
  "M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"

export const GithubLink = (userOpts?: Partial<Options>) => {
  const opts = { ...defaultOptions, ...userOpts }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = (props: any) => {
    const displayClass = props?.displayClass ?? ""
    return h(
      "a",
      {
        class: `github-link ${displayClass}`.trim(),
        href: opts.link,
        target: "_blank",
        rel: "noopener noreferrer",
        "aria-label": opts.label,
        title: opts.label,
      },
      h(
        "svg",
        {
          xmlns: "http://www.w3.org/2000/svg",
          viewBox: "0 0 24 24",
          width: "20",
          height: "20",
          "aria-hidden": "true",
        },
        // The 16-unit octicon is scaled to exactly fill the 24-unit
        // viewBox (no overflow).
        h("g", { transform: "scale(1.5)" }, h("path", { d: GITHUB_MARK_PATH })),
      ),
    )
  }

  // Same technique as Quartz's darkmode/readermode toolbar buttons: an
  // absolutely-positioned icon inside a `position: relative` 20x32 slot,
  // centered via `top: calc(50% - 10px)`. Not flexbox + align-items —
  // that centers a replaced element (the <svg>) using each engine's own
  // intrinsic-size/baseline logic, which iOS Safari computes a couple of
  // pixels differently from desktop browsers, and was the actual cause of
  // the icon floating on iPhone no matter how the SVG itself was nudged.
  // Plain top/left math has no such ambiguity.
  Component.css = `
a.github-link {
  /* inline-block, not block: darkmode/reader-mode are <button>s, which
     are inline-level by default and so leave a small baseline-alignment
     gap below them inside their flex-wrapper <div> (the classic gap
     under inline/inline-block content). That gap inflates the wrapper's
     height, and the toolbar centers each icon by that wrapper height —
     so this element needs the same inline-level gap, or its wrapper ends
     up a few px shorter and the icon centers a few px lower than its
     siblings. Verified pixel-for-pixel equal in a headless-browser
     measurement of the actual toolbar markup. */
  display: inline-block;
  position: relative;
  width: 20px;
  height: 32px;
  margin: 0;
  padding: 0;
  flex-shrink: 0;
  background: none;
}
a.github-link svg {
  position: absolute;
  top: calc(50% - 10px);
  left: calc(50% - 10px);
  width: 20px;
  height: 20px;
  fill: var(--darkgray);
  transition: fill 0.2s ease;
}
a.github-link:hover svg {
  fill: var(--secondary);
}
`

  return Component
}
