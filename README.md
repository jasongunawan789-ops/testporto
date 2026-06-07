# Minimalist Editorial Portfolio — Jason Gunawan

A high-contrast, premium, responsive web portfolio built following the **Monograph Editorial** design specifications.

## 🎨 Design System
This portfolio utilizes a Minimalist-Editorial design language inspired by high-end art and architecture journals:
- **Palette**: Strict monochrome base (`#fbf9f9` canvas, `#000000` text) with accent colors supplied purely by the featured work's imagery.
- **Typography**: 
  - **Hanken Grotesk** for modern, aggressive typographic headlines.
  - **Source Serif 4** for italic accents and elegant metadata.
  - **Manrope** for highly readable body text.
- **Shapes**: Strictly sharp corners (`0px` border-radius) for architectural precision.
- **Layout & Framing**: Flat elevation, viewport corner brackets (viewfinder frames), table-style records, and hair-thin dividers.

## 📁 File Structure
```bash
├── index.html        # Semantic HTML Structure
├── index.css         # Modern CSS Design Tokens & Media Queries
├── index.js          # Intersection Observer Animations & Form Interaction
└── assets/
    └── images/
        ├── headshot.png         # Main headshot
        ├── project-1.png        # EksFlorasi mockup
        ├── project-2.png        # Sub-logo/Favicon
        └── project-3.png        # Travel Advisor mockup
```

## ⚡ Deployment to Vercel

### Option 1: Vercel Dashboard (Recommended)
1. Push this repository to your GitHub account.
2. Go to [vercel.com](https://vercel.com) and sign in.
3. Click **Add New** > **Project**.
4. Import this repository.
5. Keep default settings (Vercel automatically detects this as a Static Project) and click **Deploy**.

### Option 2: Vercel CLI
If you have Vercel CLI installed locally, run:
```bash
vercel
```
Follow the interactive prompts to link and deploy your project in seconds.

---
*Generated with care using Antigravity.*
