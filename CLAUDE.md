# CLAUDE.md - indiekit-post-type-page

Indiekit plugin that provides a "page" post type for creating root-level slash pages like `/about`, `/now`, `/uses`, `/colophon`.

## Package Overview

**Package:** `@rmdes/indiekit-post-type-page`
**Type:** Indiekit post type plugin
**Purpose:** Enable creation of static pages (as opposed to dated blog posts) that live at root-level paths

Unlike standard post types (article, note, photo) which generate URLs like `/articles/2026/02/13/slug/`, pages generate URLs like `/about/` or `/now/`. No date in the URL, no date-based directory structure.

## Architecture

### Plugin Registration

The plugin exports a class that implements the Indiekit post type plugin API:

```javascript
export default class PagePostType {
  name = "Page post type";

  get config() {
    return {
      name: "Page",
      h: "page",          // Microformat type
      post: { ... },      // File path and URL templates
      media: { ... },     // Media file path template
      fields: { ... },    // Required/optional fields
    };
  }

  init(Indiekit) {
    Indiekit.addPostType("page", this);
  }
}
```

### Post Type Configuration

**Microformat type:** `h: "page"`
- Sets `properties.type` to `"page"` after mf2→JF2 conversion
- Used by `@rmdes/indiekit-endpoint-micropub` for type-based post discovery
- Survives mf2→JF2 transformation (unlike `h-entry` which becomes `entry`)

**File paths:**
```javascript
post: {
  path: "{slug}.md",        // Stored at root: about.md, now.md, uses.md
  url: "{slug}",            // URL: /about, /now, /uses
}
```

**CRITICAL:** This is the DEFAULT configuration. `@rmdes/indiekit-preset-eleventy` OVERRIDES this to:
```javascript
post: {
  path: "pages/{slug}.md",     // Stored in pages/: pages/about.md
  url: "{slug}",               // URL still: /about
}
```

The preset override is applied in `lib/post-types.js` via special handling for `type === "page"`.

**Media paths:**
```javascript
media: {
  path: "media/pages/{filename}",
}
```

**Fields:**
```javascript
fields: {
  name: { required: true },         // Page title
  summary: {},                      // Optional description
  content: { required: true },      // Page content
  category: {},                     // Optional tags
  "post-status": {},                // draft or published
  visibility: {},                   // public, unlisted, private
}
```

## How It Works

### 1. Micropub Post Creation

When creating a page via Micropub:

```http
POST /micropub
Content-Type: application/x-www-form-urlencoded

h=entry
&name=About
&content=This is my about page.
&mp-slug=about
&category[]=page
```

**CRITICAL:** To trigger page detection, use EITHER:
- `category[]=page` (category-based detection in `@rmdes/indiekit-endpoint-micropub`)
- OR create via admin UI's "New page" button (sets `properties.type = "page"`)

### 2. Post Type Detection

`@rmdes/indiekit-endpoint-micropub` detects post type via:
1. **Type-based:** `properties.type === "page"` → use page post type
2. **Category-based:** `properties.category` includes `"page"` → use page post type
3. **Fallback:** content-based detection (standard Indiekit behavior)

### 3. File Storage

With `@rmdes/indiekit-preset-eleventy`, the post is stored at:
```
content/pages/about.md
```

With frontmatter:
```yaml
---
date: 2026-02-13T14:30:00.000Z
title: About
---

This is my about page.
```

**CRITICAL:** No `permalink` in frontmatter. Eleventy generates URLs from file paths. The preset's `post-template.js` just does `delete properties.url` — it does NOT convert URL to permalink.

### 4. URL Generation

Eleventy generates the page at `/content/pages/about/` (from file path `pages/about.md`).

**If using nginx rewrites (Cloudron deployment):**
- nginx rewrites `/about` → `/content/pages/about/`

**If using Caddy (Docker Compose deployment):**
- Caddy serves static site, Eleventy outputs to `/content/pages/about/index.html`
- Accessible at `/content/pages/about/`

**CRITICAL: Why no permalink in frontmatter**
- Adding `permalink: /about/` to frontmatter makes Eleventy generate at `/about/index.html` instead of `/content/pages/about/index.html`
- This conflicts with nginx rewrites (which expect `/content/pages/about/`)
- Result: 404s

## Inter-Plugin Relationships

### @rmdes/indiekit-preset-eleventy

**Overrides post type paths:**
- Default: `{slug}.md` → `/about.md`
- Preset: `pages/{slug}.md` → `/pages/about.md`

**Ensures no permalink in frontmatter:**
- `post-template.js` does `delete properties.url` (line 59)
- Does NOT convert to `permalink` (this was tried in beta.34, caused 404s, removed in beta.35)

### @rmdes/indiekit-endpoint-micropub

**Type-based post discovery:**
- Checks `properties.type === "page"` to select page post type
- This is more reliable than category-based detection (categories can change, type is set once)

**Category-based fallback:**
- If `properties.category` includes `"page"`, use page post type
- Required for Micropub clients that don't support custom post types

### nginx (Cloudron deployment)

**URL rewrites:**
```nginx
rewrite ^/about$ /content/pages/about/ last;
rewrite ^/now$ /content/pages/now/ last;
# etc.
```

**CRITICAL:** These rewrites are MANUALLY configured for specific pages. Adding a new page requires updating nginx config and restarting.

### Eleventy

**Directory data files:**
```json
// content/pages/pages.json
{
  "layout": "layouts/page.njk"
}
```

This sets the default layout for all pages in `content/pages/`. Created by `docker/eleventy/entrypoint.sh` on first run.

## Configuration

### Default (no customization)

Just load the plugin:

```javascript
plugins: [
  "@rmdes/indiekit-post-type-page",
  // ... other plugins
],
```

### Custom options

Override defaults:

```javascript
"@rmdes/indiekit-post-type-page": {
  post: {
    path: "static/{slug}.md",    // Store in static/ instead of pages/
    url: "pages/{slug}",          // URL: /pages/about instead of /about
  },
},
```

**Note:** Customizing paths may conflict with preset overrides. The preset's special handling for `type === "page"` will still apply.

## Common Gotchas

### Pages return 404

**Cause:** URL mismatch between Eleventy output path and nginx rewrites.

**Diagnosis:**
1. Check file exists: `content/pages/about.md`
2. Check Eleventy output: `_site/content/pages/about/index.html` should exist
3. Check nginx rewrites: `/about` should rewrite to `/content/pages/about/`

**Fix:** Ensure `post-template.js` does NOT add `permalink` to frontmatter. If `permalink` is present, remove it and rebuild.

### New pages don't appear

**Cause:** nginx rewrites are manually configured. New pages need new rewrite rules.

**Fix (Cloudron):**
1. Edit `nginx.conf.template`, add rewrite rule
2. Rebuild and update: `cloudron build && cloudron update --app rmendes.net`

**Fix (Docker Compose):**
- No rewrites needed if Caddy is configured to serve Eleventy output directly

### Page created but filed under wrong post type

**Cause:** Post type detection failed.

**Diagnosis:** Check `properties.type` and `properties.category` in the post's frontmatter.

**Fix:**
1. **For admin UI:** Use "New page" button (sets `properties.type = "page"`)
2. **For Micropub clients:** Include `category[]=page` in the request
3. **For programmatic posts:** Set `properties.type = "page"` before saving

## Slash Pages Reference

See [slashpages.net](https://slashpages.net) for inspiration:

- `/about` - Who you are
- `/now` - What you're doing now
- `/uses` - Tools and gear you use
- `/colophon` - How the site is built
- `/contact` - How to reach you
- `/changelog` - Site update history
- `/projects` - Things you've built
- `/ideas` - Public idea backlog
