This is an example of packaging an org skill (`ticket-ready-check`) as a Claude Code plugin.

## Layout

```
crumb-dev/
  .claude-plugin/plugin.json
  skills/ticket-ready-check/SKILL.md
```

The skill is a copy of `.claude/skills/ticket-ready-check/SKILL.md` in the workspace. Keep them in step, or make the plugin the only copy.

## Install

```
/plugin marketplace add <path or git URL of this workspace repo>
/plugin install crumb-dev@crumb-co-workspace
```

Plugins from other people go through `docs/skill-vetting.md` first.
