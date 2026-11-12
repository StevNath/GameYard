# CLAUDE.md

> **GameYard Project Instructions for Claude Code**

Panduan instruksi lengkap proyek GameYard tersedia di [`docs/agent.md`](./docs/agent.md) dan [`AGENTS.md`](./AGENTS.md).

---

## 1. Project Reference Documents
* **PRD (What & Why):** [`docs/prd.md`](./docs/prd.md)
* **Technical Spec & Architecture (How):** [`docs/tech-spec.md`](./docs/tech-spec.md)
* **Design System (Candy-on-Black UI):** [`docs/design.md`](./docs/design.md)
* **Agent Guidelines & Guardrails:** [`docs/agent.md`](./docs/agent.md)

---

## 2. Core Guardrails (Mandatory)
1. **No Em-Dashes (`R-02`):** Never use `—` or `–`. Use regular hyphens (`-`), colons (`:`), or pipes (`|`).
2. **Candy-on-Black UI System (`R-01`, `R-29`):** Canvas `#000000`, Surface `#0D0D0D`, Elevated `#141414`, Border `#262626`, Ink `#FFFFFF`, Muted `#A3A3A3`, Warning `#F59E0B`. Single accent `#93F1F7` (Cyan) for primary CTA, rotor Y, and active sync status. No gradients or glassmorphism.
3. **Preserve 3-Zone Architecture (`R-14`):** Header (64px) + Left Launch Stage (440px) + Right Workspace (Pinned Shelf + Index Table).
4. **Memory Efficiency:** Tauri v2 + Rust (<100 MB idle RAM), SQLite WAL (`gameyard.db`), folder-path process watching with 5s grace period before auto-killing client launchers.

---

## 3. Skills Access
Skills project tersedia di `.agents/skills/` dan `.claude/skills/`. Gunakan skill yang relevan sesuai tugas:
* **UI/UX & Desain:** `antislop`, `antislop-ui`, `ui-ux-pro-max`, `design-system`, `taste-skill`
* **Arsitektur & Kode:** `codebase-design`, `karpathy-guidelines`, `systematic-debugging`, `code-review`, `tdd`, `test-driven-development`, `verification-before-completion`
* **Planning:** `writing-plans`, `executing-plans`, `grilling`, `brainstorming`
