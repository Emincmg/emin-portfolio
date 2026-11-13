# emin-portfolio

Personal site and résumé of Ali Emin Çomoğlu — Lead Developer & systems architect.

Built with Next.js (App Router, server-rendered), GSAP, Lenis and a small canvas engine for the interactive section backgrounds.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm run start   # production server
```

## Where things live

| Path | What |
| --- | --- |
| `src/content/site.ts` | Every piece of copy on the site. Edit this to update the CV. |
| `src/components/sections/` | One server component per section. All text is rendered on the server. |
| `src/components/client/` | The only client code: `Background` (canvas + mode switcher), `Terminal` (press <kbd>`</kbd>), `Motion` (GSAP and scroll). |
| `src/lib/bg/engine.ts` | Background engine: draws only inside the active section's `.bgstage`, so it never sits behind text. |
| `src/lib/bg/modes/` | One file per background: network traffic, traffic management, event streaming, concurrency, continuous delivery, service health, API protection. |
| `src/lib/diagrams.ts` | Architecture drawings as data, rendered to SVG on the server. |
| `src/app/` | Layout, metadata, JSON-LD, `sitemap.xml`, `robots.txt`, web manifest, icon and Open Graph image. |
| `public/resume.pdf` | Downloadable résumé. |

## Adding a background mode

Create a file in `src/lib/bg/modes/` that exports a `ModeFactory`, register it in `modes/index.ts`, and use its key in a section's `<BgStage mode="…" />`.

## SEO

- Metadata API: title template, description, canonical URL, Open Graph (profile) and Twitter cards.
- Generated Open Graph image and icon (`opengraph-image.tsx`, `icon.tsx`).
- `ProfilePage` + `Person` structured data (JSON-LD) in `page.tsx`.
- `sitemap.xml`, `robots.txt`, web manifest.
- Semantic, server-rendered HTML; animations only enhance it and respect `prefers-reduced-motion`.

The public address comes from `NEXT_PUBLIC_SITE_URL`. On Vercel it falls back to the project's production `*.vercel.app` address, so canonical URLs, the sitemap and share cards are right without any setup. When you get a domain, add it in Vercel and set `NEXT_PUBLIC_SITE_URL=https://your-domain`.

## Deploy (free)

1. Sign in to [vercel.com](https://vercel.com) with GitHub and choose **Add New → Project**.
2. Import `Emincmg/emin-portfolio`. The defaults (Next.js, `npm run build`) are correct.
3. Deploy. Every push to `main` redeploys automatically.

## Résumé PDF

`resume/resume.html` is the print source. Regenerate the PDF with headless Chrome:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --no-pdf-header-footer \
  --print-to-pdf=public/resume.pdf "file://$PWD/resume/resume.html"
```
