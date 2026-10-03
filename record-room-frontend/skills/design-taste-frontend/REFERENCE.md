# Taste Skill reference

This project used the upstream Taste Skill guidance at implementation time.

Source: https://github.com/Leonxlnx/taste-skill

The execution environment could read the upstream skill through web access but could not download npm/GitHub assets into the container because external DNS/network access was unavailable. The implementation therefore records the relevant rules in `docs/TASTE-SKILL-REFERENCE.md` rather than pretending a local skill install happened.
