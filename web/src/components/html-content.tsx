import sanitizeHtml from 'sanitize-html'

interface HtmlContentProps {
  content: string
}

export function HtmlContent({ content }: HtmlContentProps) {
  const sanitized = sanitizeHtml(content, {
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
