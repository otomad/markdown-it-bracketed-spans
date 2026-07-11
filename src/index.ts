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
 * ```ts
 * import markdownit from 'markdown-it'
 * import bracketedSpans from 'markdown-it-bracketed-spans'
 * import attrsPlugin from 'markdown-it-attrs'
 *
 * const md = markdownit()
 * md.use(bracketedSpans)
 * md.use(attrsPlugin)
 *
 * md.render('foo [bar *bar*]{#id .class attr=value} baz')
 * // <p>foo <span id="id" class="class" attr="value">bar <em>bar</em></span> baz</p>
 * ```
 */
export default function bracketedSpansPlugin(md: MarkdownIt): void {
  md.inline.ruler.push("bracketed-spans", function bracketedSpansRule(
    state,
    _silent
  ): boolean {
    const max = state.posMax;

    if (state.src.charCodeAt(state.pos) !== 0x5b /* [ */) {
      // opening [
      return false;
    }

    const labelStart = state.pos + 1;
    const labelEnd = state.md.helpers.parseLinkLabel(state, state.pos, false);

    if (labelEnd < 0) {
      // parser failed to find closing ]
      return false;
    }

    const tokens = state.tokens;
    const tokensLen = tokens.length;

    if (
      (tokensLen === 0 && state.level > 0) ||
      (tokensLen > 0 &&
        ((tokens[tokensLen - 1].nesting < 1 &&
          tokens[tokensLen - 1].level !== state.level) ||
          (tokens[tokensLen - 1].nesting > 0 &&
            tokens[tokensLen - 1].level >= state.level)))
    ) {
      // parser failed to find closing ]
      return false;
    }

    const pos = labelEnd + 1;
    if (pos < max && state.src.charCodeAt(pos) === 0x7b /* { */) {
      // probably found span

      state.pos = labelStart;
      state.posMax = labelEnd;

      state.push("span_open", "span", 1);
      state.md.inline.tokenize(state);
      state.push("span_close", "span", -1);

      state.pos = pos;
      state.posMax = max;
      return true;
    } else {
      return false;
    }
  });
}
