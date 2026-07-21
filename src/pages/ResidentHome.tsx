import { useActivePolicies, CANONICAL } from '../policy/usePolicies'
import { formatTime, visitorDeparture, type CurfewPhase } from '../policy/canonical'

/**
 * Every value on this screen renders from the policy engine (live) or its
 * canonical mirror — nothing is hand-copied. Curfew: GH-CURFEW-001 v2.0.
 * Fees: GH-FEES-001 v1.0. Contact: GH-CONTACT-001 v1.0.
 */
export function ResidentHome() {
  const { policies, source } = useActivePolicies()

  const curfewLive = policies['GH-CURFEW-001']?.values as
    | { phases?: Array<{ phase: number; days: string; sun_thu: string; fri_sat: string }> }
    | undefined
  const phases: CurfewPhase[] =
    curfewLive?.phases?.map((p) => ({
      phase: p.phase,
      days: `Days ${p.days}`,
      sunThu: p.sun_thu,
      friSat: p.fri_sat,
    })) ?? CANONICAL.curfew.phases

  const fees = CANONICAL.fees
  const contact = CANONICAL.contact

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold text-emerald-950">Welcome home.</h1>
        <p className="mt-1 max-w-2xl text-stone-600">
          Grace House is a peer-led community where accountability protects belonging. This page
          shows the current house rhythm — every value comes from the house policy engine
          {source === 'live' ? '' : ' (offline mirror)'}.
        </p>
      </section>

      <section aria-labelledby="curfew-heading">
        <h2 id="curfew-heading" className="text-lg font-semibold">
          Curfew &amp; quiet hours{' '}
          <span className="text-xs font-normal text-stone-400">
            {CANONICAL.curfew.code} v{policies['GH-CURFEW-001']?.version ?? CANONICAL.curfew.version}
          </span>
        </h2>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[28rem] rounded-xl border border-stone-200 bg-white text-sm">
            <thead>
              <tr className="text-left text-stone-500">
                <th className="p-3 font-medium">Phase</th>
                <th className="p-3 font-medium">Sun–Thu</th>
                <th className="p-3 font-medium">Fri–Sat</th>
                <th className="p-3 font-medium">Quiet hours</th>
                <th className="p-3 font-medium">Visitors depart by</th>
              </tr>
            </thead>
            <tbody>
              {phases.map((p) => (
                <tr key={p.phase} className="border-t border-stone-100">
                  <td className="p-3">
                    Phase {p.phase} <span className="text-stone-400">({p.days})</span>
                  </td>
                  <td className="p-3">{formatTime(p.sunThu)}</td>
                  <td className="p-3">{formatTime(p.friSat)}</td>
                  <td className="p-3">
                    curfew → {formatTime(CANONICAL.curfew.quietHoursEnd)}
                  </td>
                  <td className="p-3">
                    {formatTime(visitorDeparture(p.sunThu))} / {formatTime(visitorDeparture(p.friSat))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 max-w-2xl text-xs text-stone-500">
          Curfew never extends past midnight, in any phase, for any reason. Emergencies and
          unavoidable transportation disruptions are never treated as misconduct. Need more time
          for work, medical care, treatment, court, or a recovery activity? Request a curfew
          extension {CANONICAL.curfew.extensionNoticeHours} hours ahead from the Passes page.
        </p>
      </section>

      <section aria-labelledby="fees-heading">
        <h2 id="fees-heading" className="text-lg font-semibold">
          Program fees{' '}
          <span className="text-xs font-normal text-stone-400">
            {fees.code} v{fees.version}
          </span>
        </h2>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <h3 className="font-medium">Double (shared) room</h3>
            <p className="mt-1 text-2xl font-semibold text-emerald-900">
              ${fees.doubleSharedRoom.weekly}
              <span className="text-sm font-normal text-stone-500">/week</span>
            </p>
            <p className="text-sm text-stone-600">
              or ${fees.doubleSharedRoom.monthlyPrepaidInFull}/month paid in advance in full
            </p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <h3 className="font-medium">Single (private) room</h3>
            <p className="mt-1 text-2xl font-semibold text-emerald-900">
              ${fees.singlePrivateRoom.weekly}
              <span className="text-sm font-normal text-stone-500">/week</span>
            </p>
            <p className="text-sm text-stone-600">
              or ${fees.singlePrivateRoom.monthlyPrepaidInFull}/month paid in advance in full
            </p>
          </div>
        </div>
        <p className="mt-2 text-xs text-stone-500">
          {fees.monthlyRateCondition} Deposit and refund terms are pending a leadership decision
          ({fees.depositPendingDecision}) and will be published here once resolved.
        </p>
      </section>

      <section aria-labelledby="med-heading" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <h2 id="med-heading" className="text-base font-semibold text-emerald-950">
          Your medications are welcome here
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-emerald-900">
          Prescribed medications — including buprenorphine, methadone, naltrexone, and all
          FDA-approved medications for substance use disorder or mental health — never count
          against you here. They are never a violation, never a positive screen, and never reduce
          your privileges.
        </p>
      </section>

      <section aria-labelledby="contact-heading">
        <h2 id="contact-heading" className="text-lg font-semibold">
          Reach us
        </h2>
        <ul className="mt-2 space-y-1 text-sm text-stone-700">
          <li>GFA Office: {contact.officePhone}</li>
          <li>Email: {contact.email}</li>
          <li>Residents Warmline: {contact.residentsWarmline}</li>
          <li>{contact.address}</li>
        </ul>
      </section>
    </div>
  )
}
