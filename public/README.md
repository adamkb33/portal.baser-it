# Static Files

React Router runs on Vite in this project. Files in `public/` are copied as-is and served from the site root.

Use this folder for assets that need stable public URLs, for example:

- `public/logos/company-logo.svg` -> `/logos/company-logo.svg`
- `public/brand/fredrikstad-barbershop/logo.png` -> `/brand/fredrikstad-barbershop/logo.png`
- `public/images/hero.jpg` -> `/images/hero.jpg`
- `public/documents/terms.pdf` -> `/documents/terms.pdf`
- `public/downloads/menu.pdf` -> `/downloads/menu.pdf`

Use imported assets inside `app/` only when the asset should be bundled, hashed, or transformed by Vite.

