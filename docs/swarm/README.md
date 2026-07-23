# Controlled Agent Swarm Workspace

This folder holds the durable coordination record for multi-agent work on DevinimJS, following the
[KayaEOS Engineering Constitution](https://github.com/kayacuneyd/kayaengineeringos) and its
[Controlled Agent Swarm playbook](https://github.com/kayacuneyd/kayaengineeringos/blob/main/playbooks/agent-swarm.md).
It is not a chat transcript: each task has explicit ownership, handoffs, evidence, and a final
human-reviewed merge decision.

- `active-work.md` — current task status and owner.
- `tasks/` — task contracts and exclusive file ownership maps.
- `handoffs/` — role outputs and evidence.
- `reviews/` — final review and merge recommendations.

## Non-negotiable rules (from the playbook)

1. The orchestrator creates one task file before any agent starts work.
2. Every task has a bounded goal, acceptance criteria, owner, file ownership map, and exit gate.
3. Research, QA, accessibility, documentation, and review agents do not edit implementation files.
4. An implementer works in one task branch/worktree; no two code-writing agents edit the same path.
5. Every agent writes its result to its assigned handoff file with evidence and open questions.
6. Only the orchestrator may request merge; only a human maintainer approves a merge to `main`.
7. The swarm is a workflow, not permission escalation — repository/tool permissions stay in force.

## Source of gaps

Task candidates are drawn from the prioritized gap list in [`../roadmap.md`](../roadmap.md).
