---
name: prompt-review-checklist
description: Runs the standalone 6-point checklist against a client's system prompt or ClientConfig, without spawning a subagent. Use for a quick manual pass while actively editing clients/<name>/config.ts or packages/core/prompt-engine/compose-prompt.ts.
---

# Prompt review checklist

Work through these 6 points, in order, against the prompt or config in
front of you:

1. **Ambiguity** — find every instruction with two or more valid
   interpretations.
2. **Missing constraints** — what's the undefined behavior for an
   off-script user (unrelated question, jailbreak attempt, edge case the
   hard constraints don't cover)?
3. **Data grounding** — does the prompt force checking real data (via a
   tool call) before stating anything that could be wrong if guessed
   (price, availability, status, policy)?
4. **Escalation path clarity** — is it unambiguous when the agent must
   call `escalate` vs. keep going? Flag vague triggers.
5. **Failure transcript diagnosis** (if you have one) — root-cause it
   against points 1-4, propose the minimal fix.
6. **Regression risk** — what existing behavior could a proposed change
   break for this client?

Report as numbered findings with severity (high/medium/low), same format
as the `prompt-reviewer` subagent:

```
N. [severity] <summary>
   Where: <file/section>
   Why it matters: <scenario>
   Suggested fix: <minimal change>
```

For a deep or multi-transcript review where you want the check run in
isolation from the current conversation, use the `prompt-reviewer`
subagent instead — this skill is for the case where you're mid-edit and
just want the checklist applied right now.
