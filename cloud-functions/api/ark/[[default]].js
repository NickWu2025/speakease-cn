const TARGET_BASE = 'https://ark.cn-beijing.volces.com/api/v3';

export default async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);

  const pathSuffix = url.pathname.replace(/^\/api\/ark\/?/, '');
  const targetUrl = TARGET_BASE + (pathSuffix ? '/' + pathSuffix : '') + url.search;

  const newHeaders = new Headers(request.headers);
  newHeaders.set('Host', 'ark.cn-beijing.volces.com');

  const body = request.method !== 'GET' && request.method !== 'HEAD'
    ? await request.arrayBuffer()
    : undefined;

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: newHeaders,
      body,
    });

    const respHeaders = new Headers(response.headers);
    respHeaders.set('Access-Control-Allow-Origin', '*');
    respHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    respHeaders.set('Access-Control-Allow-Headers', '*');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: respHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Proxy error', details: String(err) }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
