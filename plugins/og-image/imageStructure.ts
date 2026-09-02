import { h } from "preact"
import readingTime from "reading-time"
import type { ImageOptions, SocialImageFileData, UserOpts } from "@quartz-community/og-image"

function fontName(spec: unknown): string {
  return typeof spec === "string" ? spec : (spec as { name: string }).name
}

function formatDate(d: Date, locale: string): string {
  return d.toLocaleDateString(locale, { year: "numeric", month: "short", day: "2-digit" })
}

function estimateReadingMinutes(text: string): number {
  return Math.max(1, Math.ceil(readingTime(text).minutes))
}

function getDate(fileData: SocialImageFileData): Date | undefined {
  return fileData.dates?.published ?? fileData.dates?.created
}

export function customOgImageStructure({
  cfg,
  userOpts,
  title,
  description,
  fileData,
  iconBase64,
}: ImageOptions & { userOpts: UserOpts; iconBase64?: string }) {
  const { colorScheme } = userOpts
  const theme = cfg.theme
  const colors = theme.colors[colorScheme]
  const useSmallerFont = title.length > 32
  const rawDate = getDate(fileData)
  const date = rawDate ? formatDate(rawDate, cfg.locale ?? "en-US") : null
  const minutes = estimateReadingMinutes(fileData.text ?? "")
  const readingTimeText = (userOpts.readingTimeText ?? ((m: number) => `${m} min read`))(minutes)
  const tags = fileData.frontmatter?.tags ?? []
  const bodyFont = fontName(theme.typography.body)
  const headerFont = fontName(theme.typography.header)
  const accentGradient = `linear-gradient(90deg, ${colors.secondary}, ${colors.tertiary})`

  return h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        position: "relative",
        backgroundColor: colors.light,
        fontFamily: bodyFont,
        overflow: "hidden",
      },
    },
    [
      // top accent bar
      h("div", { style: { display: "flex", height: 10, width: "100%", background: accentGradient } }),

      // decorative corner glow
      h("div", {
        style: {
          display: "flex",
          position: "absolute",
          top: -160,
          right: -160,
          width: 420,
          height: 420,
          borderRadius: 420,
          background: `radial-gradient(circle, ${colors.tertiary}33, ${colors.tertiary}00 70%)`,
        },
      }),
      h("div", {
        style: {
          display: "flex",
          position: "absolute",
          bottom: -200,
          left: -140,
          width: 380,
          height: 380,
          borderRadius: 380,
          background: `radial-gradient(circle, ${colors.secondary}26, ${colors.secondary}00 70%)`,
        },
      }),

      h(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "2.75rem 3rem",
          },
        },
        [
          h(
            "div",
            { style: { display: "flex", alignItems: "center", gap: "1.1rem", marginBottom: "0.5rem" } },
            [
              iconBase64 &&
                h("img", {
                  src: iconBase64,
                  alt: "",
                  width: 64,
                  height: 64,
                  style: {
                    borderRadius: "50%",
                    border: `3px solid ${colors.secondary}`,
                  },
                }),
              h(
                "div",
                {
                  style: {
                    display: "flex",
                    fontSize: 30,
                    fontWeight: 600,
                    color: colors.gray,
                    fontFamily: bodyFont,
                    letterSpacing: -0.5,
                  },
                },
                cfg.baseUrl,
              ),
            ],
          ),

          h(
            "div",
            { style: { display: "flex", marginTop: "1.1rem", marginBottom: "0.6rem" } },
            h(
              "h1",
              {
                style: {
                  margin: 0,
                  fontSize: useSmallerFont ? 62 : 70,
                  fontFamily: headerFont,
                  fontWeight: 800,
                  color: colors.dark,
                  lineHeight: 1.2,
                  letterSpacing: -1,
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: 2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                },
              },
              title,
            ),
          ),

          h("div", {
            style: {
              display: "flex",
              width: 64,
              height: 7,
              borderRadius: 7,
              background: accentGradient,
              marginBottom: "1.6rem",
            },
          }),

          h(
            "div",
            {
              style: {
                display: "flex",
                flex: 1,
                fontSize: 34,
                color: colors.darkgray,
                lineHeight: 1.5,
              },
            },
            h(
              "p",
              {
                style: {
                  margin: 0,
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: 4,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                },
              },
              description,
            ),
          ),

          h(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "1.5rem",
                paddingTop: "1.75rem",
                borderTop: `2px solid ${colors.lightgray}`,
              },
            },
            [
              h(
                "div",
                {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "2rem",
                    color: colors.gray,
                    fontSize: 27,
                    fontWeight: 500,
                  },
                },
                [
                  date &&
                    h(
                      "div",
                      { style: { display: "flex", alignItems: "center" } },
                      [
                        h(
                          "svg",
                          {
                            style: { marginRight: "0.5rem" },
                            width: "26",
                            height: "26",
                            viewBox: "0 0 24 24",
                            fill: "none",
                            stroke: "currentColor",
                            role: "img",
                            "aria-label": "Date",
                          },
                          [
                            h("rect", { x: "3", y: "4", width: "18", height: "18", rx: "2", ry: "2" }),
                            h("line", { x1: "16", y1: "2", x2: "16", y2: "6" }),
                            h("line", { x1: "8", y1: "2", x2: "8", y2: "6" }),
                            h("line", { x1: "3", y1: "10", x2: "21", y2: "10" }),
                          ],
                        ),
                        date,
                      ],
                    ),
                  h(
                    "div",
                    { style: { display: "flex", alignItems: "center" } },
                    [
                      h(
                        "svg",
                        {
                          style: { marginRight: "0.5rem" },
                          width: "26",
                          height: "26",
                          viewBox: "0 0 24 24",
                          fill: "none",
                          stroke: "currentColor",
                          role: "img",
                          "aria-label": "Reading time",
                        },
                        [
                          h("circle", { cx: "12", cy: "12", r: "10" }),
                          h("polyline", { points: "12 6 12 12 16 14" }),
                        ],
                      ),
                      readingTimeText,
                    ],
                  ),
                ],
              ),

              h(
                "div",
                {
                  style: {
                    display: "flex",
                    gap: "0.6rem",
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                    maxWidth: "60%",
                  },
                },
                tags.slice(0, 3).map((tag) =>
                  h(
                    "div",
                    {
                      key: tag,
                      style: {
                        display: "flex",
                        padding: "0.5rem 1.1rem",
                        background: accentGradient,
                        color: "#ffffff",
                        fontWeight: 600,
                        borderRadius: 999,
                        fontSize: 24,
                      },
                    },
                    `#${tag}`,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    ],
  )
}
