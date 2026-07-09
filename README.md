# Musliman Academy Landing Page — React + TypeScript

A production-ready React landing page based on Musliman Academy brand identity and the supplied section designs.

## Tech Stack

- React
- TypeScript
- Vite
- CSS only, no UI library

## Sections Included

1. Navbar
2. Hero Section
3. Free Trial Form
4. About Musliman Academy
5. Trust Bar
6. Programs
7. Who We Teach
8. Why Choose Musliman Academy
9. How It Works
10. Teacher Training
11. FAQ Accordion
12. Footer
13. Floating WhatsApp Button

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Files to Edit

- `src/data/siteData.ts`
  - All content, programs, FAQ, contact info, WhatsApp number, links.

- `src/styles.css`
  - Brand colors, typography, spacing, responsive styles.

- `src/App.tsx`
  - Component structure and section order.

## Brand Tokens

```css
--midnight: #0B1F3A;
--copper: #B87333;
--white: #FFFFFF;
--off-white: #F8F7F3;
--font-heading: 'Cinzel';
--font-body: 'Inter';
```

## Important Notes

- Replace the WhatsApp number in `src/data/siteData.ts`.
- Replace email and website in `src/data/siteData.ts`.
- The form currently shows a success message only. To connect it to Google Sheets / CRM, add the API endpoint inside `TrialForm` in `src/App.tsx`.
- The phrase used is “Teachers with Al-Azhar Educational Background” to avoid claiming official accreditation unless documented.
