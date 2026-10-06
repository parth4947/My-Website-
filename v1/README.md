# Tapcore Media — website

A static, bright, motion-first site for Tapcore Media. It uses plain HTML, CSS and JS. It has no framework, no build step and no runtime dependencies (only Google Fonts).

```
index.html            all page content
assets/css/style.css  design tokens + section styles
assets/js/main.js     interactions, canvas animations
assets/img/           logo mark + favicon (SVG, traced from the media kit)
```

## Run locally

```
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

Upload the folder to any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages, or your current host). No build is necessary.

## Things to update

- **Contact form**: the form opens the visitor's email app with a prefilled brief to `parth@tapcoremedia.net`. To collect leads without email, point the form at a form service (for example Formspree or Netlify Forms) in `assets/js/main.js` (search for `mailto:`).
- **Brand names**: the "Trusted by" section shows client names as text wordmarks. To show official logos, replace the `<span>` items in `.marquee` with `<img>` tags.
- **Logo**: `assets/img/logo-mark.svg` is a trace of the media-kit logo. Replace it with the original vector file if you have one, and replace the `<symbol id="mark">` path in `index.html` too.
- **Hero phone**: the numbers and events in the phone mockup are illustrative UI, not live data.

## Performance notes

- No blocking preloader. The hero intro is CSS only.
- Canvas animations (globe, fraud filter) run only while on screen and pause in background tabs.
- The site respects `prefers-reduced-motion`.
