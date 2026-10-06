# Tapcore Media website

Every design version lives in its own folder, so earlier versions stay intact. (Git tags `v1` to `v4` mark each version locally; this environment could not push tags to GitHub.)

| Version | Folder | Git tag | Summary |
|---|---|---|---|
| v4 | [`v4/`](v4/) | `v4` | "The Tap", polished: About letters in two wedges of vertical type, Supply with a region orbit and stats strip, richer ad-format animations with arrow buttons, Ad formats before How we work. |
| v3 | [`v3/`](v3/) | `v3` | "The Tap", refined: smoother fly-through hero, minimal manifesto, About letter assembly, softer services with clear numbers, client and publisher logos, clients before supply, clearer section labels. |
| v2 | [`v2/`](v2/) | `v2` | "The Tap": a scroll-driven story built on GSAP, Lenis and Matter.js. Inspired by jeskojets.com, flim.ai and maxmilkin.com. |
| v1 | [`v1/`](v1/) | `v1` | Bright motion site in plain HTML/CSS/JS, built from the media kit. |

The root `index.html` is a small page that links to each version.

## Run locally

```
python3 -m http.server 8000
# open http://localhost:8000/        (version list)
# or    http://localhost:8000/v4/     (latest)
```

## Deploy one version

Each version folder is a complete static site. Upload the contents of one folder (for example `v4/`) to the web root of any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages or your current host). No build step is necessary.

## v2 and v3 notes

- **Libraries** are bundled in each version's `assets/vendor/` folder, so the site does not depend on a CDN:
  - GSAP 3.13 + ScrollTrigger (GreenSock standard no-charge license)
  - Lenis 1.3 (MIT)
  - Matter.js 0.20 (MIT), loaded only when the network section comes near
- **Fallback**: if the libraries fail to load, or the visitor asks for reduced motion, the page renders as a static layout with the same content.
- **Intro counter**: shows once per browser session, for about one second.
- **Contact form**: opens the visitor's email app (to parth@tapcoremedia.net) or WhatsApp (+91 96258 98987) with the brief filled in. To store leads without email, connect a form service (for example Formspree) in `v2/assets/js/main.js` (search for `mailto:`).
- **Content sources**: the media kit and the current tapcoremedia.com site (tagline, 50M+ installs a month, publishers, contact details). In v2, client and publisher names show as text; v3 uses logos.
- **Illustrative UI**: the phone ad, the retargeting notifications and the fraud-filter counter are animations. They are not live data.

## v3 and v4 additions

- **Logos**: client logos were cropped from the media kit (14) and taken from the current tapcoremedia.com site (Amazon, Crypto.com, Flipkart, Lazada, Tokopedia). Publisher logos also come from the current site. All are in `v3/assets/img/logos/` as transparent PNGs. They show in grey and turn to full color on hover (always in color on touch screens).
- **Copy**: the v3 page uses no em-dashes.
- **v4 Supply orbit**: the region tags (North America, LATAM, Europe, UK, MENA, India, SEA) follow the markets listed in Tapcore's planning notes. Edit them in `v4/index.html` (search for `orb-tag`).
- **v4 Ad formats**: the arrow buttons scroll two cards at a time. The mockups animate only while the strip is on screen.
