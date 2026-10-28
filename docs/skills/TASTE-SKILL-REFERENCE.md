# Taste Skill reference used for the frontend

Source: https://github.com/Leonxlnx/taste-skill

The current Taste Skill guidance was reviewed for this implementation. The project is a public-sector/trust-first application, so the relevant design constraints were:

- Use a trust-first, accessibility-conscious visual language.
- Keep design variance low and information density practical.
- Prefer a real design system or well-defined owned component system over generic AI defaults.
- Avoid generic purple AI gradients and black-glass dashboards.
- Use one coherent accent color.
- Use cards only when hierarchy requires them.
- Implement complete UI states rather than static happy paths.
- Keep buttons and focus states accessible.
- Prefer isolated animation components so continuous motion does not re-render the whole application.
- Respect reduced-motion preferences.
- Use Tailwind v4 for the modern utility layer.
- Use a single icon family rather than mixing arbitrary icon styles.

For this project the chosen settings are effectively:

`DESIGN_VARIANCE: 3`

`MOTION_INTENSITY: 2`

`VISUAL_DENSITY: 5`

The full upstream skill should be treated as an external reference rather than a source of application runtime code.
