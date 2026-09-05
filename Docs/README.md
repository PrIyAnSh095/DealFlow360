# DealFlow360 — Complete Project Documentation

## Purpose

This folder is the single source of truth for designing, implementing, testing, demoing, and maintaining DealFlow360.

DealFlow360 is an **intelligent, self-governing B2B sales operations platform**. The core product is not merely a CRM: it is a deal engine that continuously evaluates quotations and coordinates pricing governance, approvals, inventory/fulfillment, hybrid billing, customer negotiation, and deal health.

## Source of truth

1. The official DealFlow360 problem statement supplied for the hackathon.
2. The approved Excalidraw end-to-end mockup supplied by the team.
3. This documentation package.
4. Actual implementation and automated tests.

If these conflict, do not silently guess. Record the conflict and resolve it with the team.

## Non-negotiable hackathon requirements

- Use real-time/dynamic application data; do not rely on static JSON except initial prototyping/seed data.
- Responsive, clean, consistent UI.
- Robust input validation.
- Intuitive navigation and proper menu spacing.
- Proper Git/version-control workflow with multiple contributors.
- Core business rules must be implemented in application logic, not faked for the demo.
- Customer negotiation must be a real separate restricted view.
- Prefer real backend API, data model, and local database.
- AI/code generated with assistance must be understood, reviewed, and adapted.
- Plan for local/offline operation where practical; do not make the core product dependent on internet/cloud services.
- Do not add technology merely because it is trendy.

## Product flow

Login → Dashboard → Deals/Quotations → Quote Builder → Risk/Approval → Fulfillment → Subscription/Billing → Customer Negotiation → Re-approval if terms changed → Order → Payment/Invoice → Deal Health/Reporting.

## Design direction

The UI direction combines:
- B2B SaaS CRM reference: overall hierarchy, navigation, whitespace and pipeline.
- CRM/order-management reference: operational tables, detail pages and transaction workflows.
- Dark/light SaaS reference: one coherent design system across both themes.

The approved Excalidraw mockup is the **functional screen map**, not a reason to reproduce every wireframe literally.

## Signature product ideas

- Live Deal Health.
- Explainable approval reasons.
- What-if discount/margin simulation.
- Deal Decision Timeline.
- Margin-aware upsell/cross-sell.
- Dynamic warehouse fulfillment recommendation.
- Deal Rescue recommendations.
- Customer negotiation that can automatically re-enter approval.

## Recommended implementation stack

Unless the team deliberately changes it:

- Frontend: Next.js + TypeScript.
- Backend: FastAPI + Python.
- Database: PostgreSQL.
- ORM/migrations: SQLAlchemy + Alembic.
- API style: REST + OpenAPI.
- Validation: Zod on frontend and Pydantic on backend.
- Auth: secure HTTP-only cookie/session or equivalent secure token strategy.
- Local runtime: Docker Compose.
- Tests: Pytest for backend; Playwright for critical end-to-end flows; frontend unit tests where useful.
- Optional AI: local Ollama or another replaceable provider. AI is never the source of truth for financial/business calculations.

Changing the stack is allowed only after updating TRD, ARCHITECTURE, DEV_SETUP and API/DATABASE decisions.

## Definition of "done"

A feature is not done because its screen exists. It is done when:
1. database model/state exists where required;
2. API exists;
3. business rules are implemented;
4. UI consumes real API data;
5. validation/error/loading/empty states exist;
6. permissions are enforced server-side;
7. relevant tests pass;
8. dark/light themes work;
9. refresh/reload preserves correct state;
10. Git history contains a reviewable contribution;
11. it works in a clean local environment.

See BACKLOG.md, TEST_PLAN.md and AI_AGENT.md.
