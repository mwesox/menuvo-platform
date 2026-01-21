# Design Language

Design system rules for the console application. This document serves as a validation reference for code reviews and AI coding agents.

---

## Purpose

This document defines the visual and structural patterns for the Menuvo console application. Use it to:

1. Validate component usage in code reviews
2. Ensure consistency when adding new features
3. Reference authoritative patterns when multiple approaches exist

---

## Core Principles

| Principle | Description |
|-----------|-------------|
| Consistency over creativity | Follow established patterns rather than inventing new approaches |
| Component reuse | Use existing components before creating custom implementations |
| Semantic structure | Use components that provide correct HTML semantics (fieldset, legend, etc.) |
| Responsive by default | All layouts must work on mobile, tablet, and desktop |

---

## Page Types

The console has three page layout types. Each has specific width constraints and wrapper requirements.

### Full-Width Pages

Pages that use the entire available width. Examples: dashboard, kitchen display, order management.

- Container: No max-width constraint
- Wrapper: Direct children of route component
- Use case: Data tables, kanban boards, grid layouts

### Settings Pages

Form-heavy pages with limited content width for readability. Examples: store settings, merchant settings.

- Container: Apply layerStyle settingsContent (768px max-width)
- Wrapper: VStack with layerStyle settingsContent
- Use case: Configuration forms, toggle settings, detail editing

### Sidebar Layout Pages

Pages with a navigation sidebar and content area. Examples: store settings with tabs, menu management.

- Container: SidebarPageLayout component handles layout
- Wrapper: Content receives responsive padding automatically (base 4, sm 6, lg 8)
- Use case: Multi-section settings, tabbed interfaces

---

## Spacing System

Consistent spacing values ensure visual harmony across all pages.

### Section Spacing

Between major page sections (FormSection to FormSection, SettingsRowGroup to SettingsRowGroup):

- Standard gap: 6 (1.5rem / 24px)
- Applied via: VStack with gap 6, or layerStyle settingsContent

### Field Spacing

Between form fields within a single section:

- Standard gap: 4 (1rem / 16px)
- Applied via: Stack or VStack with gap 4 inside FormSection

### Padding

Content area padding varies by context:

| Context | Base | sm | lg |
|---------|------|----|----|
| SidebarPageLayout content | 4 | 6 | 8 |
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
| Settings page wrapper | VStack with layerStyle settingsContent |
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
- DO NOT use settingsContent inside SidebarPageLayout (padding is handled)
- DO NOT manually set maxWidth 768px when settingsContent applies

---

## Code Review Checklist

Use this checklist when reviewing console application code.

### Layout Structure

1. Settings pages use VStack with layerStyle settingsContent
2. Multi-section settings use SidebarPageLayout
3. No manual maxWidth when layer styles apply

### Spacing Consistency

4. Gap between FormSection components is 6
5. Gap between fields within FormSection is 4
6. No mixed gap values (4 vs 6) between similar sections

### Form Structure

7. Related form fields are wrapped in FormSection
8. FormSection variant matches content type (card for inputs, plain for toggles)
9. Toggle settings use SettingsRowGroup and SettingsRowItem

### Action Buttons

10. Form submit uses SettingsFormFooter component
11. No manual Separator plus HStack for form footers
12. Submit button is at form bottom, not inline or at top
13. Button order: Cancel left, Submit right

### Component Usage

14. No Card.Root where FormSection card variant applies
15. No manual padding where layer styles apply
16. No custom implementations of existing patterns

---

## Quick Reference

### Settings Form Template Structure

A standard settings form follows this structure (described in prose, not code):

1. Outer VStack with layerStyle settingsContent
2. One or more FormSection components with card variant for input groups
3. Optional SettingsRowGroup sections for toggle settings
4. SettingsFormFooter at the end with isSubmitting prop

### Component Import Locations

| Component | Import Path |
|-----------|-------------|
| FormSection | @/components/ui/form-section |
| SettingsFormFooter | @/components/layout/settings-form-footer |
| SettingsRowGroup | @/components/ui/settings-row |
| SettingsRowItem | @/components/ui/settings-row |
| SidebarPageLayout | @/components/layout/sidebar-page-layout |
