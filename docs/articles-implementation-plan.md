# Articles / Blog Implementation Plan

A plan for adding an SEO-focused articles section to Quicktalog. No CMS. Articles are typed TSX content modules served under `/articles`, fully static, and built from a small set of reusable components. This document covers the architecture, the file layout, ready-to-use code, the SEO wiring, the image strategy, the first 6 articles in detail, and the writing voice.

---

## TL;DR (the decisions)

1. **Where:** a new section at `/articles` (index) and `/articles/[slug]` (each post), statically generated at build time.
2. **How content is authored:** one typed `.tsx` file per article in `content/articles/`, each exporting `meta` (typed frontmatter) and a `Body` component built from reusable blocks. A single `registry.ts` collects them. No database, no MDX tooling, no new dependencies.
3. **Why this shape:** it matches the patterns already in the repo (constants driven, component driven, `generatePageMetadata` for SEO), gives full control over JSON-LD and internal links, and renders as fast static HTML, which is what search engines reward. Adding an article later is two steps: drop a file, add one registry line.
4. **First 6 articles:** three use-case pieces, two feature how-tos, and one competitor comparison. Listed with outlines, keywords, and images further down.
5. **Images:** a mix of assets already in `public/` and free stock photos from Unsplash, pulled straight into `next/image`. Your `next.config.ts` already allows remote images from any host, so no config change is needed.
6. **Voice:** every article is written with the authentic-writing rules. Clear, warm, no AI-speak, no em dashes, no filler.

---

## 1. Goals

The articles exist to do two jobs at once.

The first is search visibility. Right now the sitemap has the home page, pricing, demo, contact, and the legal pages. There is no content targeting the questions a restaurant owner or a salon manager actually types into Google before they know Quicktalog exists. Each article targets a real search query and gives a genuine answer, which is what earns rankings and brings in people who are not searching for the brand yet.

The second is product promotion. Every article shows Quicktalog solving the problem it describes, with a clear path to the demo or sign-up. The point is not to bolt a banner onto a generic blog post. The product is the answer to the question the article asks.

Both jobs are served by the same thing: useful, specific writing that happens to feature the product because the product genuinely fits.

---

## 2. Architecture decision

### What was chosen

Typed TSX content modules. Each article is a `.tsx` file that exports two things: a typed `meta` object (title, slug, description, keywords, hero image, date, author, category, reading time) and a default `Body` React component assembled from reusable blocks like `Prose`, `ArticleImage`, `Callout`, `ComparisonTable`, and `ArticleCTA`. A registry file imports every article module and exposes helpers (`getAllArticles`, `getArticleBySlug`, `getAllSlugs`).

### Why, and what was not chosen

Three options were on the table.

Per-article hand-built pages (`app/articles/some-slug/page.tsx` each fully custom) were rejected. Every article would re-implement the layout, the metadata, and the JSON-LD. That does not scale past a handful of posts and invites drift.

MDX (`.mdx` files plus `@next/mdx`) is a reasonable choice and is friendlier for non-developers long term, but it is not set up in the repo today. It would mean adding tooling and build config, and you still have to build the custom components either way. For a developer-authored, SEO-controlled set of articles, the extra moving parts do not pay for themselves yet.

Typed TSX modules win because they add zero dependencies, sit naturally beside the existing `constants/` and `components/` conventions, give complete control over per-article SEO and internal linking, and render as static HTML through `generateStaticParams`. If you later want non-developers writing posts, MDX or a headless CMS can be layered on without throwing any of this away, because the rendering components and the route stay the same.

---

## 3. File and folder layout

```
app/
  articles/
    page.tsx                      # /articles index (listing grid)
    [slug]/
      page.tsx                    # /articles/[slug] (one article, SSG)

content/
  articles/
    _types.ts                     # Article + ArticleMeta types
    registry.ts                   # imports every article, exports the array
    digital-menu-for-restaurants.tsx
    digital-service-menu-salons-spas.tsx
    create-catalog-with-ai.tsx
    qr-code-catalog-guide.tsx
    digital-catalog-alternatives.tsx
    businesses-that-need-digital-catalog.tsx

components/
  articles/
    ArticleLayout.tsx             # Navbar + hero header + article shell + Footer
    ArticleHero.tsx               # title, meta row, hero image
    Prose.tsx                     # typography wrapper for body text
    ArticleImage.tsx              # next/image with caption + rounded frame
    Callout.tsx                   # highlighted tip / note box
    ComparisonTable.tsx           # responsive feature comparison table
    ArticleCTA.tsx                # mid and end call to action block
    ArticleCard.tsx               # card used on the index grid
    RelatedArticles.tsx           # 2 to 3 related posts at the foot
    AuthorByline.tsx              # small author + date + reading time row

helpers/
  articles.ts                     # query functions: getAllArticles, getArticleBySlug, getRelatedArticles

constants/
  metadata.ts                     # add generateArticleMetadata()
  schemas.ts                      # add generateArticleSchema() + breadcrumb

app/sitemap.ts                    # add article URLs
components/navigation/Navbar.tsx  # add "Articles" link (desktop + mobile)
components/navigation/Footer.tsx  # add "Articles" to quick links
```

The placement follows the conventions already in the repo, so nothing feels bolted on. The articles themselves are content, so they sit in a new `content/articles/` folder. The functions that read them (get all, get by slug, get related) are plain feature helpers, so they live in `helpers/articles.ts` right next to `catalogueItems.ts`. The SEO generators stay in `constants/`, where `metadata.ts` and `schemas.ts` already are. So `content/` holds the writing, `helpers/` holds the logic, `constants/` holds the config, and `components/articles/` holds the rendering. Nothing existing is restructured.

---

## 4. The data model

`content/articles/_types.ts`

```ts
import type { ReactNode } from "react";

export type ArticleCategory =
  | "Use cases"
  | "Guides"
  | "Comparisons"
  | "Product";

export interface ArticleMeta {
  slug: string;                 // url segment, e.g. "digital-menu-for-restaurants"
  title: string;                // H1 + <title>
  description: string;          // meta description + card excerpt (150-160 chars)
  category: ArticleCategory;
  keywords: string[];           // primary + secondary keywords
  heroImage: string;            // /public path or remote https URL
  heroImageAlt: string;
  heroCredit?: { name: string; url: string }; // for stock photos
  publishedAt: string;          // ISO date "2026-06-19"
  updatedAt?: string;           // ISO date
  readingTimeMinutes: number;
  author: string;               // default "The Quicktalog Team"
  featured?: boolean;           // pin on the index page
  relatedSlugs?: string[];      // manual related links
}

export interface Article {
  meta: ArticleMeta;
  Body: () => ReactNode;
}
```

`content/articles/registry.ts`

```ts
import type { Article } from "./_types";

import digitalMenuForRestaurants from "./digital-menu-for-restaurants";
import digitalServiceMenuSalonsSpas from "./digital-service-menu-salons-spas";
import createCatalogWithAi from "./create-catalog-with-ai";
import qrCodeCatalogGuide from "./qr-code-catalog-guide";
import digitalCatalogAlternatives from "./digital-catalog-alternatives";
import businessesThatNeedDigitalCatalog from "./businesses-that-need-digital-catalog";

// The one list of articles. This file only holds the array. The functions that
// read it live in helpers/articles.ts, to match the repo's helpers convention.
export const articles: Article[] = [
  digitalMenuForRestaurants,
  digitalServiceMenuSalonsSpas,
  createCatalogWithAi,
  qrCodeCatalogGuide,
  digitalCatalogAlternatives,
  businessesThatNeedDigitalCatalog,
];
```

`helpers/articles.ts`

```ts
import type { Article } from "@/content/articles/_types";
import { articles } from "@/content/articles/registry";

export const getAllArticles = (): Article[] =>
  [...articles].sort(
    (a, b) =>
      new Date(b.meta.publishedAt).getTime() -
      new Date(a.meta.publishedAt).getTime(),
  );

export const getAllSlugs = (): string[] => articles.map((a) => a.meta.slug);

export const getArticleBySlug = (slug: string): Article | undefined =>
  articles.find((a) => a.meta.slug === slug);

export const getRelatedArticles = (slug: string, limit = 2): Article[] => {
  const current = getArticleBySlug(slug);
  if (!current) return [];
  const explicit = (current.meta.relatedSlugs ?? [])
    .map((s) => getArticleBySlug(s))
    .filter(Boolean) as Article[];
  if (explicit.length >= limit) return explicit.slice(0, limit);
  const sameCategory = articles.filter(
    (a) => a.meta.slug !== slug && a.meta.category === current.meta.category,
  );
  return [...explicit, ...sameCategory].slice(0, limit);
};
```

The array in `registry.ts` is the single source of truth, and `helpers/articles.ts` is the only thing that queries it. The index page, the sitemap, `generateStaticParams`, and the related-post logic all call those helpers.

---

## 5. The dynamic route (one article)

`app/articles/[slug]/page.tsx`. Static at build, with per-article metadata and Article JSON-LD. This mirrors how `app/help/page.tsx` and the other static pages already work, just driven by the registry.

```tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/navigation/Footer";
import ArticleHero from "@/components/articles/ArticleHero";
import RelatedArticles from "@/components/articles/RelatedArticles";
import ArticleCTA from "@/components/articles/ArticleCTA";
import {
  getAllSlugs,
  getArticleBySlug,
  getRelatedArticles,
} from "@/helpers/articles";
import { generateArticleMetadata } from "@/constants/metadata";
import { generateArticleSchema } from "@/constants/schemas";

export const dynamicParams = false; // only known slugs, everything else 404s

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};
  return generateArticleMetadata(article.meta);
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const { meta, Body } = article;
  const related = getRelatedArticles(slug);
  const schema = generateArticleSchema(meta);

  return (
    <div className="font-lora">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Navbar />
      <article className="pt-24 pb-16">
        <ArticleHero meta={meta} />
        <div className="max-w-3xl mx-auto px-4">
          <Body />
          <ArticleCTA variant="end" />
        </div>
        <RelatedArticles articles={related} />
      </article>
      <Footer />
    </div>
  );
}
```

Notes that matter for SEO and correctness:

`dynamicParams = false` means only the six known slugs render. Anything else returns the existing `not-found.tsx`. No surprise pages, no thin duplicate URLs.

`generateStaticParams` makes every article a static HTML file at build time. Fast first paint, good Core Web Vitals, no runtime database call.

The JSON-LD `<script>` uses the same `dangerouslySetInnerHTML` pattern already used across the app, so it is consistent with `help`, `pricing`, and the rest.

---

## 6. The index page (`/articles`)

`app/articles/page.tsx`. A simple, on-brand grid of cards plus an intro header that reuses the existing `SectionWrapper` look.

```tsx
import type { Metadata } from "next";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/navigation/Footer";
import ArticleCard from "@/components/articles/ArticleCard";
import { getAllArticles } from "@/helpers/articles";
import { generatePageMetadata } from "@/constants/metadata";
import { getPageSchema } from "@/constants/schemas";

export const metadata: Metadata = generatePageMetadata("articles");

export default function ArticlesIndexPage() {
  const articles = getAllArticles();
  const featured = articles.find((a) => a.meta.featured) ?? articles[0];
  const rest = articles.filter((a) => a.meta.slug !== featured.meta.slug);

  return (
    <div className="font-lora">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getPageSchema("articles")),
        }}
      />
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 pt-32 pb-20">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Guides for going digital
          </h1>
          <p className="max-w-2xl mx-auto text-product-foreground-accent">
            Practical advice on digital menus, product catalogs, QR codes, and
            getting more out of Quicktalog. Written for owners and teams, not
            developers.
          </p>
        </header>

        <ArticleCard article={featured} featured />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {rest.map((article) => (
            <ArticleCard key={article.meta.slug} article={article} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
```

---

## 7. Reusable components (the block kit)

Ten small components. Together they are the whole authoring surface. Each one uses the existing `product-*` design tokens and `font-lora`, so articles look like the rest of the site without new styles.

`Prose` wraps body text and sets the typographic rhythm (paragraph spacing, headings, links, lists). It is the one place article text styling lives.

```tsx
// components/articles/Prose.tsx
import type { ReactNode } from "react";

export default function Prose({ children }: { children: ReactNode }) {
  return (
    <div
      className="
        max-w-none text-product-foreground leading-relaxed
        [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mt-12 [&>h2]:mb-4
        [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:mt-8 [&>h3]:mb-3
        [&>p]:mb-5 [&>p]:text-lg
        [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-5 [&>ul>li]:mb-2
        [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-5
        [&_a]:text-product-primary [&_a]:underline [&_a]:font-medium
      "
    >
      {children}
    </div>
  );
}
```

`ArticleImage` is the component the brief calls for: a captioned `next/image` that works with both local and remote sources. Because `next.config.ts` already sets `remotePatterns` to allow any host, an Unsplash URL drops straight in.

```tsx
// components/articles/ArticleImage.tsx
import Image from "next/image";

interface Props {
  src: string;          // /public path OR https remote URL
  alt: string;          // real, descriptive alt text (SEO + accessibility)
  caption?: string;
  credit?: { name: string; url: string };
  priority?: boolean;
}

export default function ArticleImage({
  src,
  alt,
  caption,
  credit,
  priority,
}: Props) {
  return (
    <figure className="my-8">
      <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-product-border shadow-sm">
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-cover"
        />
      </div>
      {(caption || credit) && (
        <figcaption className="text-sm text-product-foreground-accent mt-2 text-center">
          {caption}
          {credit && (
            <>
              {" "}
              Photo by{" "}
              <a href={credit.url} className="underline" rel="nofollow noopener">
                {credit.name}
              </a>
              .
            </>
          )}
        </figcaption>
      )}
    </figure>
  );
}
```

`ArticleCTA` is the promotion engine. One component, two placements (mid-article and end), pointing at the demo and sign-up. This keeps every article consistent and makes the conversion path a single thing to tune later.

```tsx
// components/articles/ArticleCTA.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ArticleCTA({
  variant = "mid",
  heading = "Build your first catalog free",
  body = "Turn your menu, services, or products into an interactive digital catalog in minutes. No code, no card required.",
}: {
  variant?: "mid" | "end";
  heading?: string;
  body?: string;
}) {
  return (
    <aside
      className={`${
        variant === "end" ? "mt-14" : "my-10"
      } rounded-2xl border border-product-border bg-product-background-hero p-8 text-center`}
    >
      <h3 className="text-2xl font-bold mb-2">{heading}</h3>
      <p className="text-product-foreground-accent mb-6 max-w-xl mx-auto">
        {body}
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link href="/auth?mode=signup">
          <Button>Start free</Button>
        </Link>
        <Link href="/demo">
          <Button variant="outline">Try the demo</Button>
        </Link>
      </div>
    </aside>
  );
}
```

`ComparisonTable` powers the competitor article: a responsive table that takes rows of features and a column per product, with check and cross marks. `Callout` is a tip or note box. `ArticleHero`, `ArticleCard`, `RelatedArticles`, and `AuthorByline` handle the title block, the index cards, the footer links, and the byline row. All are small and follow the same token-based styling. Full implementations are straightforward to write from these signatures during the build phase.

---

## 8. What an article file looks like

This is the whole authoring pattern. One file, typed meta, a body built from blocks. Shown abbreviated for the restaurant article so the shape is clear.

```tsx
// content/articles/digital-menu-for-restaurants.tsx
import type { Article } from "./_types";
import Prose from "@/components/articles/Prose";
import ArticleImage from "@/components/articles/ArticleImage";
import Callout from "@/components/articles/Callout";
import ArticleCTA from "@/components/articles/ArticleCTA";

export const meta = {
  slug: "digital-menu-for-restaurants",
  title: "How to Create a Digital Menu for Your Restaurant (Free QR Code Menu)",
  description:
    "A step by step guide to building a free, mobile-friendly QR code menu for your restaurant. Update prices in seconds and ditch the reprints.",
  category: "Use cases",
  keywords: [
    "digital menu for restaurants",
    "QR code menu",
    "free QR menu maker",
    "restaurant menu maker",
    "online menu",
  ],
  heroImage:
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80",
  heroImageAlt:
    "Restaurant table with a phone showing a digital menu next to a coffee cup",
  heroCredit: { name: "Unsplash", url: "https://unsplash.com" },
  publishedAt: "2026-06-19",
  readingTimeMinutes: 7,
  author: "The Quicktalog Team",
  featured: true,
  relatedSlugs: ["qr-code-catalog-guide", "create-catalog-with-ai"],
} as const;

function Body() {
  return (
    <>
      <Prose>
        <p>
          Printed menus go out of date the moment a supplier raises a price.
          A digital menu fixes that. You change one line, and every guest who
          scans the code sees the new version. Here is how to set one up for
          your restaurant in an afternoon, for free.
        </p>
        <h2>Why restaurants are moving to digital menus</h2>
        <p>{/* ... */}</p>
      </Prose>

      <ArticleImage
        src="/images/hero-mockup.png"
        alt="Quicktalog digital menu open on a phone"
        caption="A Quicktalog menu adapts to any screen size."
      />

      <Callout title="Keep your old menu">
        Already have a printed menu? Snap a photo and use OCR import to turn it
        into a digital one. No retyping.
      </Callout>

      <ArticleCTA variant="mid" />

      <Prose>
        <h2>Step 1: Add your dishes</h2>
        <p>{/* ... */}</p>
      </Prose>
    </>
  );
}

const article: Article = { meta, Body };
export default article;
```

The writer mostly works inside `<Prose>` and drops in an image, a callout, or a CTA where it helps. Real article text replaces the comments and is written with the authentic-writing voice in section 13.

---

## 9. SEO wiring

The repo already has a clean SEO setup. The articles plug into it rather than inventing a new one.

### 9.1 Page metadata

Add an `articles` entry to `pageMetadata` in `constants/metadata.ts` for the index page, and a `generateArticleMetadata` helper for individual posts. The helper reuses `siteMetadata` exactly like `generatePageMetadata` does, but takes per-article values and sets `openGraph.type` to `"article"`.

```ts
// constants/metadata.ts  (additions)

// add to pageMetadata:
articles: {
  title: "Quicktalog Blog - Guides for Digital Menus & Catalogs",
  description:
    "Practical guides on digital menus, product catalogs, QR codes, and growing your business with Quicktalog.",
  url: "https://www.quicktalog.app/articles",
},

import type { ArticleMeta } from "@/content/articles/_types";

export function generateArticleMetadata(meta: ArticleMeta): Metadata {
  const url = `https://www.quicktalog.app/articles/${meta.slug}`;
  return {
    title: `${meta.title} | Quicktalog`,
    description: meta.description,
    generator: "Quicktalog",
    applicationName: "Quicktalog",
    keywords: [...siteMetadata.keywords, ...meta.keywords],
    authors: [{ name: meta.author }],
    creator: siteMetadata.creator,
    publisher: siteMetadata.publisher,
    metadataBase: siteMetadata.metadataBase,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      locale: "en_US",
      url,
      siteName: "Quicktalog",
      title: meta.title,
      description: meta.description,
      images: [meta.heroImage],
      publishedTime: meta.publishedAt,
      modifiedTime: meta.updatedAt ?? meta.publishedAt,
      authors: [meta.author],
    },
    twitter: {
      card: "summary_large_image",
      site: "@quicktalog",
      creator: "@quicktalog",
      title: meta.title,
      description: meta.description,
      images: [meta.heroImage],
    },
  };
}
```

### 9.2 Structured data (JSON-LD)

Add a `generateArticleSchema` to `constants/schemas.ts` that emits `BlogPosting` plus a `BreadcrumbList`. `BlogPosting` is what gets articles eligible for rich results and helps Google understand author, date, and headline. The breadcrumb gives the Home > Articles > Title trail in search listings.

```ts
// constants/schemas.ts  (addition)
import type { ArticleMeta } from "@/content/articles/_types";

export function generateArticleSchema(meta: ArticleMeta) {
  const url = `https://www.quicktalog.app/articles/${meta.slug}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: meta.title,
        description: meta.description,
        image: meta.heroImage,
        datePublished: meta.publishedAt,
        dateModified: meta.updatedAt ?? meta.publishedAt,
        author: { "@type": "Organization", name: meta.author },
        publisher: {
          "@type": "Organization",
          name: "Quicktalog",
          logo: {
            "@type": "ImageObject",
            url: "https://www.quicktalog.app/logo.svg",
          },
        },
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        keywords: meta.keywords.join(", "),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.quicktalog.app" },
          { "@type": "ListItem", position: 2, name: "Articles", item: "https://www.quicktalog.app/articles" },
          { "@type": "ListItem", position: 3, name: meta.title, item: url },
        ],
      },
    ],
  };
}
```

Also add `articles: articlesPageSchema` (a `CollectionPage` like `showcasesPageSchema`) to the `getPageSchema` map so the index page emits structured data too.

### 9.3 Sitemap

`app/sitemap.ts` is built by hand today. Add the articles index and every article URL. Because the registry is the source of truth, this loop never goes stale.

```ts
// app/sitemap.ts  (additions, inside the function)
import { getAllArticles } from "@/helpers/articles";

// add to staticUrls:
{
  url: `${baseUrl}/articles`,
  lastModified: new Date(),
  changeFrequency: "weekly",
  priority: 0.7,
},

// and append article URLs:
const articleUrls: MetadataRoute.Sitemap = getAllArticles().map((a) => ({
  url: `${baseUrl}/articles/${a.meta.slug}`,
  lastModified: new Date(a.meta.updatedAt ?? a.meta.publishedAt),
  changeFrequency: "monthly",
  priority: 0.7,
}));

return [...staticUrls, ...articleUrls, ...catalogueUrls];
```

`robots.ts` needs no change. It already allows everything except `/admin`, `/api`, and `/test`, so `/articles` is crawlable by default.

### 9.4 Internal linking

Internal links are half the SEO value, and they are free. Three rules:

Every article links to at least two other articles, through `relatedSlugs` and inline links in the body. This spreads ranking signal and keeps readers on the site.

Every article links to a product page (`/demo`, `/pricing`, or `/auth?mode=signup`) through the CTA blocks, which doubles as the promotion path.

The listicle article (number 6 below) acts as a hub. It links out to the vertical use-case articles, and they link back to it. This builds a small topic cluster that search engines read as topical depth.

Add an "Articles" link to the main nav and the footer so the section is reachable from every page, which also tells crawlers it matters.

### 9.5 Navigation and footer

`components/navigation/Navbar.tsx`: add one desktop `NavLink` and one `MobileNavLink` for `/articles`, using an icon already imported from `react-icons` (for example `FiBookOpen` or `LuNewspaper`).

```tsx
// desktop links block
<NavLink href="/articles" icon={FiBookOpen}>
  Articles
</NavLink>
```

`components/navigation/Footer.tsx`: add `{ text: "Articles", url: "/articles" }` to `footerDetails.quickLinks` in `constants/details.ts`. That single change puts it in the footer everywhere.

---

## 10. Image strategy

Images do two jobs: they make the article look professional, and they give search engines more to index through descriptive alt text and filenames. The plan mixes assets already in the repo with free stock photos.

### 10.1 Assets already in the repo

These are in `public/` today and are reused so articles feel native to the product:

- `public/images/hero-mockup.png` and `public/images/hero.png`, the product on a phone. Good for any "this is what it looks like" moment.
- `public/templates/quick-template.png` and `public/templates/standard-template.png`, template previews. Perfect for the comparison and the AI articles.
- `public/layouts/variant_1.jpg` through `variant_4.jpg`, layout variants. Useful as inline examples in the listicle and the salon piece.
- `public/images/card1.svg`, `card2.svg`, `card3.svg`, `mockup-1.svg` to `mockup-3.svg`, `ai.svg`, `step2.svg`, and `public/builder/content.svg`, clean vector art for feature explainers (especially the AI and QR guides).

### 10.2 Stock photos from the web

For real-world scene shots (a cafe table, a salon, a boutique), the plan uses Unsplash. Their license allows commercial use without attribution, though a credit link is polite and is built into `ArticleImage` through the `heroCredit` field.

Because `next.config.ts` sets `remotePatterns` to allow any `https` host, an Unsplash CDN URL works directly in `next/image` with no config change:

```
https://images.unsplash.com/photo-<id>?auto=format&fit=crop&w=1600&q=80
```

The `w` and `q` params keep file size sensible. `next/image` then serves WebP and the right size per device.

A note on reliability for the build phase: exact photo IDs are locked and checked at implementation time so none 404. Each article below lists the search query and the scene to pick, plus the safest existing asset as a fallback. If you would rather not depend on remote hosts at all, the same photos can be downloaded into `public/articles/<slug>/` and referenced locally. That is one extra step but gives you full control and the fastest possible load. Either path works with the same `ArticleImage` component.

### 10.3 Rules for every image

Alt text describes the scene in plain words and, where it fits naturally, includes the topic. "Restaurant table with a QR code menu on a phone" beats "menu image". Never keyword-stuff.

Hero images use `priority` so they load first. In-body images do not, so they lazy load.

Filenames for any downloaded image use the slug and a description, for example `digital-menu-for-restaurants-qr-table.jpg`, which is a small, free SEO signal.

Aspect ratio is 16:9 for heroes and most in-body shots, which `ArticleImage` enforces, so the grid and the article stay tidy.

---

## 11. The 6 articles

A balance the brief asked for: use cases, feature how-tos, and a competitor comparison. Together they cover the main verticals (restaurants, salons, retail and others), the headline features (AI, OCR, QR, analytics), and the buying decision. They also interlink into one topic cluster.

| # | Working title | Slug | Category | Primary keyword | Role in cluster |
|---|---------------|------|----------|-----------------|-----------------|
| 1 | How to Create a Digital Menu for Your Restaurant (Free QR Code Menu) | `digital-menu-for-restaurants` | Use cases | digital menu for restaurants | Flagship use case |
| 2 | The Digital Service Menu Every Salon and Spa Should Have | `digital-service-menu-salons-spas` | Use cases | digital menu for salons | Vertical use case |
| 3 | Build a Product Catalog in Minutes with AI | `create-catalog-with-ai` | Guides | AI catalog generator | Feature how-to (AI + OCR) |
| 4 | QR Codes for Menus and Catalogs: The Complete Guide | `qr-code-catalog-guide` | Guides | QR code menu | Feature how-to (QR + analytics) |
| 5 | The Best Way to Make a Digital Catalog (vs PDF, Canva, Flipbooks, WordPress) | `digital-catalog-alternatives` | Comparisons | digital catalog alternatives | Decision / bottom of funnel |
| 6 | 12 Businesses That Need a Digital Catalog (and How to Make One Free) | `businesses-that-need-digital-catalog` | Use cases | digital catalog for small business | Hub linking to verticals |

The sections below give each article its search intent, keywords, full outline, the Quicktalog features it shows, the internal links, and the images.

### Article 1: Digital menu for restaurants

**Slug:** `digital-menu-for-restaurants` &nbsp;|&nbsp; **Category:** Use cases &nbsp;|&nbsp; **Featured:** yes

**Search intent.** A restaurant or cafe owner wants a QR code menu and is weighing whether to pay for one. High commercial intent, ready to act.

**Keywords.** Primary: digital menu for restaurants. Secondary: QR code menu, free QR menu maker, restaurant menu maker, contactless menu, online menu for restaurant.

**Outline.**
1. The cost of a printed menu that is already out of date (hook, the price-change problem).
2. What a digital menu actually is, and what a QR code menu adds.
3. Why restaurants switch: instant updates, no reprint costs, photos that sell dishes, accessibility, mobile-first.
4. Build one in four steps: add dishes (or import an existing menu with OCR), pick a template, brand it, share the QR.
5. Where to put the QR code: tables, window, receipts, Instagram bio.
6. Keeping it current: 86 a dish in seconds, seasonal specials.
7. Common questions: cost, printing, no app needed for guests.

**Features shown.** QR sharing, instant updates, OCR import of an existing menu, templates, mobile-first design, free plan.

**Internal links.** To article 4 (QR guide) and article 3 (AI build). CTA to `/demo` and `/auth?mode=signup`.

**Images.** Hero: Unsplash, search "restaurant table phone menu" or "cafe qr code table", a warm scene of a phone showing a menu at a table. In-body product shot: `public/images/hero-mockup.png`. Optional second scene: Unsplash "people ordering cafe phone". Fallback hero if avoiding remote: `public/templates/quick-template.png`.

### Article 2: Digital service menu for salons and spas

**Slug:** `digital-service-menu-salons-spas` &nbsp;|&nbsp; **Category:** Use cases

**Search intent.** A salon, spa, or barbershop owner wants to show services and prices in a way that looks current and is easy to share, often from an Instagram bio.

**Keywords.** Primary: digital menu for salons. Secondary: salon service menu, spa price list online, hair salon menu maker, service catalog, barber price list.

**Outline.**
1. The pinned-photo problem: an out-of-date price list screenshot in the Instagram bio.
2. Why a service menu is different from a food menu (packages, durations, tiered pricing).
3. Building a service catalog: categories, prices, durations, a photo per service.
4. Branding it to match the salon, then sharing it as a link and a QR at the front desk.
5. Updating prices and seasonal offers without a designer.
6. Seeing what clients look at most with analytics, then promoting the popular services.
7. A note on the link-in-bio play for Instagram and TikTok.

**Features shown.** Service catalog structure, custom branding, link and QR sharing, instant price updates, analytics, free plan.

**Internal links.** To article 6 (hub) and article 4 (QR guide). CTA to `/demo`.

**Images.** Hero: Unsplash, search "salon interior reception" or "spa treatment room", a clean, inviting space. In-body: `public/layouts/variant_2.jpg` as a layout example, plus `public/images/mockup-1.svg`. Fallback hero: `public/images/hero.png`.

### Article 3: Build a catalog with AI

**Slug:** `create-catalog-with-ai` &nbsp;|&nbsp; **Category:** Guides &nbsp;|&nbsp; **Featured candidate**

**Search intent.** Someone curious whether AI can build their catalog or menu for them, and how. Feature-led, mid-funnel.

**Keywords.** Primary: AI catalog generator. Secondary: AI menu maker, create catalog with AI, generate product catalog, AI catalog builder, OCR menu import.

**Outline.**
1. The blank-page problem: most people stall at the first empty catalog.
2. Two fast starts: describe it and let AI draft it, or photograph an existing menu and let OCR import it.
3. Walkthrough, AI route: the prompt, what gets generated, how to review it.
4. Walkthrough, OCR route: photo or PDF in, structured items out, fixing the odd typo.
5. Editing in the builder: reorder, add photos, set prices.
6. Publishing and sharing.
7. When AI helps and when to do it by hand (honest guidance).

**Features shown.** AI generation, OCR import, the builder, publishing, templates.

**Internal links.** To article 1 (restaurant) and article 4 (QR). CTA to `/admin/create/ai` route and `/demo`.

**Images.** Hero: `public/images/ai.svg` on a branded background, or Unsplash "laptop dashboard desk". In-body: `public/builder/content.svg` and `public/images/step2.svg` to show the flow. This article leans on existing vector art and needs little or no stock.

### Article 4: QR codes for menus and catalogs

**Slug:** `qr-code-catalog-guide` &nbsp;|&nbsp; **Category:** Guides

**Search intent.** Practical and broad: how to make a QR code for a menu or catalog, how to design it, how to track scans. Strong top-of-funnel volume.

**Keywords.** Primary: QR code menu. Secondary: how to make a QR code menu, QR code for catalog, track QR code scans, custom QR code, QR code generator for restaurant.

**Outline.**
1. What a QR code menu really is, and why dynamic beats a static printed code.
2. Make one in three steps inside Quicktalog.
3. Designing the code: colors, logo in the middle, keeping it scannable.
4. Where to place it: tables, packaging, windows, business cards, social bios.
5. Printing tips: size, contrast, quiet zone, testing before you print a hundred.
6. Tracking scans and views, and what the numbers tell you.
7. Mistakes to avoid: dead links, codes too small, no fallback.

**Features shown.** QR editor and styling, dynamic links that never need reprinting, analytics, sharing.

**Internal links.** To article 1 and article 2 (both use QR). CTA to `/demo`.

**Images.** Hero: Unsplash, search "person scanning qr code phone" or "qr code restaurant table". In-body: `public/images/card1.svg` to `card3.svg` for the steps, and a real photo of a QR on a table. Fallback hero: `public/images/quicktalog-banner.png`.

### Article 5: The best way to make a digital catalog (vs PDF, Canva, flipbooks, WordPress)

**Slug:** `digital-catalog-alternatives` &nbsp;|&nbsp; **Category:** Comparisons

**Search intent.** Someone comparing ways to make a digital catalog or menu. They have probably tried a PDF, a Canva design, a flipbook tool, or a WordPress page, and they want to know which one is right. Bottom of funnel, high intent. This is the competitor analysis the brief asked for, written fairly rather than as a hit piece.

**Keywords.** Primary: digital catalog alternatives. Secondary: Canva alternative for catalogs, WordPress alternative for catalog, Flipsnack alternative, Issuu alternative, interactive catalog vs PDF, best way to make a digital menu.

**Approach.** Walk through the common routes, give each a fair hearing, and let Quicktalog win on the axes where it genuinely does (speed, mobile-first to view and to build, a live shareable link, QR, live updates, free start). Being honest about where each tool is the right pick is what makes the rest believable. The honest read on each:

- PDF: anyone can make one, but it is hard to read on a phone and it goes stale the moment a price changes.
- Canva (design tool): great for a one-off printed sheet or a social graphic. The catalog is not really live online, there is no hosted catalog link or QR that updates when you edit, and building a proper multi-page catalog on a phone is awkward. You design, export, then re-export for every change.
- Flipbook tools, Flipsnack and Issuu: they look like a magazine, but it is a print mindset on a screen, often heavy on mobile, and the good features sit behind a paid plan.
- Catalog Machine: solid for large structured product catalogs, more than a small menu or service list needs.
- WordPress: the right tool when you genuinely need a full website, but heavy and costly for a catalog, with plugins and hosting to manage and editing that is not friendly on a phone.
- Quicktalog (interactive web catalog): mobile-first to view and to build, a live link and QR, instant updates, analytics, AI or OCR to start, free plan.

**Outline.**
1. The ways people make a digital catalog today, and the job each tool was built for.
2. The flat PDF: easy to make, hard to read on a phone, stale on the first price change.
3. The design tool (Canva): lovely for print, but not a live shareable catalog, and clumsy to build properly on a phone.
4. The flipbook (Flipsnack, Issuu): a magazine feel, a print mindset, usually paid for the parts that matter.
5. The website builder (WordPress): right for a whole site, wrong for a catalog you just want to share by link or QR.
6. The interactive web catalog (Quicktalog): mobile-first, live updates, QR, analytics, free to start.
7. Side-by-side comparison table.
8. Which to pick for which job, and how to switch in an afternoon if you already have a PDF or a Canva export (OCR import).

**Comparison table (the `ComparisonTable` component).** Columns: Quicktalog, PDF, Canva, Flipbook tools, WordPress. Rows: easy to view on a phone, easy to edit on a phone, live shareable link and QR, update without re-export or redeploy, built-in analytics, AI or OCR quick start, free plan, no design or developer skill needed. This table is the centerpiece and the most shared part of the article.

**Features shown.** Mobile-first viewing and editing, live link and QR, instant updates, analytics, AI and OCR, free plan.

**Internal links.** To article 1 (restaurants) and article 3 (AI build). CTA to `/pricing` and `/demo`.

**Images.** Hero: side-by-side concept using `public/templates/standard-template.png` next to `public/templates/quick-template.png`, or Unsplash "printed brochures stack" to represent the old way. The comparison table itself is the main visual. Fallback hero: `public/images/hero-mockup.png`.

### Article 6: Businesses that need a digital catalog

**Slug:** `businesses-that-need-digital-catalog` &nbsp;|&nbsp; **Category:** Use cases &nbsp;|&nbsp; **Role:** cluster hub

**Search intent.** Discovery and inspiration across many verticals. One article that captures a lot of long-tail "digital catalog for X" interest and routes readers to the deeper vertical pieces.

**Keywords.** Primary: digital catalog for small business. Secondary: who needs a digital catalog, digital catalog ideas, online catalog for retail, catalog for service business.

**Outline.**
1. Short intro: if you sell something or list services, a catalog earns its keep.
2. The list, a short punchy entry each with a real scenario and a Quicktalog angle: restaurants and cafes, salons and spas, gyms and studios, boutiques and retail, real estate, hotels and B&Bs, florists, event planners, home services (plumbers, electricians), artists and makers, nonprofits, schools and clubs.
3. What they all share: things change, sharing should be easy, printing is waste.
4. How to start free in minutes.

**Features shown.** Versatility, templates, QR, free plan. Light touch, breadth over depth.

**Internal links.** This is the hub. It links out to article 1 (restaurants), article 2 (salons), and any future vertical articles, and they link back here. CTA to `/auth?mode=signup`.

**Images.** Hero: Unsplash, search "small business owner shop" or a bright retail counter. In-body: rotate `public/layouts/variant_1.jpg` through `variant_4.jpg` as small visual breaks between vertical groups. Fallback hero: `public/images/quicktalog-banner.png`.

---

## 12. Writing voice (authentic-writing)

Every article follows the authentic-writing rules. The short version, applied to these pieces:

Write like a knowledgeable colleague, not a brochure. Open with a specific problem or a fact, never with "In today's fast-paced world" or "Are you looking for". Mix sentence lengths so it has rhythm. Use the simple word over the fancy one. No em dashes, commas do the job. No contractions, write "do not" and "it is". Keep exclamation marks to almost never. Skip "In conclusion" wrappers and just stop when the point is made.

Stay honest, especially in the comparison article. Saying where a competitor is a better fit makes the rest believable and reads better to search engines than empty superlatives. Show the product as the natural answer to the problem, not as a sales interruption. The reader should finish each piece with something useful even if they never sign up, because that is what earns the ranking that brings the next reader.

A quick self-check before any article ships: would a real person say this sentence out loud, is every sentence earning its place, and does any phrase sound like generic AI text. If yes to the last one, rewrite it.

---

## 13. Build roadmap

A sensible order, each step shippable on its own.

Phase 1, the rails. Create `_types.ts`, the ten components in `components/articles/`, and the two routes (`app/articles/page.tsx` and `app/articles/[slug]/page.tsx`) with an empty registry. Wire `generateArticleMetadata`, `generateArticleSchema`, the sitemap loop, and the nav and footer links. At the end of this phase the section exists and is empty.

Phase 2, the flagship. Write article 1 (restaurants) end to end with real images and the authentic-writing voice. This proves the whole pipeline: authoring, rendering, SEO tags, JSON-LD, the CTA path. Review it, lock the voice.

Phase 3, the rest. Write articles 2 through 6 against the approved pattern. The comparison article (5) gets the `ComparisonTable` built out. The listicle (6) wires up the internal links to 1 and 2.

Phase 4, finish. Verify with a production build, check the JSON-LD in Google's Rich Results Test, confirm every image loads and has alt text, submit the updated sitemap in Search Console, and run Lighthouse on two articles.

The first phase is the only one with shared plumbing. After that, each article is independent work that does not block the others.

## 14. Adding an article later (the payoff)

Once the rails exist, a new article is two steps and no plumbing:

1. Create `content/articles/my-new-topic.tsx` with a `meta` object and a `Body`, copying any existing article as a starting point.
2. Add one import and one array entry in `content/articles/registry.ts`.

The sitemap, the index grid, `generateStaticParams`, the metadata, the JSON-LD, and the related-posts logic all pick it up automatically because they read from the registry. No route to add, no SEO to redo. That is the whole reason for choosing this shape.

## 15. Optional, later

Worth considering once the six are live, in rough priority order: an RSS feed at `app/articles/rss.xml` for syndication, category index pages (`/articles/category/guides`) if the library grows past fifteen or so posts, a table of contents for the longer guides, an author page if you want named bylines, and a lightweight search box over the registry. None are needed for launch. They are easy to add later precisely because the content already lives in a typed, queryable registry rather than scattered across hand-built pages.

---

## Summary of files to add or touch

New: `app/articles/page.tsx`, `app/articles/[slug]/page.tsx`, `content/articles/_types.ts`, `content/articles/registry.ts`, six article `.tsx` files, `helpers/articles.ts` (the query functions), ten components in `components/articles/`.

Edited: `constants/metadata.ts` (add `articles` entry and `generateArticleMetadata`), `constants/schemas.ts` (add `generateArticleSchema` and `articlesPageSchema`), `app/sitemap.ts` (add article URLs), `components/navigation/Navbar.tsx` (add link), `constants/details.ts` (add footer link).

No new dependencies. No CMS. No config changes. The articles render as static HTML, plug into the SEO setup that is already here, and scale to as many posts as you want to write.
