# AgentGrid

Starter comercial para vender una plataforma tipo AntiGravity:
- Backend FastAPI
- Workers Celery
- Redis + PostgreSQL
- Dashboard React/Vite
- Control de tiempo, pasos y presupuesto
- WebSocket para monitoreo en vivo

## 1. Requisitos
- Docker Desktop
- Git

## 2. Levantar el sistema
```bash
cp backend/.env.example backend/.env
docker compose up --build
```

Servicios:
- API: http://localhost:8000
- Swagger: http://localhost:8000/docs
- Frontend: http://localhost:5173

## 3. Flujo demo
1. Abrí el frontend.
2. Hacé clic en **Crear agente demo**.
3. Hacé clic en **Lanzar run**.
4. Mirá el monitoreo en vivo.
5. Probá pausar, reanudar o cancelar.

## 4. Cómo venderlo
Este starter ya sirve como base vendible para:
- automatización interna de empresas
- agentes de research
- agentes de soporte
- copilotos de backoffice
- agencias que revenden automatización

## 5. Próximos pasos para comercializarlo
- Reemplazar `mock_agent_step()` por integración real con LLM y tools.
- Agregar autenticación multiusuario y cobro por plan.
- Separar tenants por organización.
- Incorporar aprobaciones humanas para acciones críticas.
- Añadir facturación y panel de consumo por cliente.

## 6. Endpoints principales
- `POST /api/v1/agents`
- `GET /api/v1/agents`
- `POST /api/v1/runs`
- `GET /api/v1/runs`
- `GET /api/v1/runs/{run_id}`
- `GET /api/v1/runs/{run_id}/events`
- `POST /api/v1/runs/{run_id}/pause`
- `POST /api/v1/runs/{run_id}/resume`
- `POST /api/v1/runs/{run_id}/cancel`
- `WS /ws/runs/{run_id}`

## 7. Licenciamiento recomendado
Para venderlo de forma profesional:
- licencia comercial privada
- contrato de implementación + soporte
- SLA por plan
- hoja de ruta Enterprise

## 8. Advertencia honesta
Este proyecto está listo como **starter comercial sólido**, no como producto enterprise totalmente auditado. Antes de vender a gran escala conviene agregar:
- tests
- observabilidad
- hardening
- rate limiting
- RBAC
- migraciones versionadas
- backups
