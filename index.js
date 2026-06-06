/**
 * Page post type for Indiekit
 *
 * Creates root-level "slash pages" like /about, /now, /uses, /colophon, etc.
 * These are static pages that don't have dates in their URLs.
 *
 * @see https://slashpages.net for slash page inspiration
 */

const defaults = {
  name: "Page",
  // Use h: "page" for microformat type-based discovery
  // This sets properties.type to "page" which survives mf2→JF2 conversion
  h: "page",
  // Slash pages are stored under content/pages/ so the theme's pages
  // directory-data (content/pages/pages.json → layouts/page.njk) applies, while
  // the URL stays root-level (no dates). Writing to the content root instead
  // leaves pages with no layout (raw HTML / mojibake) on a fresh site.
  post: {
    path: "pages/{slug}.md",
    url: "{slug}",
  },
  media: {
    path: "media/pages/{filename}",
  },
  fields: {
    name: { required: true }, // Page title (e.g., "About", "Now", "Uses")
    summary: {}, // Optional page description
    content: { required: true }, // Page content
    category: {}, // Optional categories/tags
    "post-status": {}, // draft or published
    visibility: {}, // public, unlisted, private
  },
};

export default class PagePostType {
  name = "Page post type";

  constructor(options = {}) {
    this.options = { ...defaults, ...options };
  }

  get config() {
    return {
      name: this.options.name,
      h: this.options.h,
      post: this.options.post,
      media: this.options.media,
      fields: this.options.fields,
    };
  }

  init(Indiekit) {
    Indiekit.addPostType("page", this);
  }
}
