# Embedding the neX Widget

## Build the bundle
```bash
cd widget
npm install      # first time
npm run build:widget
# dist/nex-widget.iife.js is produced
```

## Host and embed
Upload `dist/nex-widget.iife.js` to your CDN/static host, then provide tenants:
```html
<script src="https://cdn.yourdomain.com/nex-widget.iife.js"></script>
<div id="nex-slot"></div>
<script>
  window.nexWidget({
    tenantId: "<tenant-id>",
    apiBase: "https://api.yourdomain.com",
    toolSlug: "landmark",
    sandbox: false,        // true for previews without license
    target: "#nex-slot"    // optional; defaults to body
  });
</script>
```

## Backend prerequisites
- Tenant exists and has an active `License` for the tool (unless `sandbox: true`).
- CORS/CSRF envs include the tenant domain.
- Widget config is returned by `/api/widget/config` (uses `X-Tenant-ID` header or host domain).

## Publish via CI
`/.github/workflows/widget-build.yml` builds the bundle and uploads `nex-widget.iife.js` as an artifact. Extend it with a deploy step (e.g., upload to S3/Cloud Storage) to automate publishing.
