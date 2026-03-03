# SEO & Metadata

## Metadata API

### Static Metadata

```typescript
// app/about/page.tsx
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us | Company Name",
  description: "Learn about our mission and team.",
  keywords: ["about", "company", "team"],
  authors: [{ name: "Company Name" }],
  creator: "Company Name",
  publisher: "Company Name",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}
```

### Dynamic Metadata

```typescript
// app/products/[id]/page.tsx
import type { Metadata, ResolvingMetadata } from "next"
import { notFound } from "next/navigation"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    return { title: "Product Not Found" }
  }

  // Access parent metadata (from layout)
  const previousImages = (await parent).openGraph?.images || []

  return {
    title: `${product.name} | Store`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.image, ...previousImages],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description,
      images: [product.image],
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) notFound()

  return <ProductDetail product={product} />
}
```

### Root Layout Metadata

```typescript
// app/layout.tsx
import type { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  metadataBase: new URL("https://example.com"),
  title: {
    default: "Company Name",
    template: "%s | Company Name", // Dynamic pages use this
  },
  description: "Your company description for search engines.",
  applicationName: "Company App",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://example.com",
    siteName: "Company Name",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Company Name",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@companyhandle",
    creator: "@companyhandle",
  },
  verification: {
    google: "google-site-verification-code",
    yandex: "yandex-verification-code",
  },
  alternates: {
    canonical: "https://example.com",
    languages: {
      "en-US": "https://example.com/en-US",
      "de-DE": "https://example.com/de-DE",
    },
  },
  category: "technology",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}
```

## Structured Data (JSON-LD)

### Organization Schema

```typescript
// components/structured-data/Organization.tsx
export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Company Name",
    url: "https://example.com",
    logo: "https://example.com/logo.png",
    sameAs: [
      "https://twitter.com/company",
      "https://linkedin.com/company/company",
      "https://github.com/company",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+1-555-555-5555",
      contactType: "customer service",
      availableLanguage: ["English"],
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
```

### Product Schema

```typescript
// components/structured-data/Product.tsx
interface ProductSchemaProps {
  product: {
    name: string
    description: string
    image: string
    sku: string
    price: number
    currency: string
    availability: "InStock" | "OutOfStock" | "PreOrder"
    rating?: { value: number; count: number }
  }
}

export function ProductSchema({ product }: ProductSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image,
    sku: product.sku,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency,
      availability: `https://schema.org/${product.availability}`,
      url: typeof window !== "undefined" ? window.location.href : "",
    },
    ...(product.rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating.value,
        reviewCount: product.rating.count,
      },
    }),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
```

### Article Schema

```typescript
// components/structured-data/Article.tsx
interface ArticleSchemaProps {
  title: string
  description: string
  image: string
  datePublished: string
  dateModified: string
  authorName: string
  url: string
}

export function ArticleSchema({
  title,
  description,
  image,
  datePublished,
  dateModified,
  authorName,
  url,
}: ArticleSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: description,
    image: image,
    datePublished: datePublished,
    dateModified: dateModified,
    author: {
      "@type": "Person",
      name: authorName,
    },
    publisher: {
      "@type": "Organization",
      name: "Company Name",
      logo: {
        "@type": "ImageObject",
        url: "https://example.com/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
```

### Breadcrumb Schema

```typescript
// components/structured-data/Breadcrumb.tsx
interface BreadcrumbItem {
  name: string
  url: string
}

export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
```

## Sitemap

### Static Sitemap

```typescript
// app/sitemap.ts
import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://example.com",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 1,
    },
    {
      url: "https://example.com/about",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://example.com/blog",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ]
}
```

### Dynamic Sitemap

```typescript
// app/sitemap.ts
import type { MetadataRoute } from "next"
import { getAllProducts, getAllPosts } from "@/lib/queries"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://example.com"

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ]

  // Dynamic product pages
  const products = await getAllProducts()
  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }))

  // Dynamic blog pages
  const posts = await getAllPosts()
  const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }))

  return [...staticPages, ...productPages, ...blogPages]
}
```

### Multiple Sitemaps (Large Sites)

```typescript
// app/sitemap/[id]/route.ts
import { getAllProducts } from "@/lib/queries"

const URLS_PER_SITEMAP = 50000

export async function generateSitemaps() {
  const products = await getAllProducts()
  const totalSitemaps = Math.ceil(products.length / URLS_PER_SITEMAP)

  return Array.from({ length: totalSitemaps }, (_, i) => ({ id: i }))
}

export default async function sitemap({ id }: { id: number }) {
  const products = await getAllProducts()
  const start = id * URLS_PER_SITEMAP
  const end = start + URLS_PER_SITEMAP
  const batch = products.slice(start, end)

  return batch.map((product) => ({
    url: `https://example.com/products/${product.slug}`,
    lastModified: product.updatedAt,
  }))
}
```

## Robots.txt

```typescript
// app/robots.ts
import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://example.com"

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/private/"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: "/admin/",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
```

## OpenGraph Images

### Static OG Image

```typescript
// app/opengraph-image.tsx
import { ImageResponse } from "next/og"

export const runtime = "edge"

export const alt = "Company Name"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: "linear-gradient(to bottom, #1a1a2e, #16213e)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
        }}
      >
        Company Name
      </div>
    ),
    { ...size }
  )
}
```

### Dynamic OG Image

```typescript
// app/blog/[slug]/opengraph-image.tsx
import { ImageResponse } from "next/og"
import { getPost } from "@/lib/queries"

export const runtime = "edge"
export const alt = "Blog Post"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: "#1a1a2e",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: 80,
          color: "white",
        }}
      >
        <div style={{ fontSize: 24, color: "#888", marginBottom: 20 }}>
          Blog
        </div>
        <div style={{ lineHeight: 1.2 }}>{post?.title || "Post"}</div>
        <div style={{ fontSize: 24, color: "#888", marginTop: 40 }}>
          example.com
        </div>
      </div>
    ),
    { ...size }
  )
}
```

## SEO Best Practices

### URL Structure

```typescript
// Good URL patterns
/products/blue-widget           // Descriptive slugs
/blog/2024/how-to-optimize-seo  // Date in blog posts (optional)
/categories/electronics         // Clean category URLs

// Avoid
/products?id=123                // Query params for content
/p/123                          // Non-descriptive
/products/Blue_Widget           // Underscores (use hyphens)
```

### Canonical URLs

```typescript
// app/products/[slug]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  return {
    alternates: {
      canonical: `https://example.com/products/${slug}`,
    },
  }
}
```

### Handling Pagination

```typescript
// app/blog/page.tsx
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}): Promise<Metadata> {
  const params = await searchParams
  const page = parseInt(params.page || "1")
  const totalPages = await getTotalPages()

  return {
    title: page > 1 ? `Blog - Page ${page}` : "Blog",
    alternates: {
      canonical: "https://example.com/blog",
    },
    other: {
      ...(page > 1 && {
        "link rel='prev'": `https://example.com/blog?page=${page - 1}`,
      }),
      ...(page < totalPages && {
        "link rel='next'": `https://example.com/blog?page=${page + 1}`,
      }),
    },
  }
}
```

### No-Index Pages

```typescript
// app/admin/page.tsx
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
}
```

## Performance & SEO

| Factor | Impact | Solution |
|--------|--------|----------|
| LCP | High | Optimize images, use priority |
| CLS | High | Set image dimensions |
| INP | Medium | Reduce JavaScript |
| TTFB | Medium | Edge caching, ISR |
| Mobile-first | High | Responsive design |
| HTTPS | High | Always use HTTPS |

## SEO Checklist

- [ ] Unique title & description per page
- [ ] OpenGraph & Twitter cards configured
- [ ] Structured data for products/articles
- [ ] Sitemap.xml generated
- [ ] Robots.txt configured
- [ ] Canonical URLs set
- [ ] Mobile-friendly design
- [ ] Fast loading (Core Web Vitals)
- [ ] HTTPS enabled
- [ ] Alt text on images
- [ ] Semantic HTML structure
- [ ] Internal linking strategy
