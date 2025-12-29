# neX Multi-Tool SaaS (Django + React/Vite)

## What’s inside
- **Backend (Django/DRF):** multi-tenant models for tools, licenses, widget configs, marketplace/widget leads; license-gated pricing endpoint; admin + REST tool creation.
- **Frontend (Vite/React):** landing page with gated demo, marketplace grid + tool detail, dashboard shell (tools, vibe editor, leads placeholder), embeddable widget bundle.
- **Worker/Infra:** Celery worker service and Redis; Postgres via docker-compose; frontend dev service via Vite.

## Run locally
```bash
# backend deps are in Docker; frontend needs install once
cd widget && npm install
cd ..
docker compose up --build

# in another terminal: make migrations + create superuser
docker compose exec web python manage.py makemigrations shared marketplace accounts leads pricing
docker compose exec web python manage.py migrate
docker compose exec web python manage.py createsuperuser
```

## Seed a demo tool/license (for marketplace + widget)
```bash
docker compose exec web python manage.py shell -c "
from shared.tenant import Tenant
from marketplace.models import Tool, License
t,_=Tenant.objects.get_or_create(slug='demo', defaults={'name':'Demo Tenant','domain':'localhost'})
tool,_=Tool.objects.get_or_create(slug='landmark', defaults={'name':'Landmark Widget','price_monthly':99,'summary':'Roof-from-space estimator'})
License.objects.get_or_create(tenant=t, tool=tool, status='active')
"
```

## Interfaces
- Landing: `http://localhost:5173/` (gated demo; lead before reveal).
- Marketplace: `http://localhost:5173/marketplace` and `/marketplace/:slug` (bento detail + sandbox try).
- Dashboard: `http://localhost:5173/dashboard` (tools grid, vibe editor, leads placeholder).
- Widget: built bundle exposes `window.nexWidget`; pricing/lead flows to backend.

## Embedding the widget (tenant site)
1) Build widget bundle:
   ```bash
   cd widget
   npm install
   npm run build:widget
   # output: dist/nex-widget.iife.js
   ```
2) Host `nex-widget.iife.js` on your CDN/static bucket.
3) Give tenants this snippet (replace values):
   ```html
   <script src="https://cdn.yourdomain.com/nex-widget.iife.js"></script>
   <div id="nex-slot"></div>
   <script>
     window.nexWidget({
       tenantId: "<tenant-id>",
       apiBase: "https://api.yourdomain.com",
       toolSlug: "landmark",
       sandbox: false,
       target: "#nex-slot" // optional; defaults to body
     });
   </script>
   ```
4) Ensure backend CORS/CSRF allow the tenant domain and that the tenant has an active License for the tool (or pass `sandbox: true` for previews).

## Publishing the widget bundle (CI/CD)
The workflow `.github/workflows/widget-build.yml` builds `dist/nex-widget.iife.js` and uploads it as an artifact. You can extend it to push to your CDN/bucket.

## Adding new tools (no code changes)
- Use Django admin (`/admin`) or POST to `/api/marketplace/tools/new` (admin auth) with `name`, `slug`, `summary`, `price_monthly`, `media_url`, `bento_features`, etc.
- Marketplace UI picks up new tools automatically; create a License to let tenants access APIs.
