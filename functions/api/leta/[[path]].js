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

  return fetch(modifiedRequest)
}
