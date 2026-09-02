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
      "button",
      {
        type: "button",
        class: `github-link ${displayClass}`.trim(),
        "data-link": opts.link,
        "aria-label": opts.label,
        title: opts.label,
      },
      h(
        "svg",
        {
          xmlns: "http://www.w3.org/2000/svg",
          // Octicon's native 16x16 viewBox, used as-is (no scale transform).
          viewBox: "0 0 16 16",
          width: "20",
          height: "20",
          "aria-hidden": "true",
        },
        h("path", { d: GITHUB_MARK_PATH }),
      ),
    )
  }

  // A <button>, not an <a>: darkmode/reader-mode are both <button>s, and
  // an <a> styled to imitate a <button>'s box model still isn't a
  // <button> — it can inherit different font/line-height metrics from
  // its surroundings, and the gap that creates under an inline-level box
  // computed differently enough on iOS Safari/Chrome to throw the icon
  // off vertically, even once matched pixel-for-pixel on desktop. Making
  // this an actual <button>, styled identically to darkmode/reader-mode's
  // own CSS below, removes that whole class of tag-dependent discrepancy
  // — it's now the same element type as its siblings, not a lookalike.
  Component.css = `
button.github-link {
  cursor: pointer;
  padding: 0;
  position: relative;
  background: none;
  border: none;
  width: 20px;
  height: 32px;
  margin: 0;
  text-align: inherit;
  flex-shrink: 0;
}
button.github-link svg {
  position: absolute;
  top: calc(50% - 10px);
  left: calc(50% - 10px);
  width: 20px;
  height: 20px;
  fill: var(--darkgray);
  transition: fill 0.2s ease;
}
button.github-link:hover svg {
  fill: var(--secondary);
}
`

  // Same wiring pattern as darkmode/reader-mode's own inline scripts:
  // attach a click handler on every "nav"/"render" (Quartz's SPA
  // navigation events), and register its removal via window.addCleanup
  // so it doesn't pile up duplicate listeners across page swaps.
  Component.beforeDOMLoaded = `
(() => {
  const openGithubLink = (e) => {
    const link = e.currentTarget.getAttribute("data-link")
    if (link) {
      window.open(link, "_blank", "noopener,noreferrer")
    }
  }
  const setupGithubLink = () => {
    for (const el of document.getElementsByClassName("github-link")) {
      el.addEventListener("click", openGithubLink)
      window.addCleanup(() => el.removeEventListener("click", openGithubLink))
    }
  }
  document.addEventListener("nav", setupGithubLink)
  document.addEventListener("render", setupGithubLink)
})()
`

  return Component
}
