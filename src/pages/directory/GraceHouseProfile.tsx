import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CANONICAL, formatTime } from '../../policy/canonical'

const STAGES = [
  '1 · Before You Apply',
  '2 · Application Stage',
  '3 · Interview & Intake',
  '4 · Move-In & Orientation',
  '5 · Community Life & Policies',
  '6 · Program Fees',
]

type Doc = { no: number; name: string; desc: string }

function DocList({ docs }: { docs: Doc[] }) {
  return (
    <div className="mt-3 space-y-2">
      {docs.map((d) => (
        <div key={d.no} className="flex items-center gap-4 rounded-xl border border-[#e4dce8] bg-[#fdfbfe] p-3.5 hover:border-[#8e4585]">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-[#5b2c6f] font-serif font-bold text-white">{d.no}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-[#3e1d4c]">{d.name}</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-[#7a6e82]">{d.desc}</span>
          </span>
          <a
            className="whitespace-nowrap rounded-lg border-[1.5px] border-[#5b2c6f] px-3 py-1.5 text-xs font-bold text-[#5b2c6f] hover:bg-[#efe8f3]"
            href={`mailto:gracehouse@graceforaddictions.org?subject=${encodeURIComponent('Document request: ' + d.name)}`}
          >
            Request a copy
          </a>
        </div>
      ))}
    </div>
  )
}

/**
 * Grace House public profile: the full staged application process, every
 * document named up front. Curfew and fee values render from the canonical
 * policy mirror (GH-CURFEW-001 / GH-FEES-001) — never hand-copied.
 * Documents are provided by email/at the house until the portal document
 * library ships; nothing links to a file that does not exist.
 */
export function GraceHouseProfile() {
  const [stage, setStage] = useState(0)
  const fees = CANONICAL.fees
  const phases = CANONICAL.curfew.phases

  return (
    <div className="min-h-screen bg-[#faf7f2] text-[#2a2230]">
      <div className="bg-gradient-to-br from-[#3e1d4c] to-[#5b2c6f] py-10 text-white">
        <div className="mx-auto max-w-5xl px-5">
          <Link to="/" className="text-sm font-bold text-white/70 hover:text-[#d4a017]">
            ← RecoveryResidence / Grace House
          </Link>
          <h1 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">Grace House Application Process</h1>
          <p className="mt-2 max-w-3xl leading-relaxed text-white/85">
            A women's recovery residence operated by Grace For Addictions ·{' '}
            {CANONICAL.contact.address}. The process below walks you through every stage from first
            look to move-in — including each document you'll review and sign, in order.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5 pb-12">
        <div className="mt-6 rounded-xl border border-[#e2c9de] bg-[#f3e6f1] p-4 text-sm text-[#3e1d4c]">
          <b className="text-[#8e4585]">Click each stage tab to review the documents for that stage.</b>{' '}
          Every document is named before you apply — nothing is a surprise at Grace House. Copies
          are provided by email request and at the house; the online document library is coming to
          the resident portal.
        </div>

        <div className="mt-7 flex flex-wrap gap-2" role="tablist" aria-label="Application stages">
          {STAGES.map((s, i) => (
            <button
              key={s}
              role="tab"
              aria-selected={stage === i}
              onClick={() => setStage(i)}
              className={`rounded-lg border-[1.5px] px-4 py-2.5 text-sm font-bold ${
                stage === i
                  ? 'border-[#5b2c6f] bg-[#5b2c6f] text-white'
                  : 'border-[#e4dce8] bg-white text-[#2a2230] hover:border-[#8e4585] hover:text-[#8e4585]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-[#e4dce8] bg-white p-7 shadow-sm [&_h3]:font-serif [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-[#5b2c6f] [&_h4]:mt-5 [&_h4]:font-serif [&_h4]:text-[#8e4585] [&_li]:mb-2 [&_li]:leading-relaxed [&_p]:leading-relaxed [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">
          {stage === 0 && (
            <div>
              <h3>Before You Apply</h3>
              <p className="mt-2">The three primary components of getting to know Grace House before applying:</p>
              <ul>
                <li>First, read the <b>Resident Handbook</b> to understand daily life, the three-phase program structure, recovery activity expectations, and the community you'd be joining.</li>
                <li>Second, review the <b>Code of Conduct</b> to ensure you can commit to the community standards every resident lives by.</li>
                <li>Third, review the <b>Fee Schedule</b> so program costs are clear before you ever fill out a form. Hardship payment plans are always available.</li>
              </ul>
              <h4>Eligibility — Two Pathways</h4>
              <ul>
                <li><b>Recovery pathway:</b> a personal history of substance use or misuse and a commitment to living substance-free while in residence.</li>
                <li><b>Family pathway:</b> a parent, partner, or child with a history of substance use disorder or mental-health-related trauma, where structured recovery-supportive housing supports the family's healing.</li>
              </ul>
              <p className="mt-2">Grace House is MAT/MOUD-affirming — prescribed medication is never a barrier to admission. All recovery pathways are honored, and you choose your own treatment providers.</p>
              <h4>Stage 1 Documents</h4>
              <DocList docs={[
                { no: 1, name: 'Grace House Resident Handbook', desc: 'Complete guide to community life: program philosophy, phases, curfew, recovery activities, coaching, and your rights.' },
                { no: 2, name: 'Code of Conduct', desc: 'The community standards every resident commits to — grace-centered, with safety standards that protect everyone.' },
                { no: 3, name: 'Fee Schedule & Financial Agreement', desc: `Shared room $${fees.doubleSharedRoom.weekly}/week or $${fees.doubleSharedRoom.monthlyPrepaidInFull}/month prepaid · Single room $${fees.singlePrivateRoom.weekly}/week or $${fees.singlePrivateRoom.monthlyPrepaidInFull}/month prepaid. Hardship provisions included.` },
              ]} />
            </div>
          )}

          {stage === 1 && (
            <div>
              <h3>Application Stage</h3>
              <p className="mt-2">The application is not difficult, but it is thorough — because we take your future seriously. Submit it one of two ways:</p>
              <ul>
                <li>Complete the <b>online application</b> (button at the bottom of this page), or</li>
                <li><b>Request, complete, and return</b> the paper form to Grace House in person or by email to gracehouse@graceforaddictions.org.</li>
              </ul>
              <p className="mt-2">Upon receipt of your completed application, a member of the Grace House team will contact you within <b>2 business days</b> to review your submission and schedule an interview. If a bed is not currently available, you may choose to join the waitlist — we'll keep in contact with you at least every two weeks.</p>
              <h4>Stage 2 Documents</h4>
              <DocList docs={[
                { no: 4, name: 'Application & Pre-Screening Form', desc: 'Applicant information, eligibility pathway selection, recovery & support history, safety screening, and your goals — in your own words.' },
              ]} />
              <p className="mt-4 rounded-lg bg-[#faf7f2] p-3 text-sm text-[#7a6e82]">
                Applying does not obligate you to anything. Admission decisions are made without regard to race, color, religion, national origin, disability, or any other protected status, in full compliance with the Fair Housing Act.
              </p>
            </div>
          )}

          {stage === 2 && (
            <div>
              <h3>Interview &amp; Intake</h3>
              <p className="mt-2">Your interview is a two-way conversation — we learn about you, and you learn whether Grace House feels like home. If it's the right fit, intake follows, where you complete the full intake packet and sign your Participant Agreement.</p>
              <ul>
                <li>The <b>Intake Forms Package</b> gathers your full picture: assessment, emergency contacts, medication disclosure (MAT/MOUD fully supported), releases of information for providers <i>you</i> choose, and communication preferences.</li>
                <li>The <b>Participant Agreement</b> is a program participation agreement — <b>not a lease</b>. It covers your phase structure, recovery activity requirements (4/week Phase 1 · 3/week Phase 2 · 2/week Phase 3), coach selection with daily check-ins, and your rights.</li>
                <li>At intake you will also <b>select a life coach or recovery coach</b> — every participant has one from day one.</li>
              </ul>
              <h4>Stage 3 Documents</h4>
              <DocList docs={[
                { no: 5, name: 'Intake Forms Package', desc: 'Comprehensive intake: assessment, consents, releases of information, emergency contact & medical consent, communication preferences, orientation checklist.' },
                { no: 6, name: 'Participant Agreement', desc: 'Your program participation agreement — phases, expectations, rights, and accountability with grace. Not a residential lease.' },
                { no: 7, name: 'Medication & MAT/MOUD Policy', desc: 'All FDA-approved medications supported. Storage, disclosure log, and prescription-consistent screening protections.' },
                { no: 8, name: 'Drug & Alcohol Screening Policy & Consent', desc: 'When and how screening happens, dignity standards, and why a positive result opens a support conversation — not automatic discharge.' },
              ]} />
            </div>
          )}

          {stage === 3 && (
            <div>
              <h3>Move-In &amp; Orientation</h3>
              <p className="mt-2">Move-in day includes a guided orientation with your House Manager. You'll walk the house, meet the community, locate safety equipment (including naloxone stations), and review the policies that shape daily life:</p>
              <ul>
                <li>
                  <b>Curfew &amp; Pass Policy</b> — phase-based curfew:{' '}
                  {phases.map((p, i) => (
                    <span key={p.phase}>
                      Phase {p.phase}: {formatTime(p.sunThu)} Sun–Thu / {formatTime(p.friSat)} Fri–Sat{i < phases.length - 1 ? ' · ' : ''}
                    </span>
                  ))}
                  . Curfew extensions for work, medical, treatment, court, and recovery activities; overnight pass requests after 60 days in good standing.
                </li>
                <li><b>Good Neighbor Policy</b> — how we show up for our neighborhood.</li>
                <li><b>Emergency Response Protocols</b> — posted in common areas; reviewed with every resident.</li>
              </ul>
              <h4>Stage 4 Documents</h4>
              <DocList docs={[
                { no: 9, name: 'Curfew & Pass Policy + Request Form', desc: 'Phase-based curfew table (never past midnight), extension rules, and the overnight pass / leave request form.' },
                { no: 10, name: 'Good Neighbor Policy', desc: 'Property care, quiet hours, parking, and how neighbor concerns are received and resolved.' },
                { no: 11, name: 'Emergency Response Protocols', desc: 'Step-by-step response for medical emergencies, overdose (naloxone), mental health crises, and safety events.' },
              ]} />
            </div>
          )}

          {stage === 4 && (
            <div>
              <h3>Community Life &amp; Policies</h3>
              <p className="mt-2">These policies govern life at Grace House after move-in — your voice, your protections, and the standards our staff and leaders hold themselves to. Each is available to you at all times, posted or in the house document library and the portal.</p>
              <h4>Your Voice &amp; Protections</h4>
              <DocList docs={[
                { no: 12, name: 'Grievance Policy & Form', desc: 'Your right to be heard: anonymous filing honored, acknowledgment in 2 business days, no retaliation — ever.' },
                { no: 13, name: 'Return-to-Use Response Policy', desc: 'A return to use is a medical and recovery event — not a moral failure and not automatic discharge. Safety first, dignity always.' },
                { no: 14, name: 'Incident Report System', desc: 'How safety events are documented, reviewed, and learned from — with confidentiality protections.' },
                { no: 15, name: 'Exit & Transition Policy', desc: 'Completion, voluntary exit, and administrative removal — every exit handled with dignity and a door that stays open.' },
              ]} />
              <h4>Leadership &amp; Standards</h4>
              <DocList docs={[
                { no: 16, name: 'Code of Ethics — Staff, House Leads & Volunteers', desc: "The commitments every person serving Grace House signs: residents' interests first, boundaries, confidentiality, no exploitation." },
                { no: 17, name: 'Change Course Leaders Policy', desc: 'Change Course is an independent partner program with Leaders only. Grace House asks CC Leaders to add two supportive activities weekly alongside all Change Course requirements.' },
                { no: 18, name: 'NARR Level II Self-Assessment & Iowa HHS Alignment', desc: 'Our readiness self-assessment. Grace House is preparing for NARR Level II certification through the Iowa HHS process.' },
              ]} />
            </div>
          )}

          {stage === 5 && (
            <div>
              <h3>Program Fees</h3>
              <p className="mt-2">Program fees cover housing, utilities, household supplies, and program participation. Grace House uses a program participation fee model — not a residential lease. All fees are disclosed here, in advance, before you apply.</p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[28rem] text-sm">
                  <thead>
                    <tr className="bg-[#5b2c6f] text-left text-xs uppercase tracking-wide text-white">
                      <th className="p-3">Room Type</th>
                      <th className="p-3">Weekly Rate</th>
                      <th className="p-3">Monthly Prepay (in full, at start of month)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[#e4dce8]">
                      <td className="p-3 font-bold text-[#8e4585]">Shared (double) room</td>
                      <td className="p-3">${fees.doubleSharedRoom.weekly} / week</td>
                      <td className="p-3">${fees.doubleSharedRoom.monthlyPrepaidInFull} / month</td>
                    </tr>
                    <tr className="border-b border-[#e4dce8] bg-[#faf7f2]">
                      <td className="p-3 font-bold text-[#8e4585]">Single (private) room</td>
                      <td className="p-3">${fees.singlePrivateRoom.weekly} / week</td>
                      <td className="p-3">${fees.singlePrivateRoom.monthlyPrepaidInFull} / month</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <h4>Fee Principles</h4>
              <ul>
                <li><b>Hardship plans are always available</b> — talk with the House Manager before a due date, never after. Payment plans are never punitive.</li>
                <li>Fees continue during an approved leave (your bed is held).</li>
                <li>Grace House never manages, holds, or controls your personal finances.</li>
                <li>Receipts are issued for every payment.</li>
              </ul>
              <p className="mt-4 rounded-lg bg-[#faf7f2] p-3 text-sm text-[#7a6e82]">
                Deposit and refund terms are pending a leadership decision (GH-D004) and will be published in the Fee Schedule &amp; Financial Agreement once resolved — they are never invented here.
              </p>
            </div>
          )}
        </div>

        <div className="mt-9 rounded-2xl bg-gradient-to-br from-[#5b2c6f] to-[#8e4585] p-9 text-center text-white">
          <h3 className="font-serif text-2xl font-semibold">Ready to Apply to Grace House?</h3>
          <p className="mx-auto mt-2 max-w-xl leading-relaxed text-white/90">
            Thank you for considering Grace House as your next chapter. Once you've reviewed the
            stages above, you're prepared to complete the application. You belong here.
          </p>
          <Link to="/apply/grace-house" className="mt-5 inline-block rounded-xl bg-[#d4a017] px-6 py-3 font-bold text-[#3e2a05] hover:bg-[#e3b02e]">
            ONLINE APPLICATION
          </Link>
          <p className="mt-4 text-sm text-white/80">
            Prefer paper? Email gracehouse@graceforaddictions.org for the printable form · Questions? Call {CANONICAL.contact.officePhone}
          </p>
        </div>
      </div>
    </div>
  )
}
