import { useState } from 'react'
import { CANONICAL } from '../policy/canonical'

/**
 * Support Now is persistently visible on every screen. Nobody in distress
 * should have to navigate anywhere to reach support.
 */
export function SupportNow() {
  const [open, setOpen] = useState(false)
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="w-80 rounded-2xl border border-emerald-200 bg-white p-4 shadow-xl">
          <h2 className="text-base font-semibold text-emerald-900">You are not alone.</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <span className="font-medium">Residents Warmline:</span>{' '}
              <a className="text-emerald-700 underline" href="tel:5153103425">
                {CANONICAL.contact.residentsWarmline}
              </a>
            </li>
            <li>
              <span className="font-medium">GFA Office:</span>{' '}
              <a className="text-emerald-700 underline" href="tel:5152208771">
                {CANONICAL.contact.officePhone}
              </a>
            </li>
            <li>
              <span className="font-medium">988 Suicide &amp; Crisis Lifeline:</span>{' '}
              <a className="text-emerald-700 underline" href="tel:988">
                call or text 988
              </a>
            </li>
            <li>
              <span className="font-medium">Immediate life-threatening emergency:</span>{' '}
              <a className="text-emerald-700 underline" href="tel:911">
                911
              </a>
            </li>
          </ul>
          <p className="mt-3 text-xs text-stone-500">
            Peer support is not a crisis service. If you are in danger, use 988 or 911 first.
          </p>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-300"
        aria-expanded={open}
      >
        Support Now
      </button>
    </div>
  )
}
