import sanitizeHtml from 'sanitize-html';

/**
 * Sanitizes HTML content to prevent XSS attacks while preserving safe formatting.
 * Allows: bold, italic, underline, links, lists, paragraphs, line breaks
 */
export function sanitizeRichText(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return sanitizeHtml(html, {
    allowedTags: [
      'p',
      'br',
      'strong',
      'b',
      'em',
      'i',
      'u',
      'a',
      'ul',
      'ol',
      'li',
      'span',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      span: ['style'], // For potential inline styles from editor
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      a: ['http', 'https', 'mailto'],
    },
    // Ensure links open safely
    transformTags: {
      a: (tagName, attribs) => {
        return {
          tagName: 'a',
          attribs: {
            href: attribs.href || '',
            target: '_blank',
            rel: 'noopener noreferrer nofollow',
          },
        };
      },
    },
    // Remove any dangerous attributes
    allowedStyles: {},
  });
}

/**
 * Strips all HTML tags from content, leaving only plain text
 */
export function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return sanitizeHtml(html, {
    allowedTags: [],
    allowedAttributes: {},
  });
}

/**
 * Validates that HTML content doesn't contain dangerous scripts or payloads
 */
export function isHtmlSafe(html: string): boolean {
  if (!html || typeof html !== 'string') {
    return true;
  }

  const dangerous = [
    '<script',
    'javascript:',
    'onerror=',
    'onload=',
    'onclick=',
    'onmouseover=',
    'eval(',
    'expression(',
  ];

  const lowerHtml = html.toLowerCase();
  return !dangerous.some((pattern) => lowerHtml.includes(pattern));
}
