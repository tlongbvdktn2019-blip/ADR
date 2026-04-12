const BLOCKED_TAGS = [
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'form',
  'input',
  'button',
  'textarea',
  'select',
  'option',
  'meta',
  'link',
  'base',
  'svg',
  'math',
]

const ALLOWED_TAGS = new Set([
  'a',
  'abbr',
  'b',
  'blockquote',
  'br',
  'code',
  'div',
  'em',
  'figcaption',
  'figure',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  's',
  'section',
  'span',
  'strong',
  'sub',
  'sup',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
])

const SELF_CLOSING_TAGS = new Set(['br', 'hr', 'img'])
const GLOBAL_ATTRIBUTES = new Set(['class'])
const URL_ATTRIBUTES = new Set(['href', 'src'])

const ALLOWED_ATTRIBUTES_BY_TAG: Record<string, Set<string>> = {
  a: new Set(['href', 'target', 'rel', 'title']),
  img: new Set(['src', 'alt', 'title', 'width', 'height']),
  td: new Set(['colspan', 'rowspan']),
  th: new Set(['colspan', 'rowspan']),
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function sanitizeUrl(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  if (/^(javascript|vbscript|data:text\/html)/i.test(trimmed)) {
    return null
  }

  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    /^https?:\/\//i.test(trimmed) ||
    /^data:image\//i.test(trimmed)
  ) {
    return trimmed
  }

  return null
}

function sanitizeClassNames(value: string) {
  const cleaned = value
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => /^[a-zA-Z0-9:_-]+$/.test(item))

  return cleaned.length > 0 ? cleaned.join(' ') : null
}

function sanitizeAttribute(tagName: string, name: string, rawValue: string | null) {
  const lowerName = name.toLowerCase()

  if (lowerName.startsWith('on') || lowerName === 'style' || lowerName === 'srcdoc') {
    return null
  }

  const tagSpecificAttributes = ALLOWED_ATTRIBUTES_BY_TAG[tagName] || new Set<string>()
  const isAllowed = GLOBAL_ATTRIBUTES.has(lowerName) || tagSpecificAttributes.has(lowerName)

  if (!isAllowed) {
    return null
  }

  const value = rawValue ?? ''

  if (lowerName === 'class') {
    const sanitizedClassNames = sanitizeClassNames(value)
    return sanitizedClassNames ? ` class="${escapeHtml(sanitizedClassNames)}"` : null
  }

  if (URL_ATTRIBUTES.has(lowerName)) {
    const sanitizedUrl = sanitizeUrl(value)
    return sanitizedUrl ? ` ${lowerName}="${escapeHtml(sanitizedUrl)}"` : null
  }

  if (lowerName === 'target') {
    const normalizedTarget = ['_blank', '_self', '_parent', '_top'].includes(value) ? value : '_self'
    return ` target="${normalizedTarget}"`
  }

  if (lowerName === 'rel') {
    const normalizedRel = value
      .split(/\s+/)
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
      .filter((item) => ['noopener', 'noreferrer', 'nofollow'].includes(item))

    return normalizedRel.length > 0 ? ` rel="${normalizedRel.join(' ')}"` : null
  }

  if (lowerName === 'width' || lowerName === 'height' || lowerName === 'colspan' || lowerName === 'rowspan') {
    return /^\d{1,4}$/.test(value) ? ` ${lowerName}="${value}"` : null
  }

  return value ? ` ${lowerName}="${escapeHtml(value)}"` : null
}

function sanitizeOpeningTag(tagName: string, rawAttributes: string, selfClosing: boolean) {
  const attributePattern = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
  let match: RegExpExecArray | null
  let sanitizedAttributes = ''
  let hasTargetBlank = false
  let hasRel = false

  while ((match = attributePattern.exec(rawAttributes)) !== null) {
    const [, attributeName, doubleQuotedValue, singleQuotedValue, bareValue] = match
    const attributeValue = doubleQuotedValue ?? singleQuotedValue ?? bareValue ?? null
    const sanitizedAttribute = sanitizeAttribute(tagName, attributeName, attributeValue)

    if (!sanitizedAttribute) {
      continue
    }

    if (attributeName.toLowerCase() === 'target' && attributeValue === '_blank') {
      hasTargetBlank = true
    }

    if (attributeName.toLowerCase() === 'rel') {
      hasRel = true
    }

    sanitizedAttributes += sanitizedAttribute
  }

  if (tagName === 'a' && hasTargetBlank && !hasRel) {
    sanitizedAttributes += ' rel="noopener noreferrer"'
  }

  if (SELF_CLOSING_TAGS.has(tagName)) {
    return `<${tagName}${sanitizedAttributes}${selfClosing ? ' />' : '>'}`
  }

  return `<${tagName}${sanitizedAttributes}>`
}

export function sanitizeRichText(html: string | null | undefined) {
  if (!html) {
    return ''
  }

  let sanitized = html

  for (const tag of BLOCKED_TAGS) {
    const pairedTagPattern = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi')
    const standaloneTagPattern = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi')
    sanitized = sanitized.replace(pairedTagPattern, '')
    sanitized = sanitized.replace(standaloneTagPattern, '')
  }

  sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, '')

  sanitized = sanitized.replace(/<\s*(\/?)\s*([a-z0-9-]+)([^>]*)>/gi, (fullMatch, slash, rawTagName, rawAttributes) => {
    const tagName = String(rawTagName).toLowerCase()

    if (!ALLOWED_TAGS.has(tagName)) {
      return ''
    }

    if (slash) {
      return `</${tagName}>`
    }

    const selfClosing = /\/\s*>$/.test(fullMatch)
    return sanitizeOpeningTag(tagName, rawAttributes, selfClosing)
  })

  return sanitized.trim()
}
