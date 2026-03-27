"use client";

// =========================
// Adult Content Agreement
// Copy the ADULT_CONTENT_AGREEMENT string into WriterAgreements.tsx
// File: app/components/AdultContentAgreement.tsx
// =========================

export const ADULT_CONTENT_AGREEMENT = `THE TINIEST LIBRARY — ADULT CONTENT AGREEMENT
Document Version: v1.0
Effective Date: 2026

This agreement is an addendum to the TTL Copyright Agreement and Plagiarism Clause. It applies specifically to writers who submit content to the Adult 18+ genre section of The Tiniest Library. By signing, you agree to all terms below IN ADDITION to the standard writer agreements.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ELIGIBILITY TO SUBMIT ADULT CONTENT

You confirm that:

(a) You are 18 years of age or older;
(b) You have the legal right to create and distribute adult content in your jurisdiction;
(c) You understand that adult content submissions are subject to additional review and may be rejected at TTL's sole discretion;
(d) You accept full legal and moral responsibility for the content you submit to the Adult 18+ section.

2. ABSOLUTE PROHIBITION — MINORS

This is the most important section of this agreement. Read it carefully.

(a) ALL characters depicted in sexual, romantic, suggestive, or intimate situations MUST be 18 years of age or older — explicitly stated or unambiguously implied within the text;

(b) Age ambiguity is NOT permitted. If a character's age is unclear, they must be written and described as an adult. TTL will not accept "they could be 18" as a defense;

(c) The following are strictly and absolutely prohibited with zero exceptions:
   — Sexual content involving characters under 18
   — Romantic content involving characters under 18 in sexual contexts
   — Suggestive content that sexualizes characters under 18
   — Any content that depicts, implies, romanticizes, or normalizes sexual interest in minors
   — Aged-up versions of canonically minor characters in sexual situations

(d) Violation of this section results in:
   — Immediate and permanent removal of all content
   — Immediate and permanent account termination
   — Reporting to relevant law enforcement and platform-safety authorities
   — No appeal process

This prohibition is non-negotiable. It applies regardless of fictional framing, fantasy context, or claimed artistic intent.

3. PERMITTED ADULT CONTENT

The following content is permitted in the Adult 18+ section when all characters are adults:

(a) Explicit sexual content between consenting adults;
(b) Graphic violence with narrative purpose;
(c) Strong language without restriction;
(d) Dark themes including abuse, trauma, addiction, and psychological horror — provided they are handled with craft and are not gratuitous without purpose;
(e) Non-consensual scenarios — provided they are clearly framed as morally wrong within the narrative and not presented as fantasy fulfillment without consequence.

4. CONTENT THAT REMAINS PROHIBITED EVEN IN ADULT 18+

Regardless of the Adult 18+ designation, the following remain absolutely prohibited:

(a) Child sexual abuse material (CSAM) of any kind, fictional or otherwise;
(b) Content that instructs, facilitates, or encourages real-world violence against specific individuals;
(c) Content designed to harass, defame, or harm a real, identifiable person;
(d) Content that violates applicable laws in the United States or the writer's jurisdiction.

5. TTL'S RIGHTS AND RESPONSIBILITIES

(a) TTL reserves the right to review, remove, or reject any Adult 18+ content at any time without notice or explanation;
(b) TTL will not publish Adult 18+ content to underage readers — the section requires age verification;
(c) TTL will cooperate fully with law enforcement in any investigation involving prohibited content;
(d) TTL does not endorse the content in the Adult 18+ section — it is published under the sole responsibility of the submitting writer.

6. WRITER'S ONGOING OBLIGATIONS

(a) You agree to review your submitted content periodically and remove or update anything that no longer meets these guidelines;
(b) You agree to notify TTL immediately if you become aware that any of your content may violate these terms;
(c) You agree that these obligations survive the termination of your writer account.

7. ACKNOWLEDGMENT

By signing below, you confirm:

(a) You have read this Adult Content Agreement in its entirety;
(b) You are 18 years of age or older;
(c) You understand and accept the absolute prohibition on content involving minors;
(d) You accept full legal responsibility for your Adult 18+ submissions;
(e) Your typed name below constitutes a legally binding electronic signature under the ESIGN Act.

This agreement is in addition to — not a replacement for — the TTL Plagiarism Clause and Copyright Agreement.`;


// =========================
// HOW TO ADD TO WriterAgreements.tsx
// =========================
//
// STEP 1 — Import at the top of WriterAgreements.tsx:
// import { ADULT_CONTENT_AGREEMENT } from "./AdultContentAgreement";
//
// STEP 2 — Add "adult" to the Step type:
// type Step = "plagiarism" | "plagiarism-done" | "copyright" | "copyright-done" | "adult" | "adult-done" | "all-done";
//
// STEP 3 — Add showAdult prop to WriterAgreements:
// export default function WriterAgreements({ showAdult = false }: { showAdult?: boolean })
//
// STEP 4 — Add adultSigned state:
// const [adultSigned, setAdultSigned] = useState(false);
//
// STEP 5 — Check localStorage on mount:
// const a = localStorage.getItem("ttl_adult_signed");
// if (a) setAdultSigned(true);
//
// STEP 6 — After copyright-done, if showAdult and !adultSigned go to "adult" step
//
// STEP 7 — Add adult doc step JSX using ADULT_CONTENT_AGREEMENT string
//          Same pattern as plagiarism/copyright steps
//          On sign: save to Supabase with document_type: "adult-content"
//          Set localStorage: "ttl_adult_signed"
//
// STEP 8 — In writer dashboard (app/dashboard/page.tsx):
// <WriterAgreements showAdult={profile.genres?.includes("Adult 18+")} />

export default function AdultContentAgreementInfo() {
  return null;
}
