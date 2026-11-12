# AGENTS.md

> **Single Source of Truth for all AI Coding Agents (Antigravity, Claude Code, Cursor, Codex, Copilot, Windsurf, etc.)**

Panduan instruksi lengkap proyek GameYard tersedia di [`docs/agent.md`](./docs/agent.md). Seluruh agent wajib membaca dan mematuhi dokumen tersebut.

---

## 1. Project Reference Documents
* **PRD (What & Why):** [`docs/prd.md`](./docs/prd.md)
* **Technical Spec & Architecture (How):** [`docs/tech-spec.md`](./docs/tech-spec.md)
* **Design System (Candy-on-Black UI):** [`docs/design.md`](./docs/design.md)
* **Agent Guidelines & Guardrails:** [`docs/agent.md`](./docs/agent.md)

---

## 2. Core Mandatory Guardrails
1. **No Em-Dashes (`R-02`):** Never use `—` or `–`. Use regular hyphens (`-`), colons (`:`), or pipes (`|`).
2. **Candy-on-Black Color System (`R-01`, `R-29`):** Canvas `#000000`, Surface `#0D0D0D`, Elevated `#141414`, Border `#262626`, Ink `#FFFFFF`, Muted `#A3A3A3`, Warning `#F59E0B`. Single accent `#93F1F7` (Cyan) only for primary CTA, rotor Y, and active sync status. No gradients or glassmorphism.
3. **Preserve 3-Zone Architecture (`R-14`):** Header (64px) + Left Launch Stage (440px) + Right Workspace (Pinned Shelf + Index Table).
4. **Offline-First & Memory Efficiency:** Tauri v2 + Rust (<100 MB idle RAM), SQLite WAL (`gameyard.db`), folder-path process watching with 5s grace period before auto-killing client launchers.

---

## 3. Project Skills Directory (`.agents/skills/`)
Proyek ini dilengkapi dengan modul keahlian agen (*Agent Skills Standard*) di dalam folder [`.agents/skills/`](./.agents/skills/). Ketika menangani tugas tertentu, baca file `SKILL.md` pada folder skill terkait:

* **UI/UX & Desain:**
  * `.agents/skills/antislop/SKILL.md`: Core anti-slop rules for coding agents.
  * `.agents/skills/antislop-ui/SKILL.md`: Color, layout, motion, and contrast standards.
  * `.agents/skills/ui-ux-pro-max/SKILL.md`: Comprehensive UI/UX design intelligence.
  * `.agents/skills/design-system/SKILL.md`: Design token architecture and component specifications.
  * `.agents/skills/taste-skill/SKILL.md`: Professional anti-slop frontend styling.
* **Architecture & Code Quality:**
  * `.agents/skills/codebase-design/SKILL.md`: Deep module boundaries and interface design.
  * `.agents/skills/karpathy-guidelines/SKILL.md`: Surgical changes and avoiding LLM code bloat.
  * `.agents/skills/systematic-debugging/SKILL.md`: Systematic root-cause bug diagnosis.
  * `.agents/skills/code-review/SKILL.md`: Dual-axis standards and spec review.
  * `.agents/skills/test-driven-development/SKILL.md`: TDD red-green-refactor loop.
  * `.agents/skills/verification-before-completion/SKILL.md`: Evidence-based verification before claiming tasks complete.
* **Planning & Execution:**
  * `.agents/skills/writing-plans/SKILL.md`: Step-by-step implementation planning.
  * `.agents/skills/executing-plans/SKILL.md`: Inline plan execution loop.
  * `.agents/skills/grilling/SKILL.md`: Stress-testing plans and architectural decisions.
  * `.agents/skills/brainstorming/SKILL.md`: Creative divergence before feature building.
