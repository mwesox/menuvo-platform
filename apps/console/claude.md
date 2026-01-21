# Console App Guidelines

## Typography

```tsx
import { PageTitle, SectionTitle, Label, Caption, Muted } from "@/components/ui/typography";
```

| Component | Use Case |
|-----------|----------|
| `<PageTitle>` | Page H1 headings |
| `<SectionTitle>` | Section H2 headings |
| `<Label>` / `<Label muted>` | Form labels, row labels |
| `<Caption>` | Helper text, descriptions |
| `<Muted>` | Inline muted text |

When extra props needed, use `textStyle="label"`, `textStyle="caption"`, etc.

## UI Components

```tsx
import { FormSection } from "@/components/ui/form-section";
import { SettingsRowGroup, SettingsRowItem } from "@/components/ui/settings-row";
```

- `<FormSection title="..." description="...">` - Form groups
- `<SettingsRowGroup>` + `<SettingsRowItem label="..." description="..." action={...} />` - Settings toggles

## Semantic Colors

| Token | Use Case |
|-------|----------|
| `fg` / `fg.muted` / `fg.subtle` | Primary / secondary / tertiary text |
| `fg.error` / `fg.warning` / `fg.success` | Status text |
| `bg.panel` / `bg.muted` | Backgrounds |
| `border` / `border.muted` | Borders |
