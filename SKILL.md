---
name: aether-titans-static-deploy-check
description: Use when updating, deploying, or post-deployment checking the Aether Titans static Cloudflare Pages site, especially after edits to index.html, styles.css, script.js, images, videos, lazy autoplay media, caching headers, GitHub pushes, or Cloudflare Pages live URLs.
---

# Aether Titans Static Deploy Check

Use this workflow for every website update before telling the user the live site is fixed. Do not trust local preview alone.

## Project Facts

- Project path: `/Users/liafenyua/Documents/web design/aether-titans-site`
- GitHub remote: `https://github.com/Prinnyyy/aether-titans-site.git`
- Production URL: `https://aether-titans-site.pages.dev/`
- Static host: Cloudflare Pages
- No build step, npm, backend, or extra dependencies.

## Core Rule

After changing JS or CSS, update the asset URL in `index.html` with a new version query:

```html
<link rel="stylesheet" href="styles.css?v=YYYYMMDD-label">
<script src="script.js?v=YYYYMMDD-label"></script>
```

Cloudflare may cache `/script.js` and `/styles.css` for 86400 seconds. A changed file with the same URL can make the live page run old code even when local preview works.

## Pre-Edit Checks

1. Run `git status --short` in the project folder.
2. Read the relevant sections with `rg` and `sed`.
3. Preserve the current Granblue-inspired visual direction unless the user explicitly asks for redesign.
4. Avoid adding build tools or dependencies.

## Media Loading Rules

Use these rules when adding or editing video:

- Hero video may autoplay on initial load.
- Non-hero autoplay videos must be muted, `playsinline`, `loop`, `autoplay`, and `preload="none"`.
- Non-hero videos should use `data-lazy-video="Materials/video/file.mp4"` and an empty `<source type="video/mp4">`.
- JS must set the real `src` only when the video is near or inside the viewport.
- Add a scroll/resize/pageshow fallback in addition to `IntersectionObserver`.
- Always use a `poster` so a static frame appears before loading.

Recommended non-hero video pattern:

```html
<video
  class="lazy-autoplay-video"
  data-lazy-video="Materials/video/example.mp4"
  muted
  autoplay
  playsinline
  loop
  preload="none"
  poster="Materials/optimized/example.jpg"
>
  <source type="video/mp4" />
</video>
```

## Local Verification

Start a static server:

```bash
python3 -m http.server 5177
```

Verify in the browser, not only by reading files:

- Initial page load uses the versioned `script.js` and `styles.css` URLs.
- Only the hero video has a real `src` on first load.
- Scroll to `#titans`, `#trailer`, and `#cta`; each autoplay video should have a real `src`, `paused: false`, and increasing `currentTime`.
- Check gallery images for duplicate `src` values when the user reports repeated images.
- Check mobile width around 599px and desktop width when visual overlap is reported.

Useful browser evaluation:

```js
[...document.querySelectorAll("video")].map((video) => ({
  section: video.closest("section")?.id || "hero",
  src: video.currentSrc || video.querySelector("source")?.getAttribute("src") || "",
  paused: video.paused,
  currentTime: Number(video.currentTime || 0).toFixed(2),
  readyState: video.readyState,
  error: video.error ? { code: video.error.code, message: video.error.message } : null
}))
```

## Deploy Workflow

1. Review the diff:

```bash
git diff --stat
git diff -- index.html styles.css script.js
```

2. Commit with a specific message:

```bash
git add index.html styles.css script.js
git commit -m "Short precise change summary"
```

3. Push:

```bash
git push origin main
```

## Live Verification

After pushing, wait until Cloudflare serves the new HTML. Do not assume the deploy is live immediately.

```bash
curl -s https://aether-titans-site.pages.dev/ | rg 'script.js\\?v=NEW_VERSION'
```

If it is not present, wait and retry.

Then verify headers and live code:

```bash
curl -sI https://aether-titans-site.pages.dev/script.js?v=NEW_VERSION
curl -s https://aether-titans-site.pages.dev/script.js?v=NEW_VERSION | rg 'expectedNewFunctionOrText'
```

Use the live URL in the browser and repeat the same video checks used locally. For autoplay sections, scroll to each section and confirm:

- `src` is no longer empty.
- `paused` is `false`.
- `readyState` is at least `2`; `4` is ideal.
- `currentTime` is greater than `0`.
- `error` is `null`.

## Common Failure Modes

- Local works, live does not: usually stale `script.js` or `styles.css`; bump the version query and redeploy.
- HTML changed but behavior did not: check the live script URL and grep live JS for the new function.
- Poster appears but video does not move: check whether JS set the `<source src>`, then check `paused`, `readyState`, and `video.error`.
- Video file 404 or wrong MIME: run `curl -sI` on the exact encoded video URL and confirm `HTTP 200` and `content-type: video/mp4`.
- User sees old layout after deploy: confirm they are on `https://aether-titans-site.pages.dev/`, not an old preview deployment URL.

## Final Response Checklist

Report:

- What changed.
- What cache/version issue was prevented or fixed.
- What was verified locally.
- What was verified on the live Cloudflare Pages URL.
- Commit hash and whether push succeeded.
