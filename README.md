# CSV Validator

Free online CSV validator with formatting rules for company names, executive titles, and more.

## Features

- Drag-and-drop CSV file upload
- Real-time validation with detailed error reporting
- Company Name validation (Inc., LLC, Co., Corp. formatting)
- Executive Last Name validation (length, forbidden suffixes)
- Executive Title validation (CEO, President, Owner only)
- State validation (2-letter codes)
- Issues column with all errors
- Instant CSV download
- 100% free, no login required

## Validation Rules

### Company Name
- Must use `, Inc.` (with comma and period)
- Must use `, LLC` (with comma)
- Must use `Co.` (with period, no comma required)
- Must use `Corp.` (with period, no comma required)
- Abbreviations like "Svc" must be spelled out as "Services"
- Abbreviations like "Mfg" must be spelled out as "Manufacturing"

### Executive Last Name
- Must be more than one letter
- Cannot contain: Jr, Sr, Jr., Sr., II, III, IV

### Executive Title
- Must be exactly one of: CEO, President, Owner

### State
- Must be exactly 2 letters (e.g., NY, CA, TX)

## Local Development

```bash
npm install
npm run dev
```

## Build for Production

```bash
npm run build
```

## Deploy to Vercel

1. Push this repository to GitHub
2. Go to https://vercel.com and import your GitHub repository
3. Click Deploy - that's it!
