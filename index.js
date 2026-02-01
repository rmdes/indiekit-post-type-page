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
      h: "entry",
      fields: this.options.fields,
    };
  }

  init(Indiekit) {
    Indiekit.addPostType("page", this);
  }
}
