---
name: Monograph Editorial
colors:
  surface: '#fbf9f9'
  surface-dim: '#dbdad9'
  surface-bright: '#fbf9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#efeded'
  surface-container-high: '#e9e8e7'
  surface-container-highest: '#e3e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#4c4546'
  inverse-surface: '#303031'
  inverse-on-surface: '#f2f0f0'
  outline: '#7e7576'
  outline-variant: '#cfc4c5'
  surface-tint: '#5e5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1b1b1b'
  on-primary-container: '#848484'
  inverse-primary: '#c6c6c6'
  secondary: '#5d5f5f'
  on-secondary: '#ffffff'
  secondary-container: '#dcdddd'
  on-secondary-container: '#5f6161'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1a1c1c'
  on-tertiary-container: '#838484'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c6'
  on-primary-fixed: '#1b1b1b'
  on-primary-fixed-variant: '#474747'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c6'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#fbf9f9'
  on-background: '#1b1c1c'
  surface-variant: '#e3e2e2'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 84px
    fontWeight: '800'
    lineHeight: 90%
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 110%
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 115%
  editorial-italic:
    fontFamily: Source Serif 4
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 110%
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 160%
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 100%
    letterSpacing: 0.05em
  metadata:
    fontFamily: Source Serif 4
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 140%
spacing:
  container-max: 1440px
  gutter: 32px
  margin-desktop: 64px
  margin-mobile: 24px
  section-gap: 160px
---

## Brand & Style

This design system is built for elite creative professionals where the work must speak louder than the interface. It utilizes a **Minimalist-Editorial** style, characterized by aggressive typographic hierarchies, an expansive use of whitespace (negative space as a structural element), and a sophisticated monochromatic foundation.

The aesthetic draws inspiration from high-end fashion magazines and architectural journals. It prioritizes clarity and intentionality, using hairline dividers and strict grid alignment to create a sense of permanent authority. The emotional response is one of "curated excellence"—it feels expensive, precise, and timeless.

## Colors

The palette is strictly functional and high-contrast. 
- **Primary Black (#000000):** Used for all primary text, heavy headlines, and structural borders to anchor the layout.
- **Pure White (#FFFFFF):** The canvas. Used to create the "editorial" feel through generous margins.
- **Secondary Grey (#F5F5F5):** Used for subtle section backgrounds and large container fills to provide soft separation without breaking the minimalist flow.
- **Muted Neutral (#737373):** Reserved for secondary metadata, labels, and "hint" text that should not compete with the work.

Accent colors are not defined globally; instead, the "accent" is intended to be the vibrant imagery of the portfolio itself, ensuring the UI remains a neutral frame.

## Typography

Typography is the primary visual driver. We use **Hanken Grotesk** for high-impact headlines to provide a sharp, contemporary "Swiss" look. To contrast this, **Source Serif 4** is introduced in an italicized or metadata capacity to add warmth and a literary, editorial touch.

- **Scale:** Use dramatic size differences between headlines and body text to create an immediate hierarchy.
- **Italic Accents:** Use the serif italic sparingly within headlines to emphasize specific "soulful" words (e.g., "Capturing *Moments*").
- **Tight Leading:** Headlines should have tight line-height (90-110%) to feel like cohesive blocks of black ink.

## Elevation & Depth

This system avoids shadows and traditional depth metaphors in favor of **Tonal Layering** and **Structural Outlines**.

- **Flat Depth:** Hierarchy is established through size and color contrast rather than Z-axis elevation. 
- **Framing:** Use "Corner Brackets" (L-shaped hairlines) to frame testimonials or featured imagery. This mimics the look of a viewfinder or a gallery mounting.
- **Inversion:** Depth is signaled by switching from a white background to a solid black background for footers or high-impact "Call to Action" sections.

## Shapes

The shape language is strictly **Sharp (0px)**. 

Every element—from buttons to image containers to input fields—must have 90-degree corners. This reinforces the architectural and grid-based nature of the design. Rounded corners are seen as too "friendly" for this specific professional editorial aesthetic; sharp corners convey precision and "cut" through the whitespace.

## Components

### Buttons
Primary buttons are solid black blocks with white `label-caps` text. There is no rounding. Hover states should involve a simple color inversion (white background with black border and text) or a slight opacity shift.

### Input Fields
Inputs are minimalist: a single 1px bottom border with no background fill. Labels use the `label-caps` style positioned above the line.

### Cards & Project Previews
Project cards do not use borders or shadows. They consist of a full-width image followed by a `headline-lg` title and `metadata` descriptions. The image should have a slight "zoom" effect on hover, but the container remains fixed.

### Chips / Tags
Tags are small, rectangular boxes with 1px borders and `label-caps` typography. They should look like physical labels found in an archive.

### Testimonials
Presented in a "Viewfinder" style: centered text within four corner brackets. This isolates the quote as a piece of art in itself.

### Lists
Use "Table-style" lists for experience or services. 1px horizontal dividers between rows, with the role on the left and the date/year on the far right, utilizing the full width of the grid.