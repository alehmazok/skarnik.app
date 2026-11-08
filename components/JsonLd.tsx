import { serializeJsonLd } from '@/lib/seo'

/** Structured data for search engines, rendered into the server HTML. */
export default function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  )
}
