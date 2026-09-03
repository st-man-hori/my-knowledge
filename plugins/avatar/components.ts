import { joinSegments, pathToRoot } from "@quartz-community/utils"
import { h } from "preact"

interface Options {
  /** Path to the image, relative to the site root (e.g. "static/icon.png") */
  src: string
  /** Accessible label / alt text */
  alt: string
}

const defaultOptions: Options = {
  src: "static/icon.png",
  alt: "avatar",
}

export const Avatar = (userOpts?: Partial<Options>) => {
  const opts = { ...defaultOptions, ...userOpts }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = (props: any) => {
    const displayClass = props?.displayClass ?? ""
    const baseDir = pathToRoot(props?.fileData?.slug ?? "")
    const src = joinSegments(baseDir, opts.src)
    return h(
      "a",
      {
        href: baseDir,
        class: `avatar-link ${displayClass}`.trim(),
        "aria-label": opts.alt,
      },
      h("img", { src, alt: opts.alt, class: "avatar-image", width: 32, height: 32 }),
    )
  }

  Component.css = `
.avatar-link {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.avatar-image {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  border: 1px solid var(--lightgray);
}
`

  return Component
}
