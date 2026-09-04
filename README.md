# claude-reusable-internal-fw

Reusable internal framework for building AI agent/automation systems
(Next.js + Supabase + Vercel + respond.io) across multiple client
businesses. Generic, reusable logic lives in `packages/core`; everything
specific to one business lives in an isolated `clients/<name>` folder that
never leaks into core. See `CLAUDE.md` for the full split rules and
`docs/architecture.md` for the reasoning and a worked example.

## Clone it

```bash
git clone <this-repo-url>
cd claude-reusable-internal-fw
pnpm install
```

Cloning this repo brings the full `.claude/` setup (agents, skills,
commands, rules) — no additional install step needed for Claude Code to
use them. This also holds if you use this repo as a GitHub template for a
brand-new project: dotfiles are included by default in both `git clone`
and "use this template," and nothing in this repo's `.gitignore` excludes
`.claude/`.

## Onboard a new client

In a Claude Code session in this repo, run:

```
/new-client
```

It will ask for the client's name, business domain, and respond.io
details, then scaffold `clients/<name>/` from `packages/templates` and
`clients/_example`. See `.claude/skills/client-onboarding/SKILL.md` for
the manual step-by-step if you're not doing it interactively.

## Run a client locally

```bash
pnpm --filter <name>-app dev
```

## Learn more

- `CLAUDE.md` — golden rule, folder structure, common commands
- `docs/architecture.md` — why the split exists, worked example, core/overrides decision test
