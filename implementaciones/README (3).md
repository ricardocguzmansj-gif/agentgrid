# AgentGrid Pro — versión comercial lista para vender

Starter comercial multiempresa para vender una plataforma de agentes autónomos con marca propia.

## Qué incluye
- Backend **FastAPI** con login JWT, tenants, planes, agentes, runs y WebSockets.
- Worker **Celery + Redis** para ejecutar los runs.
- **PostgreSQL** para persistencia.
- Frontend **React + Vite** con:
  - login demo,
  - alta de cliente/tenant,
  - alta de agentes,
  - ejecución de runs,
  - eventos y estado en vivo.
- Abstracción de proveedor LLM:
  - `mock`
  - `openai`
  - `anthropic`
  - `groq`

## Demo incluida
Al iniciar por primera vez se crea:
- tenant: `digitalsun`
- email: `owner@digitalsun.ai`
- password: `ChangeThisNow123!`

## Cómo levantarlo
```bash
cd agentgrid_commercial
cp backend/.env.example backend/.env
docker compose up --build
```

### URLs
- API: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`
- Frontend: `http://localhost:5173`

## Cómo venderlo
### Opción 1 — SaaS con marca propia
Vendés acceso mensual:
- Starter: USD 49
- Pro: USD 149
- Scale: USD 499

### Opción 2 — White-label por cliente
Cobrás:
- setup inicial,
- branding,
- configuración de prompts,
- conexión a proveedor LLM,
- soporte mensual.

### Opción 3 — servicio + software
Vendés:
- plataforma,
- diseño de agentes,
- prompts,
- automatizaciones,
- soporte.

## Variables importantes
Editar `backend/.env`:
- `SECRET_KEY`
- `SUPERADMIN_EMAIL`
- `SUPERADMIN_PASSWORD`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GROQ_API_KEY`

## Qué falta para una versión enterprise
- pagos reales con Stripe/Mercado Pago,
- RBAC más fino,
- auditoría avanzada,
- cifrado de secretos por tenant,
- límites mensuales estrictos por plan,
- tests automatizados,
- observabilidad y alertas,
- SSO,
- colas separadas por prioridad.

## Estructura
```text
backend/
  app/
    api/
    core/
    db/
    deps/
    models/
    schemas/
    services/
    workers/
frontend/
docker-compose.yml
```

## Recomendación comercial
Empezá vendiendo la versión `Pro` o `Scale` como:
**“plataforma de agentes IA para empresas, con panel, límites, monitoreo y marca propia.”**
