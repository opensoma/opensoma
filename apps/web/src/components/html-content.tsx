import sanitizeHtml from 'sanitize-html'

interface HtmlContentProps {
  content: string
}

const ALLOWED_PROXY_HOSTS = ['www.swmaestro.ai', 'swmaestro.ai']

function shouldProxyUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ALLOWED_PROXY_HOSTS.includes(parsed.hostname)
  } catch {
    return false
  }
}

export function HtmlContent({ content }: HtmlContentProps) {
  const processedContent = content.replace(/<img([^>]+)src="([^"]+)"/gi, (match, attrs, src) => {
    let absoluteSrc: string

    if (src.startsWith('https://')) {
      if (shouldProxyUrl(src)) {
        const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(src)}`
        return `<img${attrs}src="${proxyUrl}"`
      }
      return match
    }

    if (src.startsWith('http://')) {
      absoluteSrc = src.replace('http://', 'https://')
      if (shouldProxyUrl(absoluteSrc)) {
        const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(absoluteSrc)}`
        return `<img${attrs}src="${proxyUrl}"`
      }
      return `<img${attrs}src="${absoluteSrc}"`
    }

    if (src.startsWith('//')) {
      absoluteSrc = `https:${src}`
      if (shouldProxyUrl(absoluteSrc)) {
        const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(absoluteSrc)}`
        return `<img${attrs}src="${proxyUrl}"`
      }
      return `<img${attrs}src="${absoluteSrc}"`
    }

    absoluteSrc = src.startsWith('/') ? `https://www.swmaestro.ai${src}` : `https://www.swmaestro.ai/${src}`
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(absoluteSrc)}`
    return `<img${attrs}src="${proxyUrl}"`
  })

  const sanitized = sanitizeHtml(processedContent, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'h4', 'span']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'title'],
      '*': ['class'],
    },
  })

  return (
    <div
      className="prose prose-sm prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary max-w-none text-foreground"
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}
