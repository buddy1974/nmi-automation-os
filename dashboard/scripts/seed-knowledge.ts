/**
 * seed-knowledge.ts
 * Seeds 8 foundational NMI knowledge base documents.
 * Run: npx tsx scripts/seed-knowledge.ts
 */
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaNeon }   from "@prisma/adapter-neon"

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma  = new PrismaClient({ adapter })

const DOCS = [
  {
    title:    "NMI HR Policy — Working Hours & Leave",
    category: "HR",
    tags:     "leave, working hours, sick leave, annual leave, CNPS",
    source:   "HR Department",
    content: `NMI EDUCATION — HR POLICY

WORKING HOURS
Standard working hours are 8:00 AM to 5:00 PM, Monday to Friday. One hour is allocated for lunch (12:00–13:00). Employees are expected to be punctual. Repeated lateness (more than 3 incidents per month) will be flagged in the performance review.

ANNUAL LEAVE
All permanent staff (CDI) are entitled to 18 working days of paid annual leave per calendar year. Leave must be requested at least 2 weeks in advance and approved by the line manager. Unused leave may not be carried over beyond 5 days.

SICK LEAVE
Employees are entitled to 10 days of paid sick leave per year. A medical certificate is required for absences of 2 or more consecutive days. Sick leave beyond 10 days will be unpaid unless covered by CNPS benefits.

CNPS REGISTRATION
All CDI and CDD contract employees must be registered with CNPS (Caisse Nationale de Prévoyance Sociale) within 30 days of hiring. The HR department is responsible for initiating registration. Failure to register may result in compliance penalties.

MATERNITY & PATERNITY LEAVE
Maternity leave: 14 weeks (paid). Paternity leave: 10 days (paid). Both must be declared to HR at least 4 weeks in advance.`,
  },
  {
    title:    "Royalty Policy — Author Payments",
    category: "Finance",
    tags:     "royalties, authors, payments, contract, percentage",
    source:   "Finance Department",
    content: `NMI EDUCATION — ROYALTY POLICY

ROYALTY RATE
Authors whose works are published by NMI Education receive a royalty of 10% of net sales revenue for their title. Net sales is defined as gross sales minus distributor discounts and returns.

PAYMENT SCHEDULE
Royalties are calculated and paid quarterly:
- Q1 (Jan–Mar): paid by April 30
- Q2 (Apr–Jun): paid by July 31
- Q3 (Jul–Sep): paid by October 31
- Q4 (Oct–Dec): paid by January 31 of the following year

REQUIREMENTS
A signed author contract must be on file before any royalty is paid. Authors must provide valid bank account details or mobile money information. Payments below 5,000 XAF in a quarter are rolled over to the next period.

CONTRACT REQUIREMENT
No royalty is payable without a signed publishing agreement. The agreement must specify the title, royalty rate, payment terms, and exclusivity period. Unsigned manuscripts will not be processed for royalty calculation.

DISPUTE RESOLUTION
Any royalty dispute must be raised in writing within 60 days of the payment date. The Finance Department will investigate and respond within 15 business days.`,
  },
  {
    title:    "Editorial Process — From Submission to Print",
    category: "Editorial",
    tags:     "editorial, manuscript, submission, review, publishing process",
    source:   "Editorial Department",
    content: `NMI EDUCATION — EDITORIAL PROCESS

STEP 1 — SUBMISSION
Authors submit manuscripts via email to editorial@nmi-education.cm or in person at the editorial office. Submissions must include: full manuscript (Word or PDF), author bio, target audience (level and class), and a 1-page synopsis.

STEP 2 — INITIAL REVIEW (2 weeks)
The editorial team performs an initial review within 2 weeks of receipt. Manuscripts are assessed for educational value, curriculum alignment, language quality, and originality. Authors receive written feedback whether accepted or rejected.

STEP 3 — EDITING
Accepted manuscripts undergo content editing, copyediting, and proofreading. The author is given 2 revision rounds. The editing phase typically takes 3–6 weeks depending on manuscript length.

STEP 4 — DESIGN & LAYOUT
After final editing approval, the manuscript is sent to the design team for layout, cover design, and illustration (if required). Design takes 2–4 weeks.

STEP 5 — PRINT APPROVAL
A proof copy is sent to the author and editorial director for final approval. Any corrections must be submitted within 5 business days. Once approved, the file is sent to the printer.

STEP 6 — PRINTING
Standard print run is 1,000–5,000 copies depending on projected demand. Turnaround from file submission to delivery is 3 weeks. Quality checks are performed before distribution.`,
  },
  {
    title:    "Distribution Policy — Regional Sales Network",
    category: "Distribution",
    tags:     "distributors, regions, orders, payment terms, minimum order",
    source:   "Sales Department",
    content: `NMI EDUCATION — DISTRIBUTION POLICY

DISTRIBUTOR NETWORK
NMI Education operates through 10 regional distributors covering all major regions of Cameroon including Douala, Yaoundé, Bafoussam, Bamenda, Garoua, Maroua, Ngaoundéré, Bertoua, Ebolowa, and Buea.

MINIMUM ORDER
The minimum order quantity per title per distributor is 50 copies. Orders below this threshold will not be processed. Combined multi-title orders may qualify for exceptions with prior approval from the Sales Manager.

PAYMENT TERMS
Distributors have 30 days from invoice date to remit payment. Accounts overdue beyond 30 days are placed on hold — no new shipments until balance is cleared. Accounts overdue beyond 60 days are referred to the Finance team for collection action.

DISTRIBUTOR DISCOUNT
Registered distributors receive a standard trade discount of 30% off the recommended retail price. Volume discounts (additional 5%) apply for orders exceeding 500 copies per title.

NEW DISTRIBUTOR ONBOARDING
New distributors must complete an application form, provide business registration documents, and sign a Distribution Agreement. The Sales Manager approves all new distributor applications.`,
  },
  {
    title:    "Printing Standards & Quality Requirements",
    category: "Printing",
    tags:     "printing, quality, turnaround, specifications, minimum run",
    source:   "Production Department",
    content: `NMI EDUCATION — PRINTING STANDARDS

MINIMUM PRINT RUN
The minimum print run for any NMI title is 1,000 copies. Smaller runs are not economically viable and will not be approved by the editorial board. Reprints follow the same minimum requirement.

TURNAROUND TIME
Standard turnaround from approved print-ready file to delivery is 3 weeks. Rush orders (under 2 weeks) incur a 25% surcharge and require approval from the Production Manager.

FILE SPECIFICATIONS
Print-ready files must be supplied as PDF/X-1a, minimum 300 DPI for images, CMYK colour mode, with crop marks and 3mm bleed on all sides. Cover files must be supplied separately from interior pages.

QUALITY CHECK
All print jobs undergo a quality inspection before distribution:
- Cover lamination check
- Binding strength test (minimum 500 flex cycles)
- Page count verification
- Colour consistency check against approved proof

Any batch failing quality checks is reprinted at the printer's cost if the error is attributable to the printer, or at NMI's cost if the error is in the supplied files.

APPROVED PRINTERS
NMI works exclusively with approved printing partners who have signed the NMI Quality Agreement. All new printer partnerships require approval from the CEO.`,
  },
  {
    title:    "Sales Policy — Schools & Institutional Clients",
    category: "Sales",
    tags:     "sales, schools, discount, payment, institutional, orders",
    source:   "Sales Department",
    content: `NMI EDUCATION — SALES POLICY

SCHOOL DISCOUNTS
Schools and educational institutions that place orders of 100 copies or more per title receive a 15% discount off the standard retail price. Government schools may qualify for an additional 5% subsidy discount with a valid official purchase order.

PAYMENT TERMS
Institutional clients (schools, government bodies) have 30 days from invoice date to pay. Individual cash sales are due immediately. Cheque payments are accepted but goods are only released after cheque clearance (3–5 business days).

MINIMUM ORDER — DIRECT SALES
Direct sales to schools have no minimum order quantity. However, orders below 10 copies per title are subject to a handling fee of 500 XAF per order.

CREDIT ACCOUNTS
Schools with a strong payment history (12+ months, zero late payments) may apply for a credit account with a limit set by the Finance Manager. Credit accounts are reviewed annually.

RETURNS POLICY
Damaged or defective items may be returned within 14 days of delivery for a full replacement. No returns are accepted for change of mind or surplus stock.

INVOICING
All sales generate an official invoice with VAT. Invoices are issued by the Finance Department within 24 hours of order confirmation. Duplicate invoices are available on request.`,
  },
  {
    title:    "Staff Code of Conduct",
    category: "HR",
    tags:     "conduct, behaviour, confidentiality, dress code, professionalism",
    source:   "HR Department",
    content: `NMI EDUCATION — STAFF CODE OF CONDUCT

PUNCTUALITY
Employees are expected to arrive on time and ready to work. Lateness of more than 15 minutes without prior notice is recorded as a late arrival. More than 3 late arrivals in a month triggers a formal warning.

PROFESSIONAL DRESS
All staff must dress professionally and appropriately for a business environment. Smart casual or formal attire is required. Clothing with offensive slogans, excessive casualwear (shorts, flip-flops), or torn clothing is not permitted.

CONFIDENTIALITY
All staff have a duty to protect confidential business information including financial data, client lists, author contracts, salary information, and unreleased titles. Sharing confidential information externally without authorisation is grounds for immediate dismissal.

WORKPLACE RESPECT
NMI Education is committed to a respectful, harassment-free workplace. Discrimination based on gender, ethnicity, religion, or age will not be tolerated. Any incident must be reported to HR immediately.

USE OF COMPANY RESOURCES
Company computers, internet, and phones are for business use. Limited personal use is permitted provided it does not interfere with work duties. Downloading unlicensed software or accessing inappropriate content on company devices is prohibited.

SOCIAL MEDIA
Staff must not post confidential company information, client data, or negative commentary about NMI Education on social media. Violations are subject to disciplinary action.`,
  },
  {
    title:    "Author Contract Terms — Standard Agreement",
    category: "Legal",
    tags:     "contract, authors, exclusivity, ISBN, rights, publishing agreement",
    source:   "Legal / Editorial Department",
    content: `NMI EDUCATION — AUTHOR CONTRACT TERMS

EXCLUSIVITY
Authors grant NMI Education exclusive publishing rights for the contracted title for a period of 2 years from the date of first publication. During this period, the author may not publish the same work, or a substantially similar work, with any other publisher.

ISBN REGISTRATION
NMI Education is responsible for obtaining the ISBN (International Standard Book Number) for all published titles. The ISBN is registered in NMI's name as the publisher. Authors are provided with the ISBN for their records.

PRINT RUN DECISION
The size of the initial print run is determined by the NMI editorial board based on projected market demand, curriculum alignment, and available budget. Authors are informed of the planned print run before signing but do not have the right to override the editorial board's decision.

RIGHTS RETAINED BY AUTHOR
Authors retain the moral rights to their work, including the right to be credited as the author. NMI may not modify the content materially without the author's written consent.

ROYALTY REFERENCE
Royalty rates and payment schedules are governed by the NMI Royalty Policy (see separate document). The standard rate is 10% of net sales, paid quarterly.

TERMINATION
Either party may terminate the contract with 3 months written notice after the 2-year exclusivity period. Upon termination, all rights revert to the author. NMI retains the right to sell existing printed stock until exhausted.

CONTRACT AMENDMENTS
Any amendments to the standard contract must be agreed in writing and signed by both parties. Verbal agreements are not binding.`,
  },
]

async function main() {
  console.log("── Seeding Knowledge Base ─────────────────────────────────────")

  let created = 0
  for (const doc of DOCS) {
    const exists = await prisma.knowledgeDoc.findFirst({ where: { title: doc.title } })
    if (exists) {
      console.log(`  Already exists: ${doc.title}`)
      continue
    }
    await prisma.knowledgeDoc.create({
      data: { ...doc, createdBy: "System Seed", active: true },
    })
    console.log(`✓ Created: ${doc.title}`)
    created++
  }

  console.log(`\nDone — ${created} new docs created, ${DOCS.length - created} already existed.`)
}

main()
  .catch(err => { console.error("❌ Seed failed:", err); process.exit(1) })
  .finally(() => prisma.$disconnect())
