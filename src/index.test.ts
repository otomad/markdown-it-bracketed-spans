import { describe, it, expect } from "vitest";
import MarkdownIt from "markdown-it";
import bracketedSpansPlugin from "./index.js";

/**
 * Create a fresh markdown-it instance with the bracketed-spans plugin loaded.
 */
function createMd(): MarkdownIt {
  const md = new MarkdownIt();
  md.use(bracketedSpansPlugin);
  return md;
}

describe("markdown-it-bracketed-spans", () => {
  it("should wrap bracketed text in a <span> tag", () => {
    const md = createMd();
    const result = md.render("foo [bar]{.class} baz");
    expect(result).toContain("<span>bar</span>");
  });

  it("should preserve surrounding text", () => {
    const md = createMd();
    const result = md.render("hello [world]{} foo");
    // Without markdown-it-attrs, the {} remains as text after the span
    expect(result).toContain("<span>world</span>");
    expect(result).toContain("hello");
    expect(result).toContain("foo");
  });

  it("should handle inline markdown inside the span", () => {
    const md = createMd();
    const result = md.render("foo [bar *baz*]{.class} qux");
    expect(result).toContain("<span>bar <em>baz</em></span>");
  });

  it("should handle multiple bracketed spans in one paragraph", () => {
    const md = createMd();
    const result = md.render("[hello]{} [world]{}");
    // Both spans should appear
    expect(result).toContain("<span>hello</span>");
    expect(result).toContain("<span>world</span>");
  });

  it("should handle bracketed span at beginning of line", () => {
    const md = createMd();
    const result = md.render("[start]{.cls} end");
    expect(result).toContain("<span>start</span>");
  });

  it("should handle bracketed span at end of line", () => {
    const md = createMd();
    const result = md.render("start [end]{.cls}");
    expect(result).toContain("<span>end</span>");
  });

  it("should handle empty span content", () => {
    const md = createMd();
    const result = md.render("foo []{.class} bar");
    expect(result).toContain("<span></span>");
  });

  it("should handle nested inline markup inside span", () => {
    const md = createMd();
    const result = md.render("foo [**bold** and `code`]{.class} bar");
    expect(result).toContain("<span><strong>bold</strong> and <code>code</code></span>");
  });

  it("should handle link inside span", () => {
    const md = createMd();
    const result = md.render("foo [[link](http://example.com)]{.class} bar");
    // The outer brackets are the span, inner is a link
    expect(result).toContain('<span><a href="http://example.com">link</a></span>');
  });

  it("should NOT create a span without attributes (no {...} after])", () => {
    const md = createMd();
    const result = md.render("foo [not a span] bar");
    // [not a span] without {...} should be treated as regular text
    expect(result).not.toContain("<span>");
  });

  it("should NOT create a span when opening bracket is not matched with {...}", () => {
    const md = createMd();
    const result = md.render("[just brackets]");
    expect(result).toBe("<p>[just brackets]</p>\n");
  });

  it("should handle standalone [ in text", () => {
    const md = createMd();
    const result = md.render("text [ more text");
    expect(result).toBe("<p>text [ more text</p>\n");
  });

  it("should handle escaped special markdown characters inside span", () => {
    const md = createMd();
    const result = md.render("foo [escaped \\*star\\*]{.class} bar");
    expect(result).toContain("<span>escaped *star*</span>");
  });

  it("should render inline with renderInline", () => {
    const md = createMd();
    const result = md.renderInline("hello [world]{.cls}");
    // Without markdown-it-attrs, the {.cls} stays as text after the span
    expect(result).toContain("<span>world</span>");
  });
});
