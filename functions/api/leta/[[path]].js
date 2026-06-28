export async function onRequest(context) {
  const { request } = context
  const url = new URL(request.url)
  // Remove /api/leta prefix → forward to ltimg.com
  url.hostname = 'www.ltimg.com'
  url.pathname = url.pathname.replace(/^\/api\/leta/, '/api')

  const modifiedRequest = new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
  })

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  const upstreamResponse = await fetch(modifiedRequest)

  // Add CORS headers to upstream response
  const corsHeaders = new Headers(upstreamResponse.headers)
  corsHeaders.set('Access-Control-Allow-Origin', request.headers.get('Origin') || '*')
  corsHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  corsHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: corsHeaders,
  })
}
