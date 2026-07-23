---
description: Customize application theme using shadcn/ui
argument-hint: None required
---

# Customize Theme

Help the user customize their application's theme (shadcn/ui + Tailwind v4).

## Process

1. Guide them to the theme generator at https://ui.shadcn.com/themes — they pick a base color / preset and copy the generated CSS variables.
2. Integrate the variables into `src/index.css`: light values in the `:root` block, dark values in the `.dark` block.

## Notes

- The theme is driven by CSS variables (`--background`, `--primary`, `--muted`, …), not a config file.
- Keep `:root` and `.dark` in sync (same variable names).
- Components use semantic tokens (`bg-primary`, `text-muted-foreground`), so updating the variables restyles everything.
- Reference: https://ui.shadcn.com/docs/theming
