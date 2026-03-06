# Showdown Proxy

Cloudflare Worker that proxies `showdown.rdyson.dev` to a [Val Town](https://val.town) project, avoiding the need for a Val Town Pro account for custom domains.

## How it works

```
showdown.rdyson.dev → Cloudflare Worker → val.run upstream
```

The worker receives requests at the custom domain, fetches from the Val Town project URL, and returns the response. The browser URL stays as `showdown.rdyson.dev`.

## Setup

Requires the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) and a Cloudflare account with the domain configured.

```bash
npx wrangler login
npx wrangler deploy
```

Wrangler handles DNS, SSL, and routing automatically via the `custom_domain` route in `wrangler.toml`.

## Updating the upstream

Edit the `UPSTREAM` constant in `worker.js` and redeploy:

```bash
npx wrangler deploy
```

## Teardown

```bash
npx wrangler delete
```
