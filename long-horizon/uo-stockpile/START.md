# Long-Running Task Start Prompt

Use this prompt to start the long-running Codex task from `/root/ScreepJandi`:

```text
Read these files first and treat them as the durable project memory for this run:

- long-horizon/uo-stockpile/Prompt.md
- long-horizon/uo-stockpile/Plan.md
- long-horizon/uo-stockpile/Implement.md
- long-horizon/uo-stockpile/Documentation.md

Execute the task milestone by milestone. Keep diffs narrow, run the listed validation after each milestone, update Documentation.md continuously, and use only short nonce-tagged Screeps console expressions.

Goal: create and verify automation that stockpiles RESOURCE_UTRIUM_OXIDE (UO) in the main room for three real days worth of extractor mining.
```

