---
description: Agent Orchestra repo cleanup + monorepo hardening workflow
---
1. **Phase 0 — Preflight + Context Alignment**
   - Read `openmemory.md` + `SKILL.md` to align with context-engineering and omni-stack standards.
   - `git status` to snapshot working tree; note untracked/modified files.
   - Verify toolchains per global rule: `python3 --version`, `node --version`, `npm --version`, `pip --version`, `docker --version`, `ollama --version` (or document if absent). Record gaps for setup-dev-environment skill.
   - Inspect `.env.example` files in backend/frontend; list required secrets and confirm no real keys checked in.

2. **Phase 1 — Repo Bloat Removal & Baseline CI**
   - Remove placeholder docs: `SECURITY_*.md`, `PENTABOT_*.md`, `DEPENDABOT_*.md`, `.semgrepignore` clones while retaining `SECURITY_HARDENING_CHECKLIST.md` + core docs.
   - Create root `.gitkeep` list for any directories emptied by deletions.
   - Add `.github/workflows/ci.yml` running backend pytest + frontend lint/build (use caching, matrix optional). Ensure secrets not required.
   - Commit: `chore: trim doc bloat and add CI` once lint/tests pass locally (pytest, npm run lint/build).

3. **Phase 2 — Monorepo Tooling + Infra Skeleton**
   - Initialize root `package.json` with workspaces (`frontend`, `q-and-a-orchestra-agent`) and scripts delegating to Turborepo (add `turbo` devDep + `turbo.json`).
   - Add `infra/docker/docker-compose.yml` orchestrating backend, frontend, redis (Phase 7) with `env_file` references.
   - Document new commands in `README.md` (Quickstart section) and `docs/dev-setup.md` per global rule.

4. **Phase 3 — Backend Verification Loop**
   - Create/activate virtualenv in `q-and-a-orchestra-agent`; install `requirements.txt` + dev extras (slowapi, python-jose[cryptography], pytest).
   - Run `python main_v2.py` locally; hit `GET /health` + `POST /uiag/session` via curl to confirm CopilotKit routes respond.
   - Capture any stack traces; file bugs or add TODOs before moving on.

5. **Phase 4 — Frontend Reconstruction + CopilotKit Wiring**
   - Inside `frontend`, regenerate Next.js app if current code is inconsistent: `npx create-next-app@latest . --ts --tailwind --app` (confirm backups before overwriting).
   - Install dependencies: `npm i @copilotkit/react-core @copilotkit/react-ui zustand lucide-react socket.io-client @tanstack/react-query`.
   - Build demo page (`src/app/page.tsx`) that:
     - Connects to backend at `http://localhost:8000/uiag/session`.
     - Shows live status + Copilot popup (per README promises).
     - Uses Zustand for session state.
   - `npm run dev` to verify, then `npm run build`.

6. **Phase 5 — Demo Assets + README Upgrade**
   - Record 30s screen capture of `docker compose up` → hitting frontend button → agent response (store under `demo/agent-orchestra-demo.mp4` + convert GIF for README badge).
   - Add `demo/curl-uiag-session.sh` demonstrating API call + sample JSON output.
   - Update README hero: badges (CI, Docker), embedded GIF, condensed Quickstart, Screenshots section.

7. **Phase 6 — Production Hardening Enhancements**
   - Add Redis service to docker compose for session persistence; ensure backend reads `REDIS_URL` from env.
   - Integrate `slowapi` limiter + auth stub in CopilotKit endpoints (10/min default) and expose `GET /health`, `GET /metrics` routers.
   - Convert backend settings to `pydantic-settings` with feature flags for semantic cache/budget mgmt toggles.
   - Ensure `.env.example` files exist for both services with safe placeholders; reference them in README + docs.

8. **Phase 7 — Validation + Promotion**
   - Run `turbo run test` (backend pytest + frontend tests) locally; ensure CI mirrors commands.
   - `docker compose up --build` to verify end-to-end.
   - Commit grouped changes (`feat: monorepo + docker`, `feat: demo frontend`, `chore: prod hardening`).
   - Push branch, monitor CI, then merge. Publish announcement (tweet/LinkedIn) with demo GIF + instructions.
