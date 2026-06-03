# Luckee AI — Marketing Website

The official Luckee AI marketing site: a human-agent workbench for e-commerce teams.

- **Architecture & copy:** confirmed homepage structure from CEO Ethan's export.
- **Visual identity:** Luckee 2.0 VI — forest green + oat cream, Instrument Serif × Montserrat × JetBrains Mono, pill buttons, organic atmosphere, dark-forest signature hero.

Static HTML/CSS/JS — no build step. 9 pages:

| Page | Path |
| --- | --- |
| Home | `index.html` |
| Solutions hub | `solutions.html` |
| Amazon Operation Assistant | `products/amazon-operation-assistant.html` |
| Amazon Ads Workbench | `products/amazon-ads-workbench.html` |
| Listing Optimizer · Ads Audit · Ads Automation · Image Generation · Review Analysis · Competition Analysis | `solutions/*.html` |

## Local preview

```sh
python3 -m http.server 8000
# open http://localhost:8000/
```

## Deploy

- **GitHub Pages:** served from `main` branch root (this repo).
- **Cloud Run / Nginx:** `Dockerfile` + `nginx.conf` included (see `DEPLOY.md`).
