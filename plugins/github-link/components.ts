import { h } from "preact"

interface Options {
  link: string
}

const defaultOptions: Options = {
  link: "https://github.com",
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
        "aria-label": "GitHub",
        title: "GitHub",
      },
      h(
        "svg",
        {
          xmlns: "http://www.w3.org/2000/svg",
          viewBox: "0 0 16 16",
          width: "20",
          height: "20",
          "aria-hidden": "true",
        },
        h("path", { d: GITHUB_MARK_PATH }),
      ),
    )
  }

  // Same box model as the darkmode/readermode buttons (20x32 box, svg
  // absolutely centered) so the icons line up on the toolbar row.
  Component.css = `
a.github-link {
  display: block;
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
  /* Optically matched to the neighboring moon/book icons by eye: 21px glyph,
     raised ~2.5px above the geometric center of the 32px box (the neighbors'
     glyphs sit slightly high in their boxes). */
  width: 21px;
  height: 21px;
  top: calc(50% - 13px);
  left: 0;
  fill: var(--darkgray);
  transition: fill 0.2s ease;
}
a.github-link:hover svg {
  fill: var(--secondary);
}
`

  return Component
}
