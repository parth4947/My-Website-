# Tapcore Media — website

Every design version lives in its own folder and has a Git tag, so earlier versions stay intact.

| Version | Folder | Git tag | Summary |
|---|---|---|---|
| v2 | [`v2/`](v2/) | `v2` | "The Tap": a scroll-driven story built on GSAP, Lenis and Matter.js. Inspired by jeskojets.com, flim.ai and maxmilkin.com. |
| v1 | [`v1/`](v1/) | `v1` | Bright motion site in plain HTML/CSS/JS, built from the media kit. |

The root `index.html` is a small page that links to each version.

## Run locally

```
python3 -m http.server 8000
# open http://localhost:8000/        (version list)
# or    http://localhost:8000/v2/     (latest)
```

## Deploy one version

Each version folder is a complete static site. Upload the contents of one folder (for example `v2/`) to the web root of any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages or your current host). No build step is necessary.

## v2 notes

- **Libraries** are bundled in `v2/assets/vendor/`, so the site does not depend on a CDN:
  - GSAP 3.13 + ScrollTrigger (GreenSock standard no-charge license)
  - Lenis 1.3 (MIT)
  - Matter.js 0.20 (MIT), loaded only when the network section comes near
- **Fallback**: if the libraries fail to load, or the visitor asks for reduced motion, the page renders as a static layout with the same content.
- **Intro counter**: shows once per browser session, for about one second.
- **Contact form**: opens the visitor's email app (to parth@tapcoremedia.net) or WhatsApp (+91 96258 98987) with the brief filled in. To store leads without email, connect a form service (for example Formspree) in `v2/assets/js/main.js` (search for `mailto:`).
- **Content sources**: the media kit and the current tapcoremedia.com site (tagline, 50M+ installs a month, publishers, contact details). Client and publisher names show as text, not as logos.
- **Illustrative UI**: the phone ad, the retargeting notifications and the fraud-filter counter are animations. They are not live data.
