import { describe, it, expect } from "vitest";
import MarkdownIt from "markdown-it";
import attrsPlugin from "markdown-it-attrs";
import bracketedSpansPlugin from "./index.js";
import _dedent from "dedent";

/**
 * Create a fresh markdown-it instance with the plugins loaded, then render the markdown text to html.
 * @param markdownSource - The markdown source text that to be rendered.
 * @returns The rendered html text.
 */
function renderMd(markdownSource: string, { inline = false } = {}): string {
  const md = new MarkdownIt();
  md.use(bracketedSpansPlugin);
  md.use(attrsPlugin);
  const result = inline ? md.renderInline(markdownSource) : md.render(markdownSource);
  return result.replace(/\n$/, ""); // Without the trailing line feed.
}

const dedent = _dedent.withOptions({ escapeSpecialCharacters: false });

describe("markdown-it-bracketed-spans", () => {
  it("should wrap bracketed text in a <span> tag", () => {
    const result = renderMd("foo [bar]{.class} baz");
    expect(result).toBe('<p>foo <span class="class">bar</span> baz</p>');
  });

  it("should preserve surrounding text, but due to markdown-it-attrs's behavior, empty attrs {...} might not add attributes", () => {
    const result = renderMd("hello [world]{} foo");
    expect(result).toBe('<p>hello <span>world</span>{} foo</p>');
  });

  it("should handle inline markdown inside the span", () => {
    const result = renderMd("foo [bar *baz*]{.class} qux");
    expect(result).toBe('<p>foo <span class="class">bar <em>baz</em></span> qux</p>');
  });

  it("should handle multiple bracketed spans in one paragraph", () => {
    const result = renderMd("[hello]{#hello} [world]{#world}");
    expect(result).toBe('<p><span id="hello">hello</span> <span id="world">world</span></p>');
  });

  it("should handle bracketed span at beginning of line", () => {
    const result = renderMd("[start]{.cls} end");
    expect(result).toBe('<p><span class="cls">start</span> end</p>');
  });

  it("should handle bracketed span at end of line", () => {
    const result = renderMd("start [end]{.cls}");
    expect(result).toBe('<p>start <span class="cls">end</span></p>');
  });

  it("should handle empty span content", () => {
    const result = renderMd("foo []{.class} bar");
    expect(result).toBe('<p>foo <span class="class"></span> bar</p>');
  });

  it("should handle nested inline markup inside span", () => {
    const result = renderMd("foo [**bold** and `code`]{.class} bar");
    expect(result).toBe('<p>foo <span class="class"><strong>bold</strong> and <code>code</code></span> bar</p>');
  });

  it("should handle link inside span", () => {
    const result = renderMd("foo [[link](http://example.com)]{.class} bar");
    // The outer brackets are the span, inner is a link
    expect(result).toBe('<p>foo <span class="class"><a href="http://example.com">link</a></span> bar</p>');
  });

  it("should NOT create a span without attributes (no {...} after])", () => {
    const result = renderMd("foo [not a span] bar");
    // [not a span] without {...} should be treated as regular text
    expect(result).toBe('<p>foo [not a span] bar</p>');
  });

  it("should NOT create a span when opening bracket is not matched with {...}", () => {
    const result = renderMd("[just brackets]");
    expect(result).toBe('<p>[just brackets]</p>');
  });

  it("should handle standalone [ in text", () => {
    const result = renderMd("text [ more text");
    expect(result).toBe('<p>text [ more text</p>');
  });

  it("should handle escaped special markdown characters inside span", () => {
    const result = renderMd("foo [escaped \\*star\\*]{.class} bar");
    expect(result).toBe('<p>foo <span class="class">escaped *star*</span> bar</p>');
  });

  it("should render inline with renderInline", () => {
    const result = renderMd("hello [world]{.cls} again", { inline: true });
    expect(result).toBe('hello <span class="cls">world</span> again');
  });

  it("should behave like it in readme", () => {
    const result = renderMd("foo [bar *bar*]{#id .class attr=value} baz");
    expect(result).toBe('<p>foo <span id="id" class="class" attr="value">bar <em>bar</em></span> baz</p>');
  });

  it("should handle nested span that contains [...] text", () => {
    const result = renderMd("foo [[bar] & [baz]]{hidden} qux");
    expect(result).toBe('<p>foo <span hidden="">[bar] &amp; [baz]</span> qux</p>');
  });

  it("should handle nested spans in [...] text", () => {
    const result = renderMd("foo [[bar]{.b} [baz]{.b}] qux");
    expect(result).toBe('<p>foo [<span class="b">bar</span> <span class="b">baz</span>] qux</p>');
  });

  it("should handle nested inline markup with attrs inside span", () => {
    const result = renderMd("foo [**bold**{.bold} and `code`{.code}]{.span} bar {.p}");
    expect(result).toBe('<p class="p">foo <span class="span"><strong class="bold">bold</strong> and <code class="code">code</code></span> bar</p>');
  });

  it("should NOT create a span with attrs with just a standalone [", () => {
    const result = renderMd("text [{.left} more text");
    expect(result).toBe('<p>text [{.left} more text</p>');
  });

  it("should NOT create a span with attrs with just a standalone ]", () => {
    const result = renderMd("text more ]{.right} text");
    expect(result).toBe('<p>text more ]{.right} text</p>');
  });

  it("should have attrs for all span, link, and image", () => {
    const result = renderMd("here are [span]{.span}, [link](#anchor){.link}, and ![alt](./img.jpg){.image}");
    expect(result).toBe('<p>here are <span class="span">span</span>, <a href="#anchor" class="link">link</a>, and <img src="./img.jpg" alt="alt" class="image"></p>');
  });

  it("should handle escaped standalone left [, right ], and both [ & ]", () => {
    const result = renderMd("escape \\[ left ] and [ right \\] or \\[ both \\]");
    expect(result).toBe('<p>escape [ left ] and [ right ] or [ both ]</p>');
  });

  it("should NOT create a span with attrs with escaped standalone left [", () => {
    const result = renderMd("I am \\[NOT]{.red} a span");
    expect(result).toBe('<p>I am [NOT]{.red} a span</p>');
  });

  it("should NOT create a span with attrs with escaped standalone right ]", () => {
    const result = renderMd("I am [NOT\\]{.red} a span");
    expect(result).toBe('<p>I am [NOT]{.red} a span</p>');
  });

  it("should NOT create a span with attrs with escaped both [ & ]", () => {
    const result = renderMd("I am \\[NOT\\]{.red} a span");
    expect(result).toBe('<p>I am [NOT]{.red} a span</p>');
  });

  it("should NOT create a span with attrs with escaped standalone left {", () => {
    const result = renderMd("I am [NOT]\\{.red} a span");
    expect(result).toBe('<p>I am [NOT]{.red} a span</p>');
  });

  it("should handle nested spans", () => {
    const result = renderMd("foo [[[deep]{data-depth=3}]{data-depth=2}]{data-depth=1} bar");
    expect(result).toBe('<p>foo <span data-depth="1"><span data-depth="2"><span data-depth="3">deep</span></span></span> bar</p>');
  });

  it("should handle nested spans with alternating brackets [...]", () => {
    const result = renderMd("foo [[[deep]{data-depth=3}]]{data-depth=1} bar");
    expect(result).toBe('<p>foo <span data-depth="1">[<span data-depth="3">deep</span>]</span> bar</p>');
  });

  it("should handle span with single letter in a word", () => {
    const result = renderMd("q[u]{.red}x");
    expect(result).toBe('<p>q<span class="red">u</span>x</p>');
  });

  it("should handle span around fullwidth punctuation beside other words", () => {
    const result = renderMd("[hello：]{.strong}world");
    expect(result).toBe('<p><span class="strong">hello：</span>world</p>');
  });

  it("should handle standalone [ beside a span with empty attrs {...}", () => {
    const result = renderMd("[[b]{}");
    expect(result).toBe('<p>[<span>b</span>{}</p>');
  });

  it("should handle standalone [ beside a span, the [ should be out of the span", () => {
    const result = renderMd("[[b]{.c}");
    expect(result).toBe('<p>[<span class="c">b</span></p>');
  });

  it("should handle standalone [ beside a span, the [ should be in the span", () => {
    const result = renderMd("[\\[b]{.c}");
    expect(result).toBe('<p><span class="c">[b</span></p>');
  });

  it("should handle standalone ] beside a span, the ] should be in the span", () => {
    const result = renderMd("[b\\]]{.c}");
    expect(result).toBe('<p><span class="c">b]</span></p>');
  });

  it("should handle spans which content including link", () => {
    const result = renderMd("[This is an example of [Google](www.google.com)]{.class}");
    expect(result).toBe('<p><span class="class">This is an example of <a href="www.google.com">Google</a></span></p>');
  });

  it("should handle spans which content including image", () => {
    const result = renderMd("[This is the favicon of ![Google](www.google.com/favicon.ico)]{.class}");
    expect(result).toBe('<p><span class="class">This is the favicon of <img src="www.google.com/favicon.ico" alt="Google"></span></p>');
  });

  it("should handle spans which content including image inside a link", () => {
    const result = renderMd("[Click [![Google](www.google.com/favicon.ico)](www.google.com) to search]{.class}");
    expect(result).toBe('<p><span class="class">Click <a href="www.google.com"><img src="www.google.com/favicon.ico" alt="Google"></a> to search</span></p>');
  });

  it("should handle link which inside a span", () => {
    const result = renderMd("[This is an example of [Google]{.class}](www.google.com)");
    expect(result).toBe('<p><a href="www.google.com">This is an example of <span class="class">Google</span></a></p>');
  });

  it("should handle nested span, link, and image", () => {
    const result = renderMd("[This is [the]{.big} ![favicon](www.google.com/favicon.ico) of [G[o]{.red}ogle](www.google.com)]{.italic}");
    expect(result).toBe('<p><span class="italic">This is <span class="big">the</span> <img src="www.google.com/favicon.ico" alt="favicon"> of <a href="www.google.com">G<span class="red">o</span>ogle</a></span></p>');
  });

  it("should handle reference links and reference images", () => {
    const result = renderMd(dedent`
      Link: [Google][google-link]\
      Logo: ![Google Logo][google-logo]

      [google-link]: www.google.com
      [google-logo]: www.google.com/favicon.ico
    `);
    expect(result).toBe(dedent`
      <p>Link: <a href="www.google.com">Google</a><br>
      Logo: <img src="www.google.com/favicon.ico" alt="Google Logo"></p>
    `);
  });

  it("should handle reference links and reference images with attrs instead of create spans", () => {
    const result = renderMd(dedent`
      Link: [Google][google-link]{.class}\
      Logo: ![Google Logo][google-logo]{.class}

      [google-link]: www.google.com
      [google-logo]: www.google.com/favicon.ico
    `);
    expect(result).toBe(dedent`
      <p>Link: <a href="www.google.com" class="class">Google</a><br>
      Logo: <img src="www.google.com/favicon.ico" alt="Google Logo" class="class"></p>
    `);
  });

  it("should break reference links and reference images by spans", () => {
    const result = renderMd(dedent`
      Link: [Google]{.class}[google-link]\
      Logo: ![Google Logo]{.class}[google-logo]

      [google-link]: www.google.com
      [google-logo]: www.google.com/favicon.ico
    `);
    expect(result).toBe(dedent`
      <p>Link: <span class="class">Google</span><a href="www.google.com">google-link</a><br>
      Logo: !<span class="class">Google Logo</span><a href="www.google.com/favicon.ico">google-logo</a></p>
    `);
  });

  it("should break reference links and reference images by spans", () => {
    const result = renderMd(dedent`
      Link: [Google][google-link]\
      Logo: ![Google Logo][google-logo]

      [google-link]{.class}: www.google.com
      [google-logo]{.class}: www.google.com/favicon.ico
    `);
    expect(result).toBe(dedent`
      <p>Link: [Google][google-link]<br>
      Logo: ![Google Logo][google-logo]</p>
      <p><span class="class">google-link</span>: www.google.com
      <span class="class">google-logo</span>: www.google.com/favicon.ico</p>
    `);
  });

  it("should break reference links and reference images by spans", () => {
    const result = renderMd(dedent`
      Link: [Google][google-link]{.class}\
      Logo: ![Google Logo][google-logo]{.class}

      [google-link]{.class}: www.google.com
      [google-logo]{.class}: www.google.com/favicon.ico
    `);
    expect(result).toBe(dedent`
      <p>Link: [Google]<span class="class">google-link</span><br>
      Logo: ![Google Logo]<span class="class">google-logo</span></p>
      <p><span class="class">google-link</span>: www.google.com
      <span class="class">google-logo</span>: www.google.com/favicon.ico</p>
    `);
  });
});
