export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return Response.json(
    {
      ok: true,
      service: 'CodeNexus',
      timestamp: new Date().toISOString(),
      uptimeSec: Math.round(process.uptime()),
      node: process.version,
      version: process.env.npm_package_version ?? '0.1.0',
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  )
}
