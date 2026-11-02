# Agri View Rwanda

Agri View Rwanda presents agricultural statistics, crop profiles, practical field notes and sector updates for people working in and with Rwanda's agriculture sector( atakeholders).

## Run locally
Requirements: Node.js 20.19 or later.
```bash
npm install
npm run dev
```

Build and preview the production site with:
```bash
npm run build
npm run preview
```

## Site content

- Responsive react home, data explorer, insights, crop directory, crop profiles, guides, news and sources pages.
- National farmer-practice indicators from NISR Season A and Season B 2026.
- Crop production and yield from NISR Season B 2025.
- Crop search, data filters, accessible tables, CSV downloads, dark mode and accordion photo galleries.

Statistics retain their source, unit and reference period. Farm output, farmer practices and exports describe different measures and are presented separately. The source register is maintained in `src/data.js` and on the Sources page.


## Design and accessibility

Light mode is the default. Visitors can switch to dark mode, which is saved locally. Navigation, crop search, filters, galleries and data tables support keyboard use. Reduced-motion preferences are respected.
