const apiOrigin = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000')
  .replace(/\/api\/?$/, '');

export function getMediaUrl(path: string) {
  if (!path) {
    console.warn('[getMediaUrl] Empty path provided');
    return '';
  }
  
  if (/^https?:\/\//i.test(path)) {
    console.log('[getMediaUrl] Absolute URL:', path);
    return path;
  }

  const normalizedPath = path
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/^\//, '');

  const finalUrl = `${apiOrigin}/${normalizedPath}`;
  console.log('[getMediaUrl] Input:', path, '→ Output:', finalUrl);
  
  return finalUrl;
}
