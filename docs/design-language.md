# Design Language

Design system rules for the Menuvo Console (admin) and Shop (storefront). This document is the validation reference for code reviews and AI coding agents.

---

## Scope

- Console uses Chakra UI with theme tokens in apps/console/src/theme.ts.
- Shop is migrating to Chakra UI with its own theme file in apps/shop/src/theme.ts.
- Legacy shop styles live in apps/shop/src/index.css and apps/shop/src/features/shared/components/ui/index.tsx; use existing primitives but do not add new Tailwind-only patterns.
- Light mode only for both apps.

---

## Core Principles

| Principle | Description |
|-----------|-------------|
| Consistency over creativity | Follow established patterns rather than inventing new approaches |
| Component reuse | Use existing components before creating custom implementations |
| Semantic structure | Use components that provide correct HTML semantics (fieldset, legend, etc.) |
| Responsive by default | All layouts must work on mobile, tablet, and desktop |

### Surface Hierarchy

Visual hierarchy comes from typography and spacing, not background colors.

| Pattern | Approach |
|---------|----------|
| Two-panel layouts | Unified surface (same bg), border separation |
| Nested content groups | Cards with subtle borders, same bg as parent |
| Distinct functional areas | Background differentiation allowed (e.g., app sidebar vs main content) |

**Unified Surface Rule:** When two panels show related content (nav + detail, list + detail), they should share the same background. Use a 1px border for separation instead of color contrast.

**Border over Background:** Prefer 1px borders over background color changes for panel separation. This creates cleaner, more modern interfaces.

---

## Shared Foundations (All Apps)

### Tokens and Styling

- Use Chakra props and theme tokens for color, spacing, radii, and shadows.
- No raw hex values or arbitrary spacing in component code. Exceptions allowed only for third-party brand marks and must include a short inline comment.
- Prefer semantic color tokens (bg, fg, border, muted, primary, accent, success, warning, destructive) over palette tokens.
- Use textStyle for typography; do not set raw fontSize or lineHeight outside theme files.

### Typography

- Console uses Inter; shop uses Plus Jakarta Sans.
- Use the theme textStyle scale for headings and body copy.
- Use tabular numbers for prices and numeric comparisons.
- Use the single-character ellipsis (U+2026) in UI strings instead of three dots.

### Spacing and Layout

- Use Chakra spacing tokens only.
- Standard gaps: 4 for field groups, 6 for section groups.
- Use responsive props (Chakra responsive object syntax); avoid custom media queries.

### Interaction and Motion

- All interactive elements must show a visible focus state (focus-visible ring).
- Hover and active states are required for buttons and links.
- Animate opacity or transform only; honor prefers-reduced-motion.

### Accessibility and Semantics

- Use semantic HTML via Chakra components.
- Form controls require labels; icon-only buttons require accessible labels.

---

## Console (Admin App)

Console uses Chakra UI only. Do not use Tailwind utility classes in console code.

### Page Types

The console has three page layout types. Each has specific width constraints and wrapper requirements.

### Full-Width Pages

Pages that use the entire available width. Examples: dashboard, kitchen display, order management.

- Container: No max-width constraint
- Wrapper: Direct children of route component
- Use case: Data tables, kanban boards, grid layouts

### Settings Pages

Form-heavy pages with limited content width for readability. Examples: merchant settings, account settings.

- Container: Apply layerStyle settingsContent (768px max-width)
- Wrapper: VStack with layerStyle settingsContent
- Use case: Configuration forms, toggle settings, detail editing

### Two-Panel Layouts (Sidebar + Content)

Pages with a navigation or filter sidebar alongside a content area.

- **Component:** `SidebarPageLayout`
- **Surface:** Unified (sidebar and content share same background)
- **Separation:** 1px border between panels
- **Content width:** max 3xl (768px) for form-heavy content
- **Padding:** Responsive (base 4, sm 6, lg 6)

Examples: Store settings, menu management, account settings, any tabbed interface.

This pattern implements the **unified surface principle** — related panels share backgrounds.

---

## Spacing System

Consistent spacing values ensure visual harmony across all pages.

### Section Spacing

Between major content groups on any page:

- **Major sections:** gap 8 (2rem / 32px) — between distinct content blocks
- **Related items:** gap 4-6 — within a section
- **Form fields:** gap 4 (1rem / 16px) — between inputs in a form

Apply via `VStack gap="8"` for page-level sections.

### Field Spacing

Between form fields within a single section:

- Standard gap: 4 (1rem / 16px)
- Applied via: Stack or VStack with gap 4 inside FormSection

### Padding

Content area padding varies by context:

| Context | Base | sm | lg |
|---------|------|----|----|
| SidebarPageLayout content | 4 | 6 | 6 |
| Card.Body | 4 | 4 | 4 |
| Modal/Dialog body | 4 | 4 | 4 |

---

## Form Structure

### FormSection Component

Use FormSection to group related form fields. It provides semantic fieldset/legend HTML structure.

**Required props:**

- title: Section heading displayed as fieldset legend
- children: Form field content

**Optional props:**

- description: Helper text below the title
- variant: Either card or plain (default: card)

**Section header styling:**

Section headers use a quiet, typographic treatment that provides hierarchy without visual weight:

- Text size: sm
- Text transform: uppercase
- Letter spacing: wide
- Color: fg.muted
- Font weight: semibold

This style applies to any section header (FormSection, SettingsRowGroup titles, card headers).

**Variant selection:**

| Variant | Use when |
|---------|----------|
| card | Section contains input fields, selects, textareas |
| plain | Section contains toggle rows, action buttons, or non-input content |

**Validation checks:**

- DO use FormSection for every group of related form fields
- DO set variant to plain when content is SettingsRowGroup or standalone toggles
- DO NOT nest FormSection components
- DO NOT use Card.Root directly when FormSection card variant applies

### SettingsRowGroup and SettingsRowItem

Use for toggle settings, status displays, and action triggers that need label-action layout.

**SettingsRowGroup props:**

- title: Section heading
- children: One or more SettingsRowItem components

**SettingsRowItem props:**

- label: Primary text
- description: Optional secondary text
- action: Switch, Button, Badge, or other action element

**Validation checks:**

- DO wrap SettingsRowItem components in SettingsRowGroup
- DO use orientation horizontal (set by component)
- DO NOT mix SettingsRowItem with regular form fields in the same FormSection

---

## Action Buttons

### Placement Rule

All form submit buttons must appear at the bottom-right of the form content area.

### Required Component

Use SettingsFormFooter for all settings page forms. It provides:

- Consistent border separator above buttons
- Correct button alignment (flex-end)
- Standard button spacing (gap 3)
- Loading state handling

**SettingsFormFooter props:**

- isSubmitting: Boolean for loading state (required)
- onCancel: Optional handler - shows cancel button when provided
- submitText: Optional custom label (default: Save Changes)
- submittingText: Optional loading label (default: Saving...)

**Button order:**

When cancel button is shown: Cancel (outline variant) on left, Submit (solid variant) on right.

**Validation checks:**

- DO use SettingsFormFooter for all settings forms
- DO pass isSubmitting from form state
- DO NOT create manual Separator plus HStack for form footers
- DO NOT place action buttons inline within form sections
- DO NOT place submit buttons at the top of forms

### When to Show Cancel Button

| Scenario | Show cancel |
|----------|-------------|
| Edit form with navigation back | Yes, navigate to previous page |
| Create form in modal/drawer | Yes, close the modal/drawer |
| Inline settings with auto-save feel | No |
| Single toggle or immediate action | No |

---

## Component Requirements

### Required Components by Pattern

| Pattern | Required Component |
|---------|-------------------|
| Form field group | FormSection |
| Toggle settings list | SettingsRowGroup with SettingsRowItem |
| Form submit area | SettingsFormFooter |
| Settings page wrapper (non-sidebar) | VStack with layerStyle settingsContent |
| Multi-tab settings | SidebarPageLayout |

### Forbidden Patterns

- Manual Separator before form buttons (use SettingsFormFooter)
- Box with custom padding for settings content (use layerStyle settingsContent)
- Card.Root for form groups (use FormSection with card variant)
- Inline submit buttons within form sections
- Different gap values between similar sections on the same page

---

## Layer Styles

Use these predefined layer styles instead of manual style props.

| Layer Style | Max Width | Gap | Use Case |
|-------------|-----------|-----|----------|
| pageContent | none | 6 | Full-width page content |
| settingsContent | 768px | 6 | Settings forms and configuration |
| formSection | none | none | Card-style form group (use FormSection instead) |
| settingsRow | none | none | Toggle row layout (use SettingsRowItem instead) |

**Validation checks:**

- DO apply settingsContent to the outermost VStack on settings pages
- DO NOT use settingsContent inside SidebarPageLayout (padding + max width are handled)
- DO NOT manually set maxWidth 768px when settingsContent applies

---

### Component Import Locations

| Component | Import Path |
|-----------|-------------|
| FormSection | @/components/ui/form-section |
| SettingsFormFooter | @/components/layout/settings-form-footer |
| SettingsRowGroup | @/components/ui/settings-row |
| SettingsRowItem | @/components/ui/settings-row |
| SidebarPageLayout | @/components/layout/sidebar-page-layout |

---

## Shop (Storefront)

Shop is moving to Chakra UI. Use existing shop primitives where they exist and avoid adding new Tailwind-only patterns.

### Layout Types

- Wide browse pages (menu/discovery): centered container with max width 6xl and horizontal padding base 4, sm 6, lg 8.
- Narrow flow pages (ordering/checkout/confirmation): centered container with max width 2xl (or lg for single-state screens) and the same horizontal padding.
- Full-height screens use min height 100vh and keep main content scrollable.

### Spacing and Cards

- Use spacing tokens 3, 4, 5 for card padding (aligned with existing ShopCard sizes).
- Use radius tokens consistently for cards and buttons (rounded-lg equivalent).

### Component Usage

Use shop primitives for consistent typography and structure (apps/shop/src/features/shared/components/ui/index.tsx):

- ShopHeading, ShopText, ShopMutedText
- ShopPrice, ShopPriceRow
- ShopCard
- ShopButton, ShopPillButton
- ShopBadge, ShopDivider, ShopImage
- focusRing utility for keyboard focus

Use @menuvo/ui components for shared patterns (Button, Card, Drawer, etc.) and prefer existing variants.

### Branding (Shop Only)

- Light mode only.
- Customizable tokens are minimal: primary and accent (including their foregrounds).
- Neutral colors, typography, radius, and shadows are fixed.
- Derived tokens (ring, secondary, muted, success, warning) are computed from the base palette; do not override in component code.
- Ensure contrast between primary and primary-foreground meets WCAG AA for text.

---

## Review Checklist (Lean)

1. Uses Chakra components and theme tokens; no raw hex or arbitrary spacing (exceptions documented inline).
2. Uses semantic color tokens and textStyle scale.
3. Console settings pages use settingsContent for non-sidebar pages and SidebarPageLayout for tabbed pages (with built-in max width), plus FormSection and SettingsFormFooter rules.
4. Spacing consistency: section gap 8, field gap 4, unified surfaces for two-panel layouts.
5. Shop uses shop primitives for typography, cards, and prices.
6. Shop layout uses wide (6xl) or narrow (2xl/lg) containers with base 4, sm 6, lg 8 padding.
7. Shop branding only via primary/accent tokens; light mode only.
8. Visible focus states and hover/active states for all interactive elements.
9. Motion uses transform/opacity and honors prefers-reduced-motion.
10. Copy uses Title Case for headings/buttons, active voice, and ellipsis U+2026.
