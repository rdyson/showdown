import { describe, it, expect, vi, afterEach } from 'vitest';
import worker from '../worker.js';

describe('worker proxy', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('proxies GET requests on showdown.run and strips set-cookie', async () => {
    const upstreamResponse = new Response('ok', {
      status: 200,
      headers: {
        'content-type': 'text/plain',
        'set-cookie': 'session=abc123; HttpOnly',
      },
    });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(upstreamResponse);

    const req = new Request('https://showdown.run/path?q=1', { method: 'GET' });
    const res = await worker.fetch(req);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [upstreamUrl, init] = fetchSpy.mock.calls[0];
    expect(upstreamUrl).toBe('https://rdyson--7ddb868a18ad11f18c9d42dde27851f2.web.val.run/path?q=1');
    expect(init.method).toBe('GET');
    expect(init.redirect).toBe('manual');
    expect(init.body).toBeUndefined();
    expect(init.headers.get('Host')).toBe('rdyson--7ddb868a18ad11f18c9d42dde27851f2.web.val.run');

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/plain');
    expect(res.headers.get('set-cookie')).toBeNull();
    expect(await res.text()).toBe('ok');
  });

  it('forwards request body for non-GET/HEAD methods on showdown.run', async () => {
    const upstreamResponse = new Response('created', { status: 201 });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(upstreamResponse);

    const req = new Request('https://showdown.run/api', {
      method: 'POST',
      body: 'payload',
      headers: { 'content-type': 'text/plain' },
    });

    const res = await worker.fetch(req);
    const [, init] = fetchSpy.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.body).toBe(req.body);
    expect(res.status).toBe(201);
    expect(await res.text()).toBe('created');
  });

  it('redirects showdown.rdyson.dev to showdown.run with 301', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const req = new Request('https://showdown.rdyson.dev/some/path?x=1', { method: 'GET' });
    const res = await worker.fetch(req);

    // Should redirect, not proxy
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe('https://showdown.run/some/path?x=1');
  });
});
