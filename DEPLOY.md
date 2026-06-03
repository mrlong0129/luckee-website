# Deploy Luckee static site

This site is packaged for Google Cloud Run as a small Nginx static server.

## Cloud Run

From this directory:

```sh
gcloud run deploy luckee-frontend-staging \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

The Nginx config serves:

- `/` and `/home/` as the homepage
- `/solutions` as `solutions.html`
- `/solutions/listing-optimizer`
- `/solutions/ads-audit`
- `/solutions/ads-automation`
- `/solutions/image-generation`
- `/solutions/review-analysis`
- `/solutions/competition-analysis`
- `/products/amazon-operation-assistant`
- `/products/amazon-ads-workbench`
