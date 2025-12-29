# WODsApp Style Guide
## Inspired by CrossFit.com Design Language

This style guide defines the visual design system for WODsApp, inspired by CrossFit's clean, bold, and athletic aesthetic.

## Color Palette

### Primary Colors
- **Black**: `#000000` - Primary text, headers, navigation
- **White**: `#FFFFFF` - Background, text on dark backgrounds
- **Dark Gray**: `#1A1A1A` - Secondary backgrounds, cards
- **Light Gray**: `#F5F5F5` - Section backgrounds, subtle dividers
- **Medium Gray**: `#666666` - Secondary text, muted elements

### Accent Colors
- **CrossFit Red**: `#D21034` - Primary CTA buttons, highlights, active states
- **Red Hover**: `#B00E2A` - Hover state for red buttons
- **Success Green**: `#28A745` - Success messages, positive indicators
- **Warning Orange**: `#FFC107` - Warnings, attention-grabbing elements

### Usage Guidelines
```css
/* Primary Background */
background-color: #FFFFFF;

/* Dark Sections */
background-color: #1A1A1A;
color: #FFFFFF;

/* Primary Text */
color: #000000;

/* Secondary Text */
color: #666666;

/* CTA Buttons */
background-color: #D21034;
color: #FFFFFF;
```

## Typography

### Font Families

**Headings & Display Text:**
- **Primary**: `'Oswald', sans-serif` - Bold, impactful, athletic
- **Fallback**: `'Arial Black', 'Arial', sans-serif`

**Body Text:**
- **Primary**: `'Open Sans', sans-serif` - Clean, readable, modern
- **Fallback**: `'Helvetica Neue', 'Helvetica', 'Arial', sans-serif`

### Font Sizes & Weights

```css
/* Display/Hero Text */
font-size: 3.5rem; /* 56px */
font-weight: 700;
line-height: 1.2;
letter-spacing: -0.02em;

/* H1 - Main Headings */
font-size: 2.5rem; /* 40px */
font-weight: 700;
line-height: 1.3;

/* H2 - Section Headings */
font-size: 2rem; /* 32px */
font-weight: 700;
line-height: 1.4;

/* H3 - Subsection Headings */
font-size: 1.5rem; /* 24px */
font-weight: 600;
line-height: 1.5;

/* H4 - Card Titles */
font-size: 1.25rem; /* 20px */
font-weight: 600;
line-height: 1.5;

/* Body Large */
font-size: 1.125rem; /* 18px */
font-weight: 400;
line-height: 1.6;

/* Body Regular */
font-size: 1rem; /* 16px */
font-weight: 400;
line-height: 1.6;

/* Body Small */
font-size: 0.875rem; /* 14px */
font-weight: 400;
line-height: 1.5;

/* Caption */
font-size: 0.75rem; /* 12px */
font-weight: 400;
line-height: 1.4;
```

### Typography Examples

```html
<!-- Hero/Display Text -->
<h1 class="display-text">Track Your Workouts</h1>

<!-- Section Heading -->
<h2 class="section-heading">Your Workout History</h2>

<!-- Body Text -->
<p class="body-text">Upload a photo of your whiteboard and let AI extract your workout data.</p>
```

## Layout & Spacing

### Grid System
- **Container Max Width**: `1200px`
- **Gutter**: `24px` (1.5rem)
- **Grid Columns**: 12-column responsive grid
- **Breakpoints**:
  - Mobile: `< 768px`
  - Tablet: `768px - 1024px`
  - Desktop: `> 1024px`

### Spacing Scale
```css
/* Spacing Units (based on 8px grid) */
--spacing-xs: 0.5rem;   /* 8px */
--spacing-sm: 1rem;     /* 16px */
--spacing-md: 1.5rem;   /* 24px */
--spacing-lg: 2rem;     /* 32px */
--spacing-xl: 3rem;     /* 48px */
--spacing-2xl: 4rem;    /* 64px */
--spacing-3xl: 6rem;    /* 96px */
```

### Section Padding
- **Section Padding (Mobile)**: `3rem 1.5rem` (48px vertical, 24px horizontal)
- **Section Padding (Desktop)**: `6rem 2rem` (96px vertical, 32px horizontal)

## Components

### Navigation Bar

**Style:**
- Fixed position at top
- Transparent background that becomes solid white on scroll
- Height: `80px` (desktop), `64px` (mobile)
- Black text, white background when solid
- Red accent for active/current page

```css
.navbar {
  position: fixed;
  top: 0;
  width: 100%;
  height: 80px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #E5E5E5;
  z-index: 1000;
}

.navbar.scrolled {
  background: #FFFFFF;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.nav-link {
  color: #000000;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.875rem;
}

.nav-link.active {
  color: #D21034;
}
```

### Buttons

**Primary Button (Red CTA):**
```css
.btn-primary {
  background-color: #D21034;
  color: #FFFFFF;
  padding: 1rem 2rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background-color: #B00E2A;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(210, 16, 52, 0.3);
}
```

**Secondary Button (Outline):**
```css
.btn-secondary {
  background-color: transparent;
  color: #000000;
  padding: 1rem 2rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 2px solid #000000;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background-color: #000000;
  color: #FFFFFF;
}
```

**Button Sizes:**
- **Large**: `padding: 1.25rem 2.5rem; font-size: 1.125rem;`
- **Medium**: `padding: 1rem 2rem; font-size: 1rem;` (default)
- **Small**: `padding: 0.75rem 1.5rem; font-size: 0.875rem;`

### Cards

**Workout Card:**
```css
.workout-card {
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.workout-card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
}

.workout-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #E5E5E5;
}

.workout-card-title {
  font-family: 'Oswald', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #000000;
  margin: 0;
}

.workout-card-date {
  font-size: 0.875rem;
  color: #666666;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

### Input Fields

```css
.input-field {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #E5E5E5;
  border-radius: 4px;
  font-size: 1rem;
  font-family: 'Open Sans', sans-serif;
  transition: border-color 0.2s ease;
}

.input-field:focus {
  outline: none;
  border-color: #D21034;
}

.input-label {
  display: block;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
  color: #000000;
}
```

### Search Bar

```css
.search-bar {
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border: 2px solid #E5E5E5;
  border-radius: 4px;
  padding: 0.75rem 1rem;
  transition: border-color 0.2s ease;
}

.search-bar:focus-within {
  border-color: #D21034;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 1rem;
  font-family: 'Open Sans', sans-serif;
}

.search-icon {
  color: #666666;
  margin-right: 0.75rem;
}
```

### Modal/Dialog

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: #FFFFFF;
  border-radius: 8px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #E5E5E5;
}

.modal-title {
  font-family: 'Oswald', sans-serif;
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
}
```

## Hero Section

```css
.hero-section {
  min-height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1A1A1A 0%, #000000 100%);
  color: #FFFFFF;
  text-align: center;
  padding: 8rem 2rem 6rem;
  position: relative;
  overflow: hidden;
}

.hero-title {
  font-family: 'Oswald', sans-serif;
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 1.5rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.hero-subtitle {
  font-size: 1.25rem;
  font-weight: 400;
  line-height: 1.6;
  margin-bottom: 2rem;
  color: rgba(255, 255, 255, 0.9);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}
```

## Image Upload Area

```css
.upload-area {
  border: 3px dashed #E5E5E5;
  border-radius: 8px;
  padding: 3rem 2rem;
  text-align: center;
  background: #F5F5F5;
  transition: all 0.3s ease;
  cursor: pointer;
}

.upload-area:hover {
  border-color: #D21034;
  background: #FFFFFF;
}

.upload-area.dragover {
  border-color: #D21034;
  background: rgba(210, 16, 52, 0.05);
}

.upload-icon {
  font-size: 3rem;
  color: #666666;
  margin-bottom: 1rem;
}

.upload-text {
  font-size: 1.125rem;
  font-weight: 600;
  color: #000000;
  margin-bottom: 0.5rem;
}

.upload-hint {
  font-size: 0.875rem;
  color: #666666;
}
```

## Footer

```css
.footer {
  background: #1A1A1A;
  color: #FFFFFF;
  padding: 4rem 2rem 2rem;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.footer-section-title {
  font-family: 'Oswald', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
  color: #FFFFFF;
}

.footer-link {
  display: block;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  margin-bottom: 0.75rem;
  transition: color 0.2s ease;
}

.footer-link:hover {
  color: #D21034;
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 2rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
}
```

## Icons & Graphics

- **Style**: Simple, line-based icons
- **Weight**: 2px stroke weight
- **Color**: Inherit from parent or use `#666666` for neutral icons
- **Size**: Match text size or use standard sizes (16px, 24px, 32px)

**Icon Libraries:**
- React Icons (Heroicons, Feather Icons)
- Font Awesome (minimal use, prefer line icons)

## Animations & Transitions

### Standard Transitions
```css
/* Button Hover */
transition: all 0.2s ease;

/* Card Hover */
transition: all 0.3s ease;

/* Modal Open/Close */
transition: opacity 0.3s ease, transform 0.3s ease;
```

### Hover Effects
- **Buttons**: Slight lift (`translateY(-2px)`) with shadow
- **Cards**: Lift (`translateY(-4px)`) with increased shadow
- **Links**: Color change to red (`#D21034`)

## Responsive Design

### Mobile First Approach
- Design for mobile first, then enhance for larger screens
- Touch targets minimum: `44px × 44px`
- Reduce font sizes by ~20% on mobile
- Stack elements vertically on mobile
- Hide less critical content on mobile

### Breakpoint Usage
```css
/* Mobile */
@media (max-width: 767px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .section-padding {
    padding: 3rem 1.5rem;
  }
}

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) {
  .hero-title {
    font-size: 2.5rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .hero-title {
    font-size: 3.5rem;
  }
}
```

## Accessibility

- **Color Contrast**: Minimum 4.5:1 for body text, 3:1 for large text
- **Focus States**: Visible focus indicators (red outline: `#D21034`)
- **Alt Text**: All images must have descriptive alt text
- **Keyboard Navigation**: All interactive elements must be keyboard accessible
- **ARIA Labels**: Use appropriate ARIA labels for screen readers

## Implementation Notes

### CSS Framework
- Use **Tailwind CSS** with custom configuration matching this guide
- Or use **CSS Modules** with these values as CSS variables

### Font Loading
```html
<!-- Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet">
```

### CSS Variables Setup
```css
:root {
  /* Colors */
  --color-black: #000000;
  --color-white: #FFFFFF;
  --color-dark-gray: #1A1A1A;
  --color-light-gray: #F5F5F5;
  --color-medium-gray: #666666;
  --color-red: #D21034;
  --color-red-hover: #B00E2A;
  
  /* Typography */
  --font-heading: 'Oswald', sans-serif;
  --font-body: 'Open Sans', sans-serif;
  
  /* Spacing */
  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  --spacing-md: 1.5rem;
  --spacing-lg: 2rem;
  --spacing-xl: 3rem;
  --spacing-2xl: 4rem;
  --spacing-3xl: 6rem;
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  
  /* Shadows */
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.1);
}
```

## Design Principles

1. **Bold & Athletic**: Strong typography, confident use of space
2. **Clean & Minimal**: Avoid clutter, focus on content
3. **High Contrast**: Clear visual hierarchy
4. **Action-Oriented**: Red CTAs draw attention to key actions
5. **Professional**: Polished, modern aesthetic
6. **Accessible**: Usable by everyone, regardless of ability

## References

- [CrossFit.com](https://www.crossfit.com/) - Primary design inspiration
- Google Fonts: [Oswald](https://fonts.google.com/specimen/Oswald), [Open Sans](https://fonts.google.com/specimen/Open+Sans)

