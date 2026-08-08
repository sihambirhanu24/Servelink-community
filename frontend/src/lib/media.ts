const apiOrigin = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000')
  .replace(/\/api\/?$/, '');

export function getMediaUrl(path: string) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;

  const normalizedPath = path
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/^\//, '');

  if (normalizedPath.startsWith('uploads/')) {
    return `${apiOrigin}/${normalizedPath}`;
  }

  return `${apiOrigin}/${normalizedPath}`;
}
