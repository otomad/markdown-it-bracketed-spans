import type MarkdownIt from "markdown-it";
/**
 * A markdown-it plugin that converts `[text]{attributes}` syntax into
 * `<span>` tags.
 *
 * Markup is based on [pandoc `bracketed_spans` extension](http://pandoc.org/MANUAL.html#extension-bracketed_spans).
 * Must be used together with the
 * [markdown-it-attrs plugin](https://github.com/arve0/markdown-it-attrs)
 * (that's a peer dependency).
 *
 * @example
 * ```typescript
 * import MarkdownIt from 'markdown-it'
 * import bracketedSpansPlugin from 'markdown-it-bracketed-spans'
 * import attrsPlugin from 'markdown-it-attrs'
 *
 * const md = new MarkdownIt()
 * md.use(bracketedSpansPlugin)
 * md.use(attrsPlugin)
 *
 * md.render('foo [bar *bar*]{#id .class attr=value} baz')
 * // <p>foo <span id="id" class="class" attr="value">bar <em>bar</em></span> baz</p>
 * ```
 */
export default function bracketedSpansPlugin(md: MarkdownIt): void;
//# sourceMappingURL=index.d.ts.map