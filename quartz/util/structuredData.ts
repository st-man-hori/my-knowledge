export interface StructuredDataInput {
  baseUrl: string
  pageTitle: string
  locale: string
  slug: string
  title: string
  description: string
  pageUrl: string
  isHomePage: boolean
  isArticle: boolean
  tags: string[]
  datePublished?: Date
  dateModified?: Date
}

interface BreadcrumbItem {
  "@type": "ListItem"
  position: number
  name: string
  item: string
}

/**
 * Builds one or more schema.org JSON-LD documents (as serialized JSON strings)
 * describing the current page: a WebSite entity for the home page, a
 * BlogPosting for articles, a CollectionPage for folder/tag pages, and a
 * BreadcrumbList derived from the slug for any non-home page.
 */
export function buildStructuredData(input: StructuredDataInput): string[] {
  const rootUrl = `https://${input.baseUrl}/`
  const documents: Record<string, unknown>[] = []

  if (input.isHomePage) {
    documents.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: input.pageTitle,
      url: rootUrl,
      description: input.description,
      inLanguage: input.locale,
    })
    return documents.map((doc) => JSON.stringify(doc))
  }

  if (input.isArticle) {
    const article: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: input.title,
      description: input.description,
      url: input.pageUrl,
      inLanguage: input.locale,
      isPartOf: {
        "@type": "WebSite",
        name: input.pageTitle,
        url: rootUrl,
      },
      author: {
        "@type": "Organization",
        name: input.pageTitle,
        url: rootUrl,
      },
      publisher: {
        "@type": "Organization",
        name: input.pageTitle,
        url: rootUrl,
      },
    }
    if (input.datePublished) article.datePublished = input.datePublished.toISOString()
    if (input.dateModified) article.dateModified = input.dateModified.toISOString()
    if (input.tags.length > 0) article.keywords = input.tags.join(", ")
    documents.push(article)
  } else {
    documents.push({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: input.title,
      description: input.description,
      url: input.pageUrl,
      inLanguage: input.locale,
    })
  }

  const segments = input.slug
    .split("/")
    .filter((segment) => segment.length > 0 && segment !== "index")
  if (segments.length > 0) {
    const items: BreadcrumbItem[] = [
      { "@type": "ListItem", position: 1, name: "Home", item: rootUrl },
    ]
    let accumulated = ""
    segments.forEach((segment, index) => {
      accumulated = accumulated ? `${accumulated}/${segment}` : segment
      const isLastSegment = index === segments.length - 1
      items.push({
        "@type": "ListItem",
        position: index + 2,
        name: isLastSegment ? input.title : segment,
        item: `https://${input.baseUrl}/${accumulated}`,
      })
    })
    documents.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items,
    })
  }

  return documents.map((doc) => JSON.stringify(doc))
}
