import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { getGuide } from "@/lib/guides";
import { generateGuideMetadata } from "@/lib/toolMetadata";
import {
  guideArticleJsonLd,
  guideHowToJsonLd,
  guideBreadcrumbJsonLd,
  guideFaqJsonLd,
} from "@/lib/jsonLd";
import { Faq } from "@/components/shared/Faq";
import { GuideToolCta } from "@/components/shared/GuideToolCta";

const guide = getGuide("create-a-professional-invoice")!;

const invoiceFields = [
  {
    field: "Your details",
    include: "Trading name, address, email, phone, and tax ID when registered",
    why: "The client needs to know who is billing them and how to reach you",
  },
  {
    field: "Client details",
    include: "Legal name, billing address, contact, and any purchase order number",
    why: "Large clients route invoices by legal entity and PO reference",
  },
  {
    field: "Invoice number",
    include: "A unique, sequential reference such as 2026-014",
    why: "Makes the invoice traceable and avoids duplicate payments",
  },
  {
    field: "Dates",
    include: "Issue date plus a due date based on your payment terms",
    why: "A due date turns a request into something the client can schedule",
  },
  {
    field: "Line items",
    include: "Description, quantity, rate, and the amount per deliverable",
    why: "The client can match the invoice to the quote or purchase order",
  },
  {
    field: "Totals",
    include: "Subtotal, tax when applicable, and the total due",
    why: "Arithmetic the client has to redo slows down approval",
  },
  {
    field: "Payment instructions",
    include: "Bank details or a payment link in the Notes field, and the currency",
    why: "Removes the back-and-forth that delays a first payment",
  },
  {
    field: "Terms and notes",
    include: "The due date plus notes for a project reference or late-payment policy",
    why: "Sets expectations without needing a separate email",
  },
];

export const metadata: Metadata = generateGuideMetadata(guide);

export default function CreateProfessionalInvoiceGuidePage() {
  const faqData = guideFaqJsonLd(guide);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(guideArticleJsonLd(guide)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(guideHowToJsonLd(guide)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(guideBreadcrumbJsonLd(guide)) }}
      />
      {faqData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
        />
      )}

      <article className="mx-auto max-w-4xl w-full px-4 sm:px-6 pt-10 pb-20">
        {/* Breadcrumb */}
        <div className="mb-6 flex flex-wrap items-center gap-2 font-mono text-[10.5px] tracking-[0.22em] uppercase">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors">
                  Home
                </Link>
              </li>
              <li aria-hidden="true" className="text-[var(--fg-dim)]">
                /
              </li>
              <li>
                <Link href="/guides" className="text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors">
                  Guides
                </Link>
              </li>
              <li aria-hidden="true" className="text-[var(--fg-dim)]">
                /
              </li>
              <li aria-current="page" className="text-[var(--fg)]">
                {guide.title}
              </li>
            </ol>
          </nav>
        </div>

        {/* Header / Hero */}
        <header className="mb-10 pb-8 border-b border-[var(--hairline)]">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider font-medium"
              style={{
                backgroundColor: `color-mix(in srgb, var(${guide.accentVar}) 12%, transparent)`,
                color: `var(${guide.accentVar})`,
              }}
            >
              <BookOpen className="w-3 h-3" />
              {guide.tagline}
            </span>
            <div className="flex items-center gap-4 text-xs font-mono text-[var(--fg-dim)]">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Published {guide.publishedAt}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {guide.readingTime}
              </span>
            </div>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[var(--fg)] leading-tight">
            {guide.title}
          </h1>

          <p className="mt-4 text-[16px] text-[var(--fg-muted)] leading-relaxed">
            {guide.cardDescription}
          </p>

          {/* Interactive tool banner */}
          <GuideToolCta guide={guide} />
        </header>

        {/* Guide Content */}
        <div className="space-y-12">
          {/* Section: Overview */}
          <section>
            <h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">
              What a Professional Invoice Needs
            </h2>
            <div className="text-[15px] text-[var(--fg-muted)] leading-relaxed space-y-4">
              <p>
                You can create a professional invoice for free by recording the work you delivered,
                giving the document a unique number, and exporting a clean PDF. The same details work
                whether you invoice from a document, a spreadsheet, or a browser tool; what changes is
                how much of the arithmetic and layout you have to do by hand.
              </p>
              <p>
                A client usually sees three things before approving an invoice: who is asking to be
                paid, what the payment is for, and when it is due. Missing any of them sends the
                document back for clarification, which is the most common reason a first invoice is
                paid late.
              </p>
            </div>

            <div className="overflow-x-auto my-6 rounded-lg border border-[var(--hairline)]">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--bg-raise)] font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--fg-dim)]">
                  <tr>
                    <th className="px-4 py-3 border-b border-[var(--hairline)]">Field</th>
                    <th className="px-4 py-3 border-b border-[var(--hairline)]">What to include</th>
                    <th className="px-4 py-3 border-b border-[var(--hairline)] hidden md:table-cell">
                      Why it matters
                    </th>
                  </tr>
                </thead>
                <tbody className="text-[var(--fg-muted)]">
                  {invoiceFields.map((row) => (
                    <tr key={row.field} className="border-b border-[var(--hairline)] last:border-0 align-top">
                      <td className="px-4 py-3 font-medium text-[var(--fg)] whitespace-nowrap">{row.field}</td>
                      <td className="px-4 py-3">
                        {row.include}
                        <span className="block mt-1 text-[11px] leading-relaxed text-[var(--fg-dim)] md:hidden">
                          {row.why}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">{row.why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Walkthrough Steps */}
          <section>
            <h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-6">
              Step-by-Step Walkthrough
            </h2>
            <div className="space-y-8">
              {guide.steps.map((step, idx) => (
                <div
                  key={step.name}
                  id={`step-${idx + 1}`}
                  className="relative p-6 rounded-lg border border-[var(--hairline)] bg-[var(--bg-raise)] scroll-mt-20"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--green)]/10 border border-[var(--green)]/30 font-mono text-xs font-bold text-[var(--green)]">
                      {idx + 1}
                    </span>
                    <h3 className="font-display text-lg font-semibold text-[var(--fg)]">
                      {step.name}
                    </h3>
                  </div>
                  <p className="text-[14.5px] text-[var(--fg-muted)] leading-relaxed">
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Tax and payment terms */}
          <section className="p-6 rounded-lg border border-[var(--hairline-strong)] bg-[var(--bg-raise)]">
            <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--sky)] mb-3">
              <ShieldCheck className="w-4 h-4" /> Tax, currency and payment terms
            </div>
            <h3 className="font-display text-xl font-semibold text-[var(--fg)] mb-3">
              Keep the Tax Section Simple and Local
            </h3>
            <div className="text-[14.5px] text-[var(--fg-muted)] leading-relaxed space-y-3">
              <p>
                Tax rules differ by country, by the type of work, and by whether you are registered for
                VAT, GST, or sales tax. This guide is general information rather than tax advice. In
                many places an invoice shows the tax rate and amount as a separate line and includes a
                tax registration number when the seller is required to have one.
              </p>
              <p>
                If you are unsure whether to add tax, what rate applies, or what wording your client
                needs, check with a local accountant or the tax authority before sending the invoice.
                Changing a tax line after the client has booked it usually means issuing a credit note
                and a replacement invoice.
              </p>
              <p>
                Use one currency per invoice and state it next to the totals. For payment terms, Net 14
                or Net 30 are common, but the important part is that the due date is explicit and
                matches what you agreed. Late fees belong on the invoice only when your contract allows
                them and local law permits them.
              </p>
            </div>
          </section>

          {/* Section: Common mistakes */}
          <section>
            <h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">
              Common Invoice Mistakes to Avoid
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded border border-[var(--hairline)] bg-[var(--bg-raise)]">
                <div className="flex items-center gap-2 font-mono text-xs font-semibold text-red-400 mb-2">
                  <span className="w-2 h-2 rounded-full bg-red-400" /> Details that delay payment
                </div>
                <ul className="text-xs text-[var(--fg-muted)] space-y-1.5 list-disc list-inside">
                  <li>Reusing an invoice number, or leaving one out entirely</li>
                  <li>Line items that do not match the quote the client approved</li>
                  <li>Mixing currencies, or leaving the currency unstated</li>
                  <li>No bank details, payment link, or due date</li>
                </ul>
              </div>
              <div className="p-4 rounded border border-[var(--hairline)] bg-[var(--bg-raise)]">
                <div className="flex items-center gap-2 font-mono text-xs font-semibold text-[var(--green)] mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Checks before sending
                </div>
                <ul className="text-xs text-[var(--fg-muted)] space-y-1.5 list-disc list-inside">
                  <li>Add the line items again and confirm the subtotal</li>
                  <li>Check the due date against the agreed payment terms</li>
                  <li>Open the exported PDF and read it as the client would</li>
                  <li>Send a PDF, not an editable document that can reflow</li>
                </ul>
              </div>
            </div>
            <p className="mt-4 text-[14px] text-[var(--fg-muted)] leading-relaxed">
              The Invoice Generator handles the numbering, totals and PDF layout in the browser, so the
              remaining checks are about matching the invoice to what was agreed.
            </p>
          </section>

          {/* Section: FAQ */}
          {guide.faqs && guide.faqs.length > 0 && (
            <section className="pt-6 border-t border-[var(--hairline)]">
              <h2 className="font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--fg-dim)] mb-6">
                &#47;&#47; Frequently Asked Questions
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {guide.faqs.map((f) => (
                  <Faq key={f.q} q={f.q} a={f.a} />
                ))}
              </div>
            </section>
          )}

          {/* Related Tools Navigation */}
          <section className="pt-6 border-t border-[var(--hairline)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
                Next Steps
              </div>
              <div className="font-display text-base font-semibold text-[var(--fg)] mt-1">
                Make the invoice in your browser
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/invoice-generator"
                className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--green)] hover:underline"
              >
                Invoice Generator <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <span className="text-[var(--hairline-strong)]">·</span>
              <Link
                href="/guides"
                className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--fg-muted)] hover:text-[var(--fg)]"
              >
                All guides <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>
        </div>
      </article>
    </>
  );
}
