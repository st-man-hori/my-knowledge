import { i18n } from "../i18n"
import { FullSlug, getFileExtension, joinSegments, pathToRoot, simplifySlug } from "../util/path"
import { CSSResourceToStyleElement, JSResourceToScriptElement } from "../util/resources"
import { googleFontHref, googleFontSubsetHref } from "../util/theme"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { unescapeHTML } from "../util/escape"
import { buildStructuredData } from "../util/structuredData"

export default (() => {
  const Head: QuartzComponent = ({
    cfg,
    fileData,
    externalResources,
    ctx,
  }: QuartzComponentProps) => {
    const titleSuffix = cfg.pageTitleSuffix ?? ""
    const title =
      (fileData.frontmatter?.title ?? i18n(cfg.locale).propertyDefaults.title) + titleSuffix
    const description =
      fileData.frontmatter?.socialDescription ??
      fileData.frontmatter?.description ??
      unescapeHTML(fileData.description?.trim() ?? i18n(cfg.locale).propertyDefaults.description)

    const { css, js, additionalHead } = externalResources

    const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
    const path = url.pathname as FullSlug
    const baseDir = fileData.slug === "404" ? path : pathToRoot(fileData.slug!)
    const favicon32Path = joinSegments(baseDir, "static/favicon-32.png")
    const favicon16Path = joinSegments(baseDir, "static/favicon-16.png")
    const appleTouchIconPath = joinSegments(baseDir, "static/apple-touch-icon-180.png")

    // Url of current page. Index slugs (e.g. "index", "api/index") are simplified
    // to their served directory path (e.g. "/", "api/") so canonical/og:url tags
    // point at a URL that actually resolves, instead of a literal "/index" path.
    const simpleSlug = fileData.slug === "404" ? undefined : simplifySlug(fileData.slug!)
    const socialUrl =
      fileData.slug === "404" || simpleSlug === "/"
        ? url.toString()
        : joinSegments(url.toString(), simpleSlug!)

    const usesCustomOgImage = ctx.cfg.plugins.emitters.some((e) => e.name === "CustomOgImages")
    const ogImageDefaultPath = `https://${cfg.baseUrl}/static/og-image.png`

    // Page classification, used for SEO metadata (canonical, og:type, robots, JSON-LD)
    const rawSlug = fileData.slug ?? ("index" as FullSlug)
    const is404 = rawSlug === "404"
    const isHomePage = rawSlug === "index"
    const isTagPage = rawSlug.startsWith("tags/")
    const isFolderPage = !isHomePage && rawSlug.endsWith("/index")
    const isArticle = !isHomePage && !isTagPage && !isFolderPage && !is404
    const isUnlisted = fileData.unlisted === true
    const isNoIndex = isUnlisted || is404

    const ogLocale = (cfg.locale ?? "en-US").replace("-", "_")
    const tags = fileData.frontmatter?.tags ?? []
    const datePublished = fileData.dates?.published ?? fileData.dates?.created
    const dateModified = fileData.dates?.modified

    const structuredDataScripts = isNoIndex
      ? []
      : buildStructuredData({
          baseUrl: cfg.baseUrl ?? "example.com",
          pageTitle: cfg.pageTitle,
          locale: cfg.locale,
          slug: rawSlug,
          title,
          description,
          pageUrl: socialUrl,
          isHomePage,
          isArticle,
          tags,
          datePublished,
          dateModified,
        })

    const coreStylesheet = css[0]?.content
    const coreScript = js.find(
      (r) => r.loadTime === "beforeDOMReady" && r.contentType === "external",
    )

    return (
      <head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        {coreStylesheet && <link rel="preload" href={coreStylesheet} as="style" />}
        {coreScript && coreScript.contentType === "external" && (
          <link rel="preload" href={coreScript.src} as="script" />
        )}
        {cfg.theme.cdnCaching && cfg.theme.fontOrigin === "googleFonts" && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" />
            <link rel="stylesheet" href={googleFontHref(cfg.theme)} />
            {cfg.theme.typography.title && (
              <link rel="stylesheet" href={googleFontSubsetHref(cfg.theme, cfg.pageTitle)} />
            )}
          </>
        )}
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <meta name="og:site_name" content={cfg.pageTitle}></meta>
        <meta property="og:title" content={title} />
        <meta property="og:type" content={isArticle ? "article" : "website"} />
        <meta property="og:locale" content={ogLocale} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta property="og:description" content={description} />
        <meta property="og:image:alt" content={description} />
        {isArticle && datePublished && (
          <meta property="article:published_time" content={datePublished.toISOString()} />
        )}
        {isArticle && dateModified && (
          <meta property="article:modified_time" content={dateModified.toISOString()} />
        )}
        {isArticle && tags.map((tag) => <meta property="article:tag" content={tag} key={tag} />)}

        {!usesCustomOgImage && (
          <>
            <meta property="og:image" content={ogImageDefaultPath} />
            <meta property="og:image:url" content={ogImageDefaultPath} />
            <meta name="twitter:image" content={ogImageDefaultPath} />
            <meta
              property="og:image:type"
              content={`image/${getFileExtension(ogImageDefaultPath) ?? "png"}`}
            />
          </>
        )}

        {cfg.baseUrl && (
          <>
            <meta property="twitter:domain" content={cfg.baseUrl}></meta>
            <meta property="og:url" content={socialUrl}></meta>
            <meta property="twitter:url" content={socialUrl}></meta>
          </>
        )}

        <link rel="icon" href={favicon32Path} sizes="32x32" type="image/png" />
        <link rel="icon" href={favicon16Path} sizes="16x16" type="image/png" />
        <link rel="apple-touch-icon" href={appleTouchIconPath} sizes="180x180" />
        <link rel="canonical" href={socialUrl} />
        {isNoIndex && <meta name="robots" content="noindex, nofollow" />}
        <meta name="description" content={description} />
        <meta name="generator" content="Quartz" />

        {structuredDataScripts.map((json, i) => (
          <script
            type="application/ld+json"
            key={`structured-data-${i}`}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: json.replace(/</g, "\\u003c") }}
          />
        ))}

        {css.map((resource) => CSSResourceToStyleElement(resource, true))}
        {js
          .filter((resource) => resource.loadTime === "beforeDOMReady")
          .map((res) => JSResourceToScriptElement(res, true))}
        {additionalHead.map((resource) => {
          if (typeof resource === "function") {
            return resource(fileData)
          } else {
            return resource
          }
        })}
      </head>
    )
  }

  return Head
}) satisfies QuartzComponentConstructor
