# overrides/

This folder holds logic that only this client needs — code that doesn't
belong in `packages/core` because it isn't generic, and doesn't belong in
`config.ts` because it's actual logic, not configuration.

**The test:** if this logic would break another client if it were moved
into `packages/core`, it goes here. If it's just not built yet in core, go
build it in core instead — don't reach for an override as a shortcut
around doing the general version.

Examples of things that legitimately belong here: a custom parser for a
CRM export format only this client uses, a workaround for a quirk in this
client's specific respond.io flow setup, a one-off scheduled job this
client asked for that no one else needs.
