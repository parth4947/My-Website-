# Editing the live website (v6)

The live site at www.tapcoremedia.com is published from the `v6` folder.
Every change saved to `v6` on GitHub goes live by itself in about 1 minute (Vercel).

## How to edit a file on GitHub

1. Open https://github.com/parth4947/My-Website- and log in.
2. Open the `v6` folder, then the file (see the tables below).
3. Click the pencil icon (Edit this file).
4. Press Ctrl + F (Cmd + F on Mac) and search for the text.
5. Make the change. Do not delete `<`, `>`, `"`, `=` or `/` around other text.
6. Click **Commit changes…**, write a short note, then click **Commit changes**.
7. Wait 1 to 2 minutes. Reload the site with Ctrl + Shift + R.

To undo: in Vercel, open **Deployments**, select the deployment from before the change, then **Promote to Production** (Instant Rollback).

## Remove the phone number / WhatsApp

The number is in 5 places: 3 in `v6/index.html` and 2 in `v6/assets/js/main.js`.

| # | File | Search for | Delete |
|---|---|---|---|
| 1 | `v6/index.html` | `· +91 96258 98987` (mobile menu) | Delete only ` · +91 96258 98987`. Keep `tanu@tapcoremedia.com`. |
| 2 | `v6/index.html` | `<dt class="mono">WhatsApp</dt>` (contact section) | Delete that whole line, from `<div><dt class="mono">WhatsApp</dt>` to its ending `</div>`. |
| 3 | `v6/index.html` | `data-wa` (contact form) | Delete the whole line `<button class="btn btn-green" type="button" data-wa>Send on WhatsApp</button>`. |
| 4 | `v6/index.html` | `wa.me` (footer) | Delete only `<a href="https://wa.me/919625898987" target="_blank" rel="noopener">WhatsApp</a>`. |
| 5 | `v6/assets/js/main.js` | `data-wa` | Delete the block that starts with `$("[data-wa]", form).addEventListener("click", () => {` and ends with the matching `});` (6 lines). If you skip this step after step 3, the form stops working. |

Check after saving: search `v6/index.html` and `v6/assets/js/main.js` for `9625`. There must be no results.

## Other contact details

| What | File | Search for |
|---|---|---|
| Business email | `v6/index.html` (3 places) and `v6/assets/js/main.js` (1 place, the form) | `tanu@tapcoremedia.com` |
| Contact name | `v6/index.html` | `Tanu Singh` |
| Accounts email | `v6/index.html` | `accounts@tapcoremedia.com` |
| Address | `v6/index.html` | `DLF Cybercity` |
| Map link | `v6/index.html` | `maps.app.goo.gl` |

Email links have two parts, for example `<a href="mailto:x@y.com">x@y.com</a>`. Change both.

## Domains

| Domain | Where it points |
|---|---|
| www.tapcoremedia.com | Main address (Vercel project `my-website--v6`) |
| tapcoremedia.com | 308 redirect to www |
| tapcoremedia.net | Used for email. Website: 308 redirect to www.tapcoremedia.com (add it in Vercel, see steps in the chat). Never change its MX, SPF, DKIM or DMARC records. |
