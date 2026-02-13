# @rmdes/indiekit-post-type-page

Page post type for [Indiekit](https://getindiekit.com). Creates root-level "slash pages" like `/about`, `/now`, `/uses`, `/colophon`.

## What It Does

Enables creating static pages (as opposed to dated blog posts) that live at root-level paths. Pages don't have dates in their URLs and are stored separately from posts.

**Example:**
- Standard post: `/articles/2026/02/13/my-article/`
- Page: `/about/`

Perfect for:
- `/about` - Who you are
- `/now` - What you're doing now ([nownownow.com](https://nownownow.com))
- `/uses` - Tools and gear you use ([uses.tech](https://uses.tech))
- `/colophon` - How your site is built
- `/contact` - How to reach you

See [slashpages.net](https://slashpages.net) for more ideas.

## Installation

```bash
npm install @rmdes/indiekit-post-type-page
```

## Usage

Add to your Indiekit configuration:

```javascript
export default {
  plugins: [
    "@rmdes/indiekit-post-type-page",
    // ... other plugins
  ],
};
```

**IMPORTANT:** Load this plugin BEFORE the preset plugin:

```javascript
plugins: [
  // Post types FIRST
  "@indiekit/post-type-article",
  "@indiekit/post-type-note",
  "@rmdes/indiekit-post-type-page",

  // Preset AFTER
  "@rmdes/indiekit-preset-eleventy",
],
```

## Creating Pages

### Via Admin UI

1. Log in to Indiekit admin
2. Click "New page" (or navigate to `/create?type=page`)
3. Fill in title and content
4. Set slug (e.g., `about` for `/about`)
5. Publish

### Via Micropub

Include `category[]=page` in your Micropub request:

```http
POST /micropub
Content-Type: application/x-www-form-urlencoded

h=entry
&name=About
&content=This is my about page.
&mp-slug=about
&category[]=page
```

Or use a Micropub client that supports custom post types.

## Configuration

### Default Behavior

Pages are stored at `pages/{slug}.md` and generate URLs at `/{slug}`.

```javascript
// Default configuration (with @rmdes/indiekit-preset-eleventy)
post: {
  path: "pages/{slug}.md",     // File: content/pages/about.md
  url: "{slug}",               // URL: /about
}
```

### Custom Paths

Override defaults if needed:

```javascript
export default {
  plugins: ["@rmdes/indiekit-post-type-page"],

  "@rmdes/indiekit-post-type-page": {
    post: {
      path: "static/{slug}.md",    // Custom file path
      url: "pages/{slug}",          // Custom URL path
    },
  },
};
```

## How It Works

1. **Post Type Detection:** When creating a post, Indiekit checks if `properties.type === "page"` or `category` includes `"page"`
2. **File Storage:** The post is saved to `content/pages/{slug}.md` (when using the Eleventy preset)
3. **URL Generation:** Eleventy builds the page at `/content/pages/{slug}/` (from the file path)
4. **Web Serving:** The static HTML is served at `/{slug}` (via nginx rewrites or direct Eleventy output)

## Fields

Pages support the following fields:

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Page title (e.g., "About", "Now") |
| `content` | Yes | Page content (Markdown or HTML) |
| `summary` | No | Page description (for meta tags) |
| `category` | No | Categories/tags |
| `post-status` | No | `draft` or `published` |
| `visibility` | No | `public`, `unlisted`, or `private` |

## Compatible Presets

This plugin works with:
- `@rmdes/indiekit-preset-eleventy` (recommended, includes special handling for pages)
- `@indiekit/preset-eleventy` (base preset)
- `@indiekit/preset-hugo`
- `@indiekit/preset-jekyll`

When using `@rmdes/indiekit-preset-eleventy`, pages are automatically stored in `pages/` directory and configured with the correct layout.

## License

MIT
