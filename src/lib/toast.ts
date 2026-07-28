let el: HTMLDivElement | null = null
let timer: ReturnType<typeof setTimeout> | undefined

/** Minimal toast — one message at a time, auto-dismisses. */
export function toast(message: string) {
  if (!el) {
    el = document.createElement('div')
    el.setAttribute('role', 'status')
    el.style.cssText =
      'position:fixed;bottom:1.4rem;left:50%;transform:translateX(-50%);background:#142921;color:#f7f4ec;' +
      'padding:.8rem 1.4rem;border-radius:11px;font-weight:600;font-size:.92rem;z-index:200;' +
      'box-shadow:0 12px 32px rgba(20,41,33,.25);transition:opacity .25s;opacity:0;pointer-events:none'
    document.body.appendChild(el)
  }
  el.textContent = message
  el.style.opacity = '1'
  clearTimeout(timer)
  timer = setTimeout(() => {
    if (el) el.style.opacity = '0'
  }, 3000)
}
