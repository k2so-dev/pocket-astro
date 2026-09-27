import type { Article, BreadcrumbList, Organization, WebSite, WithContext } from "schema-dts"
import { site } from "@/site"

export function websiteSchema(url: URL): WithContext<WebSite> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    description: site.description,
    url: url.href,
    inLanguage: site.lang,
  }
}

export function organizationSchema(url: URL): WithContext<Organization> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: url.href,
    logo: new URL(site.logo, url).href,
    sameAs: site.sameAs,
  }
}

export function breadcrumbSchema(url: URL, items: { name: string; path: string }[]): WithContext<BreadcrumbList> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: new URL(item.path, url).href,
    })),
  }
}

export function articleSchema(
  url: URL,
  article: {
    title: string
    description?: string
    image?: string
    published: string
    modified?: string
    author?: string
  },
): WithContext<Article> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    image: article.image ? new URL(article.image, url).href : undefined,
    datePublished: article.published,
    dateModified: article.modified ?? article.published,
    author: { "@type": "Person", name: article.author ?? site.name },
    publisher: { "@type": "Organization", name: site.name, logo: new URL(site.logo, url).href },
    mainEntityOfPage: url.href,
  }
}
