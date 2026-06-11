// Canonical site origin. Override with NEXT_PUBLIC_SITE_URL when the product
// moves to a custom domain.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://codenexus-code.vercel.app').replace(/\/$/, '')
export const SITE_HOST = new URL(SITE_URL).host
