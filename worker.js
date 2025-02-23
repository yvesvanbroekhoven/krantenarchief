/**
 * v1.0.0
 * Cloudflare Worker Proxy
 * This script forwards requests to a target specified in the first path parameter
 * Example: https://your-worker.example.workers.dev/https://target-site.com/path
 *
 */
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const url = new URL(request.url);
    const targetUrl = url.pathname.slice(1); // Remove the leading slash

    if (!targetUrl) {
        return new Response('Please provide a URL to proxy (e.g. /https://example.com)', { status: 400 });
    }

    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Max-Age': '86400'
            }
        });
    }

    try {
        const target = new URL(targetUrl);
        const init = {
            method: request.method,
            headers: request.headers
        };

        if (url.search) {
            target.search = url.search;
        }

        const response = await fetch(target.toString(), init);

        const newHeaders = new Headers(response.headers);
        newHeaders.set('Access-Control-Allow-Origin', '*');
        newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        newHeaders.set('Access-Control-Allow-Headers', '*');
        newHeaders.set('Access-Control-Max-Age', '86400'); // 24 hours

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
        });

    } catch (err) {
        console.error('Error parsing URL:', err);
        return new Response(`Invalid URL: ${err.message}`, { status: 400 });
    }
}