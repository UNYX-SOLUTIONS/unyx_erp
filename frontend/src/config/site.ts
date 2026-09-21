export const siteConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? 'Unyx ERP',
  description: 'Sistema de planificación de recursos empresariales',
  url: 'http://localhost:3000',
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
};
