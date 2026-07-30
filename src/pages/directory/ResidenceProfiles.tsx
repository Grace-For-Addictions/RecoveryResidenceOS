import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

function ProfileShell({ crumb, title, sub, children }: { crumb: string; title: string; sub: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#faf7f2] text-[#2a2230]">
      <div className="bg-gradient-to-br from-[#3e1d4c] to-[#5b2c6f] py-10 text-white">
        <div className="mx-auto max-w-4xl px-5">
          <Link to="/" className="text-sm font-bold text-white/70 hover:text-[#d4a017]">
            ← RecoveryResidence / {crumb}
          </Link>
          <h1 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">{title}</h1>
          <p className="mt-2 max-w-3xl leading-relaxed text-white/85">{sub}</p>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-5 pb-12">{children}</div>
    </div>
  )
}

const card =
  'mt-7 rounded-2xl border border-[#e4dce8] bg-white p-7 shadow-sm [&_h3]:font-serif [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-[#5b2c6f] [&_h4]:mt-5 [&_h4]:font-serif [&_h4]:text-[#8e4585] [&_li]:mb-2 [&_li]:leading-relaxed [&_p]:leading-relaxed [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5'

/** EJWRH public profile. */
export function EjwrhProfile() {
  return (
    <ProfileShell
      crumb="EJWRH"
      title="Ernest & Johnnie White Recovery House"
      sub="A men's recovery residence at 1414 12th Street, Des Moines, Iowa 50314 — supported by Grace For Addictions through wraparound recovery support services. Iowa DOC approved."
    >
      <div className="mt-6 rounded-xl border border-[#e2c9de] bg-[#f3e6f1] p-4 text-sm text-[#3e1d4c]">
        <b className="text-[#8e4585]">EJWRH's full staged application process is being published here soon.</b>{' '}
        The structure will mirror the Grace House process — every document reviewable before you
        apply. In the meantime, applications are open by contact below.
      </div>
      <div className={card}>
        <h3>About EJWRH</h3>
        <ul>
          <li><b>Who we serve:</b> men building a life in recovery, including men returning from incarceration (Iowa DOC approved placement).</li>
          <li><b>Community model:</b> peer-led with a resident House Manager; Grace For Addictions provides wraparound recovery support services under a professional services agreement.</li>
          <li><b>Values:</b> trauma-informed, MAT/MOUD-affirming, multiple pathways honored.</li>
          <li><b>Fees:</b> shared room $175/week or $660/month · private room $200/week or $760/month.</li>
        </ul>
        <h4>Contact &amp; Apply</h4>
        <p>
          Email <b>ejwrh@rcoiowa.org</b> or call the GFA office at <b>515-220-8771</b> to request an
          application and schedule a conversation.
        </p>
      </div>
    </ProfileShell>
  )
}

/** Jerry's House public profile. */
export function JerrysProfile() {
  return (
    <ProfileShell
      crumb="Jerry's House"
      title="Jerry's House"
      sub="A future men's recovery residence from Grace For Addictions — carrying forward the legacy of one open door."
    >
      <div className={card}>
        <h3>The Story Behind the Name</h3>
        <p className="mt-2">
          Jerry's House is named in honor of <b>Jerry Anderson</b>, who opened his home to a young
          man named Joseph who was experiencing homelessness. Behind that door, Joseph finished high
          school, gained employment, obtained his driver's license, purchased a vehicle, and is
          preparing for independent living today.
        </p>
        <p className="mt-3">
          One open door changed the whole direction of a life. Jerry's House will hold that door
          open for men in recovery — with the same structure, dignity, and grace that define every
          Grace For Addictions residence. Jerry's widow, Jeannie, continues to champion this vision.
        </p>
        <h4>What to Expect</h4>
        <ul>
          <li>Men's residence following the Grace For Addictions model: trauma-informed, MAT/MOUD-affirming, multiple pathways.</li>
          <li>Full staged application process published here at launch — every document reviewable before applying, just like Grace House.</li>
          <li>Phased program structure with life &amp; recovery coaching and daily community connection.</li>
        </ul>
        <h4>Stay Connected</h4>
        <p>
          To be notified when Jerry's House opens applications — or to support the launch — contact{' '}
          <b>515-220-8771</b> or email <b>gracehouse@graceforaddictions.org</b>.
        </p>
      </div>
    </ProfileShell>
  )
}
