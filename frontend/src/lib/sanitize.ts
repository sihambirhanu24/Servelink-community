import DOMPurify from 'isomorphic-dompurify';

const ALLOWED_TAGS = ['b', 'i', 'u', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'p', 'br'];
const ALLOWED_ATTR = ['href', 'target', 'rel'];

DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
  // Allow only http, https, and mailto protocols
  if (data.attrName === 'href') {
    const href = data.attrValue;
    if (href && !/^https?:\/\//i.test(href) && !/^mailto:/i.test(href)) {
      data.keepAttr = false;
    }
  }
  
  // Add security attributes to links
  if (data.attrName === 'href' && node.tagName === 'A') {
    node.setAttribute('rel', 'noopener noreferrer');
    node.setAttribute('target', '_blank');
  }
});

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    KEEP_CONTENT: true,
  });
}

/**
 * Strip HTML tags for preview/summary displays
 * This removes all HTML tags and returns plain text
 * Works on both server and client
 */
export function stripHtml(html: string): string {
  if (typeof window === 'undefined') {
    // Server-side: use regex to strip tags
    return html.replace(/<[^>]*>/g, '');
  }
  // Client-side: use DOM for better accuracy
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}
