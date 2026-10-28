import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import { useHiring } from '../lib/store.tsx'
import { liveMode } from '../lib/live.ts'
import { Icon } from './ui.tsx'

const STEPS = [
  { to: '/app', label: 'Job ad', end: true },
  { to: '/app/xray', label: 'X-ray' },
  { to: '/app/kit', label: 'Kit' },
  { to: '/app/link', label: 'Link' },
  { to: '/app/live', label: 'Live inbox' },
]

const RAIL = [
  { to: '/', label: 'Overview', icon: Icon.Home, end: true },
  { to: '/app', label: 'Job ad', icon: Icon.Doc, end: true },
  { to: '/app/xray', label: 'Ad X-ray', icon: Icon.Scan },
  { to: '/app/kit', label: 'Kit', icon: Icon.Kit },
  { to: '/app/live', label: 'Live inbox', icon: Icon.Inbox },
]

export function Mark({ className = '' }: { className?: string }) {
  return (
    <span className={`grid h-9 w-9 place-items-center rounded-full bg-proof text-white ${className}`} aria-hidden>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7" /></svg>
    </span>
  )
}

export function Shell() {
  const { reset } = useHiring()
  const nav = useNavigate()
  const pill = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap rounded-full px-4 py-2 text-[13.5px] font-medium no-underline transition-colors ${isActive ? 'bg-ground text-ink' : 'text-muted hover:text-ink'}`
  const rail = ({ isActive }: { isActive: boolean }) =>
    `grid h-11 w-11 place-items-center rounded-full transition-colors ${isActive ? 'bg-proof text-white' : 'text-muted hover:bg-ground hover:text-ink'}`

  return (
    <div className="mx-auto min-h-screen max-w-[1400px] px-[max(16px,env(safe-area-inset-left))] py-4 sm:py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-full bg-card px-3 py-2 sm:px-4">
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <Mark />
          <span className="text-[19px] font-bold tracking-tight text-ink">WorkProof</span>
        </Link>
        <nav aria-label="Steps" className="order-3 flex w-full gap-1 overflow-x-auto rounded-full bg-card sm:order-none sm:w-auto">
          {STEPS.map(s => <NavLink key={s.to} to={s.to} end={s.end} className={pill}>{s.label}</NavLink>)}
        </nav>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full bg-proof-tint px-3 py-1.5 text-[12.5px] font-semibold text-proof-deep md:inline-flex">
            <Icon.Lock width={14} height={14} /> Blind scoring on
          </span>
          <span title={liveMode === 'supabase' ? 'Live across devices' : 'Live across tabs in this browser'} className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px] font-medium text-muted ring-1 ring-line">
            <span className="h-2 w-2 rounded-full bg-proof" aria-hidden /> {liveMode === 'supabase' ? 'Live' : 'Local'}
          </span>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-[13px] font-semibold text-white" aria-label="Signed in as Mthembu Hardware">MH</span>
        </div>
      </header>

      <div className="flex gap-4 sm:gap-6">
        <aside aria-label="Sections" className="sticky top-6 hidden h-fit flex-col gap-2 md:flex">
          <nav className="flex flex-col gap-1.5 rounded-full bg-card p-1.5">
            {RAIL.map(r => (
              <NavLink key={r.to} to={r.to} end={r.end} className={rail} aria-label={r.label} title={r.label}>
                <r.icon />
              </NavLink>
            ))}
          </nav>
          <div className="rounded-full bg-card p-1.5">
            <button type="button" onClick={() => { reset(); nav('/app') }} className="grid h-11 w-11 place-items-center rounded-full text-muted hover:bg-ground hover:text-ink" aria-label="Start over with the sample ad" title="Start over">
              <Icon.Reset />
            </button>
          </div>
        </aside>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
