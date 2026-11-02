import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Calendar, Clock } from "lucide-react";
import { Faq } from "@/components/shared/Faq";
import { GuideToolCta } from "@/components/shared/GuideToolCta";
import { getGuide, getRelatedGuides } from "@/lib/guides";
import { generateGuideMetadata } from "@/lib/toolMetadata";
import { guideArticleJsonLd, guideBreadcrumbJsonLd, guideFaqJsonLd, guideHowToJsonLd } from "@/lib/jsonLd";

const guide = getGuide("make-a-table-in-markdown")!;
const relatedGuides = getRelatedGuides(guide.slug);
export const metadata: Metadata = generateGuideMetadata(guide);

const codeClass = "font-mono text-[var(--fg)]";
const preClass = "mt-4 p-4 rounded-lg border border-[var(--hairline)] bg-[var(--bg-soft)] font-mono text-[12.5px] whitespace-pre-wrap text-[var(--fg)]";
const h2Class = "font-display text-2xl font-semibold text-[var(--fg)] mb-4";
const h3Class = "font-display text-lg font-semibold text-[var(--fg)] mt-6 mb-2";
const tableWrapClass = "mt-4 overflow-x-auto rounded-lg border border-[var(--hairline)]";
const tableClass = "w-full text-left text-[13.5px]";
const theadClass = "bg-[var(--bg-raise)] font-mono text-[11px] uppercase tracking-wider text-[var(--fg-dim)]";
const tbodyClass = "divide-y divide-[var(--hairline)]";
const thClass = "px-4 py-3";
const tdClass = "px-4 py-3 align-top";
const tdCodeClass = "px-4 py-3 align-top font-mono text-[var(--fg)]";
const linkClass = "text-[var(--cyan)] hover:underline";

const C = ({ children }: { children: string }) => <code className={codeClass}>{children}</code>;
const Code = ({ lines }: { lines: string[] }) => <pre className={preClass}>{lines.join("\n")}</pre>;

const FIRST_TABLE = ["| Name | Role | Team |", "| --- | --- | --- |", "| Ada | Engineer | Platform |", "| Grace | Reviewer | Docs |"];

const ALIGNMENT_TABLE = ["| Left | Center | Right | Default |", "| :--- | :---: | ---: | --- |", "| a | b | c | d |"];

const ALIGNMENTS: { syntax: string; result: ReactNode }[] = [
  { syntax: ":---", result: <>Left: the cells get <C>align=&quot;left&quot;</C></> },
  { syntax: ":---:", result: <>Center: the cells get <C>align=&quot;center&quot;</C></> },
  { syntax: "---:", result: <>Right: the cells get <C>align=&quot;right&quot;</C></> },
  { syntax: "---", result: "No alignment is set, so the default style applies" },
];

const FENCE_LANGUAGES: { shown: string; names: string }[] = [
  { shown: "Markup", names: "markup, html, xml, svg, mathml" },
  { shown: "CSS", names: "css" },
  { shown: "JavaScript", names: "javascript, js" },
  { shown: "TypeScript", names: "typescript, ts" },
  { shown: "JSON", names: "json" },
  { shown: "Bash", names: "bash, shell, sh" },
];

export default function MakeATableInMarkdownGuidePage() {
  const faqData = guideFaqJsonLd(guide);
  return (
    <>
      {[guideArticleJsonLd(guide), guideHowToJsonLd(guide), guideBreadcrumbJsonLd(guide), ...(faqData ? [faqData] : [])].map((data, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
      ))}
      <article className="mx-auto max-w-4xl w-full px-4 sm:px-6 pt-10 pb-20">
        <nav aria-label="Breadcrumb" className="mb-6 font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
          <Link href="/">Home</Link> <span aria-hidden="true">/</span> <Link href="/guides">Guides</Link> <span aria-hidden="true">/</span> <span className="text-[var(--fg)]">{guide.title}</span>
        </nav>
        <header className="mb-10 pb-8 border-b border-[var(--hairline)]">
          <div className="flex flex-wrap items-center gap-4 mb-4 text-xs font-mono text-[var(--fg-dim)]">
            <span className="inline-flex items-center gap-1.5 text-[var(--green)]"><BookOpen className="w-3 h-3" />{guide.tagline}</span>
            <span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Published {guide.publishedAt}</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{guide.readingTime}</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[var(--fg)] leading-tight">{guide.title}</h1>
          <p className="mt-4 text-[16px] text-[var(--fg-muted)] leading-relaxed">{guide.cardDescription}</p>
          <GuideToolCta guide={guide} />
        </header>

        <div className="space-y-12 text-[15px] text-[var(--fg-muted)] leading-relaxed">
          <section>
            <p>
              <strong className="text-[var(--fg)]">To make a table in Markdown, write a header row, then a separator row of hyphens, then one line for each data row, with a pipe (<code className={codeClass}>|</code>) between the columns.</strong> Paste it into the <Link href="/markdown-preview" className={linkClass}>Markdown Live Preview</Link> to see the table rendered as you type.
            </p>
            <Code lines={FIRST_TABLE} />
            <p className="mt-4">That renders as a table with the headings Name, Role and Team and two rows:</p>
            <div className={tableWrapClass}>
              <table className={tableClass}>
                <thead className={theadClass}><tr><th className={thClass}>Name</th><th className={thClass}>Role</th><th className={thClass}>Team</th></tr></thead>
                <tbody className={tbodyClass}>
                  <tr><td className={tdClass}>Ada</td><td className={tdClass}>Engineer</td><td className={tdClass}>Platform</td></tr>
                  <tr><td className={tdClass}>Grace</td><td className={tdClass}>Reviewer</td><td className={tdClass}>Docs</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4">Tables are part of GitHub Flavored Markdown (GFM). The sections below follow the <a href="https://github.github.com/gfm/" className={linkClass} rel="noopener noreferrer" target="_blank">GFM specification</a> and check each rule in the preview.</p>
          </section>

          <section>
            <h2 className={h2Class}>What are the parts of a Markdown table?</h2>
            <p>A table is a single header row, a separator row (the spec calls it the delimiter row) and zero or more data rows. The separator row is what tells the renderer that the lines above and below it are a table.</p>
            <ul className="mt-4 list-disc pl-6 space-y-2">
              <li><strong className="text-[var(--fg)]">The pipes at the start and end are optional.</strong> <code className={codeClass}>Name | Role</code> over <code className={codeClass}>--- | ---</code> works, but the spec recommends the outer pipes for readability and to avoid ambiguity.</li>
              <li><strong className="text-[var(--fg)]">The pipes do not have to line up.</strong> Spaces between a pipe and the cell content are trimmed, so <code className={codeClass}>|a|b|</code> is the same as a padded row.</li>
              <li><strong className="text-[var(--fg)]">There is no table without a header row.</strong> If you do not want visible headings, leave the header cells empty: <code className={codeClass}>|  |  |</code>.</li>
              <li><strong className="text-[var(--fg)]">A header and separator with no rows is a valid table.</strong> It renders the headings and no body.</li>
            </ul>
          </section>

          <section>
            <h2 className={h2Class}>How do I align the columns?</h2>
            <p>Put a colon at the left end, the right end, or both ends of the hyphens in the separator row:</p>
            <Code lines={ALIGNMENT_TABLE} />
            <div className={tableWrapClass}>
              <table className={tableClass}>
                <thead className={theadClass}><tr><th className={thClass}>In the separator row</th><th className={thClass}>What the preview produces</th></tr></thead>
                <tbody className={tbodyClass}>
                  {ALIGNMENTS.map((a) => (
                    <tr key={a.syntax}><td className={tdCodeClass}>{a.syntax}</td><td className={tdClass}>{a.result}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4">The alignment applies to the heading and to every cell in that column, and it is kept when you use <strong className="text-[var(--fg)]">Copy HTML</strong> in the preview.</p>
          </section>

          <section>
            <h2 className={h2Class}>How do I put a pipe, a link, code or a line break in a cell?</h2>
            <h3 className={h3Class}>A pipe</h3>
            <p>A pipe ends the cell, so write <code className={codeClass}>{"\\|"}</code> for one that belongs in the text. That includes a pipe inside inline code: without the backslash, <code className={codeClass}>{"`a | b`"}</code> is cut into two cells and the backticks are shown as text; with it, the cell holds the code <code className={codeClass}>a | b</code>.</p>
            <Code lines={["| Expression | Meaning |", "| --- | --- |", "| a \\| b | a or b |", "| `a \\| b` | the same, as code |"]} />
            <h3 className={h3Class}>Inline Markdown</h3>
            <p>Bold, italic, inline code, links, images and strikethrough all work in a cell:</p>
            <Code lines={["| Item | Notes |", "| --- | --- |", "| **Bold** | *italic* and `code` |", "| [A link](https://example.com) | ~~old~~ |"]} />
            <h3 className={h3Class}>A line break</h3>
            <p>A row has to stay on one line, so use an HTML <code className={codeClass}>&lt;br&gt;</code> to break a line inside a cell: <code className={codeClass}>| first line&lt;br&gt;second line | x |</code>. The preview keeps the <code className={codeClass}>&lt;br&gt;</code> when it sanitizes the HTML.</p>
            <h3 className={h3Class}>What a cell cannot hold</h3>
            <p>The spec says that block-level elements cannot be inserted in a table. A list, a heading or a code block does not work inside a cell: a cell that starts with <code className={codeClass}>- item</code> shows the text <code className={codeClass}>- item</code>, not a list.</p>
          </section>

          <section>
            <h2 className={h2Class}>What if the rows do not have the same number of cells?</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-[var(--fg)]">A data row with fewer cells</strong> than the header gets empty cells added at the end.</li>
              <li><strong className="text-[var(--fg)]">A data row with more cells</strong> has the extra cells ignored.</li>
              <li><strong className="text-[var(--fg)]">The header and the separator row must have the same number of cells.</strong> If they differ, it is not a table at all, and the lines are shown as ordinary text.</li>
            </ul>
          </section>

          <section>
            <h2 className={h2Class}>Why is my Markdown table not showing up?</h2>
            <p>Check these, most common first:</p>
            <ul className="mt-2 list-disc pl-6 space-y-3">
              <li><strong className="text-[var(--fg)]">There is no separator row.</strong> Without the line of hyphens the rows are plain text. In the preview each line is shown with a line break, which looks like a column of pipes.</li>
              <li><strong className="text-[var(--fg)]">The header and separator have a different number of columns.</strong> <code className={codeClass}>| a | b |</code> over <code className={codeClass}>| --- | --- | --- |</code> is not a table.</li>
              <li><strong className="text-[var(--fg)]">The table is indented four spaces or more.</strong> That makes it an indented code block, and the pipes are shown as code.</li>
              <li><strong className="text-[var(--fg)]">A pipe inside a cell is not escaped.</strong> It splits the cell. Write <code className={codeClass}>{"\\|"}</code>, also inside inline code.</li>
              <li><strong className="text-[var(--fg)]">The next line after the table is not blank.</strong> A line right after the last row becomes another row, with the rest of its cells empty. The spec has this exact case. End the table with a blank line.</li>
              <li><strong className="text-[var(--fg)]">A blank line in the middle of the table.</strong> The table ends at the first blank line, so rows after it are plain text and need their own header and separator.</li>
              <li><strong className="text-[var(--fg)]">There is no blank line before the table.</strong> The preview still renders a table that directly follows a line of text, but the spec does not say what should happen, so leave a blank line before the table to be safe.</li>
            </ul>
            <h3 className={h3Class}>The Table button in the preview</h3>
            <p>The <strong className="text-[var(--fg)]">Table</strong> button in the toolbar inserts a starter table with two columns and one row at the cursor. It adds a blank line before the table and after it where one is missing, so the table stays a table and the text around it stays text. In an empty editor it inserts just the table.</p>
          </section>

          <section>
            <h2 className={h2Class}>Which other GitHub-flavored Markdown features do people use next?</h2>
            <h3 className={h3Class}>Task lists</h3>
            <p>Start a list item with <code className={codeClass}>[ ]</code> for an open task or <code className={codeClass}>[x]</code> for a finished one. They are shown as checkboxes that cannot be clicked:</p>
            <Code lines={["- [x] Write the header row", "- [ ] Add the separator row"]} />
            <h3 className={h3Class}>Strikethrough</h3>
            <p>Wrap the text in two tildes, <code className={codeClass}>~~like this~~</code>. The spec also accepts one tilde, and three or more tildes do not make a strikethrough.</p>
            <h3 className={h3Class}>Fenced code blocks with a language</h3>
            <p>Put the code between lines of three backticks or three tildes, and the name of the language right after the opening fence. A JSON example, once you have <Link href="/guides/format-and-validate-json" className={linkClass}>formatted and validated it</Link>, goes in a block that starts with <code className={codeClass}>```json</code>.</p>
            <p className="mt-4">The Markdown Live Preview highlights these languages. Names are not case sensitive, so <code className={codeClass}>JS</code> works like <code className={codeClass}>js</code>:</p>
            <div className={tableWrapClass}>
              <table className={tableClass}>
                <thead className={theadClass}><tr><th className={thClass}>Language</th><th className={thClass}>Names that work after the fence</th></tr></thead>
                <tbody className={tbodyClass}>
                  {FENCE_LANGUAGES.map((l) => (
                    <tr key={l.shown}><td className={tdClass}>{l.shown}</td><td className={tdCodeClass}>{l.names}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4">Any other language, such as Python, YAML or SQL, is still shown in a code block, just without colors. The preview reads the first word after the opening backticks as the language name, so extra words there, as in <code className={codeClass}>{"```ts title=\"a.ts\""}</code>, do not stop the highlighting.</p>
            <h3 className={h3Class}>Autolinks</h3>
            <p>A plain <code className={codeClass}>https://example.com</code> becomes a link, and so does <code className={codeClass}>www.example.com</code> (its link starts with <code className={codeClass}>http://</code>) and an email address (its link starts with <code className={codeClass}>mailto:</code>). A URL in angle brackets, <code className={codeClass}>&lt;https://example.com&gt;</code>, is a link too.</p>
          </section>

          <section>
            <h2 className={h2Class}>What is different in the Markdown Live Preview?</h2>
            <ul className="list-disc pl-6 space-y-3">
              <li><strong className="text-[var(--fg)]">A single line break becomes a <code className={codeClass}>&lt;br&gt;</code>.</strong> The preview is set to turn every newline inside a paragraph into a line break. GitHub does the same in issues, pull requests, comments and discussions, but not in a <code className={codeClass}>.md</code> file such as a README, where a single newline does not break the line. So text that looks right in the preview can run together in a README. To force a break in a <code className={codeClass}>.md</code> file, end the line with two spaces or a backslash, or use <code className={codeClass}>&lt;br&gt;</code>.</li>
              <li><strong className="text-[var(--fg)]">The HTML is sanitized.</strong> Scripts and inline event handlers such as <code className={codeClass}>onerror</code> are removed before the preview is shown or the HTML is copied.</li>
              <li><strong className="text-[var(--fg)]">There is a toolbar.</strong> Bold, Italic, Code, Link, Image and Table add the syntax at the cursor or around the selected text, and H2 and Task turn the current line into a heading or a task.</li>
              <li><strong className="text-[var(--fg)]">You can take the result with you.</strong> Copy HTML copies the sanitized HTML, Copy Markdown copies the source, and Download .md saves it. A switch changes the preview between light and dark, and the bar below shows the word, character and line counts and the reading time.</li>
              <li><strong className="text-[var(--fg)]">Everything runs in your browser.</strong> Nothing you type is uploaded.</li>
            </ul>
          </section>

          <section>
            <h2 className={h2Class}>Try the Markdown Live Preview</h2>
            <p>Open the <Link href="/markdown-preview" className={linkClass}>Markdown Live Preview</Link>, paste one of the tables above on the left, and watch it render on the right. It starts with a small table and a task list so you can see them straight away. Change a separator row to <code className={codeClass}>:---:</code> to see a column centered, or add a stray pipe to see a cell split.</p>
          </section>

          <section>
            <h2 className={h2Class}>How to make a table in Markdown</h2>
            <div className="space-y-4">{guide.steps.map((step, i) => <div key={step.name} id={`step-${i + 1}`} className="p-5 rounded-lg border border-[var(--hairline)] bg-[var(--bg-raise)] scroll-mt-20"><h3 className="font-display text-lg font-semibold text-[var(--fg)] mb-2">{i + 1}. {step.name}</h3><p>{step.text}</p></div>)}</div>
          </section>

          {guide.faqs && <section className="pt-6 border-t border-[var(--hairline)]"><h2 className="font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--fg-dim)] mb-6">{"// Frequently Asked Questions"}</h2><div className="grid gap-4">{guide.faqs.map((f) => <Faq key={f.q} q={f.q} a={f.a} />)}</div></section>}
          <section className="pt-6 border-t border-[var(--hairline)]"><div className="font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--fg-dim)] mb-3">Keep reading</div><div className="flex flex-wrap gap-3">{relatedGuides.map((related) => <Link key={related.slug} href={related.path} className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--cyan)] hover:underline">{related.title} <ArrowRight className="w-3.5 h-3.5" /></Link>)}</div></section>
        </div>
      </article>
    </>
  );
}
