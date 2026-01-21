# Chakra UI Responsive Best Practices

## Overview

Chakra UI provides built-in responsive design capabilities that eliminate the need for custom media queries. Use Chakra's responsive object syntax for all responsive styling.

## Breakpoints

Chakra UI uses these breakpoints by default:
- `sm`: 640px
- `md`: 768px  
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## Responsive Object Syntax

Instead of Tailwind classes like `sm:p-6 md:p-8`, use Chakra's responsive object syntax:

```tsx
// ✅ Correct - Chakra responsive object
<Box p={{ base: "4", sm: "6", md: "8" }} />

// ❌ Wrong - Tailwind responsive classes
<Box className="p-4 sm:p-6 md:p-8" />
```

## Common Patterns

### 1. Spacing (padding, margin, gap)

```tsx
// Padding
<Box p={{ base: "4", md: "6" }} />

// Margin
<Box mt={{ base: "2", md: "4" }} />

// Gap
<VStack gap={{ base: "4", md: "6" }} />
```

### 2. Grid Layouts

```tsx
// SimpleGrid with responsive columns
<SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="4" />

// Grid with responsive gap
<SimpleGrid columns={2} gap={{ base: "2", md: "4" }} />
```

### 3. Display (show/hide)

```tsx
// Show on mobile, hide on desktop
<Box display={{ base: "block", lg: "none" }} />

// Hide on mobile, show on desktop  
<Box display={{ base: "none", lg: "block" }} />

// Or use hideBelow/hideFrom props
<Box hideBelow="lg" />  // Hide below lg breakpoint
<Box hideFrom="lg" />   // Hide from lg breakpoint and up
```

### 4. Flex Direction

```tsx
<Flex direction={{ base: "column", lg: "row" }} />
```

### 5. Width/Height

```tsx
<Box w={{ base: "full", md: "1/2", lg: "1/3" }} />
<Box maxW={{ base: "full", md: "2xl" }} />
```

### 6. Typography

```tsx
<Heading textStyle={{ base: "xl", md: "2xl", lg: "3xl" }} />
<Text fontSize={{ base: "sm", md: "md" }} />
```

## Migration Checklist

When converting from Tailwind responsive classes:

1. ✅ Replace `className="p-4 sm:p-6"` → `p={{ base: "4", sm: "6" }}`
2. ✅ Replace `className="grid sm:grid-cols-2"` → `<SimpleGrid columns={{ base: 1, sm: 2 }} />`
3. ✅ Replace `className="hidden sm:block"` → `display={{ base: "none", sm: "block" }}` or `hideBelow="sm"`
4. ✅ Replace `className="flex-col sm:flex-row"` → `direction={{ base: "column", sm: "row" }}`
5. ✅ Remove all `@media` queries from CSS - use Chakra props instead

## Benefits

- **No custom CSS needed** - All responsive logic in component props
- **Type-safe** - TypeScript knows about breakpoints
- **Consistent** - Uses theme breakpoints everywhere
- **Performant** - Chakra optimizes responsive rendering
- **Maintainable** - Single source of truth for breakpoints
