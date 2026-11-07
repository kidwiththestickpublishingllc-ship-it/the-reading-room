export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/stripe/',
        '/ttl-admin',
        '/members',
        '/reading-room/account',
        '/reading-room/login',
        '/reading-room/inkwell',
        '/reading-room/genres',
      ],
    },
    sitemap: 'https://read.the-tiniest-library.com/sitemap.xml',
  };
}