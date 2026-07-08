# TRMNL Plugin for MLB Scores

A [TRMNL](https://usetrmnl.com) third-party plugin that displays upcoming and previous games for your favorite MLB team.

## How it works

This is a Cloudflare Worker that acts as a TRMNL third-party plugin. TRMNL periodically calls the worker's `/screen` endpoint, which:

1. Looks up the user's team from KV storage
2. Fetches the team's schedule from the MLB Stats API (with KV caching)
3. Fetches team logos from R2 (with fallback to MLB's CDN on first load)
4. Returns HTML markup that TRMNL renders to an e-ink image

External URLs from MLB's CDN are blocked by TRMNL's renderer, so all logos are cached in R2 and embedded as base64 data URIs.

## Installation

Install via the TRMNL plugin marketplace, or self-host using the instructions below.

## Development

### Prerequisites

- [Cloudflare](https://cloudflare.com) account with Workers, KV, and R2 access
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- Node.js 18+

### Setup

```sh
npm install
```

Configure your KV namespace IDs and R2 bucket name in `wrangler.jsonc`.

### Commands

```sh
npm test          # run tests
npm run deploy    # deploy to Cloudflare Workers
npx wrangler tail # stream live logs
```

### Plugin endpoints

| Path | Method | Purpose |
|------|--------|---------|
| `/install` | GET | Team picker form (OAuth entry point) |
| `/install` | POST | OAuth code exchange |
| `/success` | POST | Install success webhook |
| `/screen` | POST | Returns markup for TRMNL to render |
| `/manage` | GET/POST | Plugin management (team change) |
| `/uninstall` | POST | Uninstall webhook |
| `/help` | GET | Knowledge base |

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/SeanSith/trmnl_mlb_scores.

## License

Available as open source under the [MIT License](https://opensource.org/licenses/MIT).
