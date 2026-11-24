# summerishtar — portfolio

Portfolio site for Summer Ishtar (Ishtar Design), Senior Brand & Digital Designer in Bangkok.
Plain HTML/CSS/JS, no build step.

## Run locally

    python3 -m http.server 8080
    # open http://localhost:8080

## Editing

- Projects, copy and image lists: `assets/js/projects.js`
- Contact email: `window.SITE` in `index.html`
- Images live in `assets/img` (WebP). Case studies open at `#work/<slug>`.

## Deploying

Any static host works (Netlify drop, Vercel, GitHub Pages, Cloudflare Pages): upload the folder as-is.

## Cache busting

GitHub Pages/Cloudflare cache CSS and JS for up to 4 hours. When you change
`assets/css` or `assets/js`, bump the `?v=` date on their tags in `index.html`
so visitors don't get new HTML with stale scripts.
