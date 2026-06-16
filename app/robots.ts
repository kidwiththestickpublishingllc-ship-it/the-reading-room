export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/ttl-admin', '/account', '/api/', '/stripe/'],
    },
    sitemap: 'https://read.the-tiniest-library.com/sitemap.xml',
  };
}