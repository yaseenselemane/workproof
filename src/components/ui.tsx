import { useEffect, useState, type ReactNode, type SVGProps } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import type { LineKind } from '../lib/types.ts'

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

export function Card({ className, children, as: As = 'section', ...rest }: { className?: string; children: ReactNode; as?: 'section' | 'div' | 'aside'; 'aria-label'?: string }) {
  return <As {...rest} className={cx('rounded-[var(--radius-card)] bg-card p-5 sm:p-6', className)}>{children}</As>
}

export function CardHead({ title, sub, action }: { title: ReactNode; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold leading-tight">{title}</h2>
        {sub && <p className="mt-0.5 text-[13px] text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx('font-mono text-[11.5px] uppercase tracking-[0.08em] text-muted', className)}>{children}</span>
}

/** Big figure with a lighter tail, as in "10 / 12" or "32,678.90". */
export function BigNum({ main, tail, className, tone = 'ink' }: { main: ReactNode; tail?: ReactNode; className?: string; tone?: 'ink' | 'proof' | 'proxy' }) {
  const color = { ink: 'text-ink', proof: 'text-proof', proxy: 'text-proxy' }[tone]
  return (
    <span className={cx('tabular font-semibold leading-none tracking-tight', color, className)}>
      {main}
      {tail && <span className="font-medium text-faint">{tail}</span>}
    </span>
  )
}

export function CountUp({ to, duration = 900 }: { to: number; duration?: number }) {
  const reduce = useReducedMotion()
  const [n, setN] = useState(reduce ? to : 0)
  useEffect(() => {
    if (reduce) { setN(to); return }
    let raf = 0
    const start = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, duration, reduce])
  return <>{n}</>
}

const KIND: Record<LineKind, { label: string; cls: string; dot: string }> = {
  proxy: { label: 'Proxy', cls: 'bg-proxy-tint text-proxy-ink', dot: 'bg-proxy' },
  trainable: { label: 'Trainable', cls: 'bg-train-tint text-train', dot: 'bg-train' },
  task: { label: 'Real task', cls: 'bg-proof-tint text-proof-deep', dot: 'bg-proof' },
  review: { label: 'Review', cls: 'bg-work-tint text-work', dot: 'bg-work' },
}
export const kindStyle = (k: LineKind) => KIND[k]

export function KindTag({ kind, why }: { kind: LineKind; why?: string }) {
  const k = KIND[kind]
  return (
    <span className={cx('inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-semibold', k.cls)}>
      <span aria-hidden className={cx('h-1.5 w-1.5 rounded-full', k.dot)} />
      {k.label}{why ? ` · ${why}` : ''}
    </span>
  )
}

const btn = {
  primary: 'bg-proof text-white hover:bg-proof-deep',
  secondary: 'bg-card text-ink ring-1 ring-line hover:ring-faint',
  ghost: 'text-proof hover:bg-proof-tint',
}

export function Button({ children, variant = 'primary', className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof btn }) {
  return (
    <button type="button" {...rest} className={cx('inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-[14px] font-semibold transition-colors disabled:opacity-50', btn[variant], className)}>
      {children}
    </button>
  )
}

export function LinkButton({ to, children, variant = 'primary', className }: { to: string; children: ReactNode; variant?: keyof typeof btn; className?: string }) {
  return (
    <Link to={to} className={cx('inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-[14px] font-semibold no-underline transition-colors', btn[variant], className)}>
      {children}
    </Link>
  )
}

/** The round "open" button from the reference, top-right of a card. */
export function CornerLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} aria-label={label} className="grid h-10 w-10 shrink-0 place-items-center rounded-full ring-1 ring-line transition-colors hover:bg-ground">
      <Icon.ArrowUpRight />
    </Link>
  )
}

export function Page({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  )
}

export function Heading({ main, light, kicker }: { main: ReactNode; light?: ReactNode; kicker?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-2">
      {kicker && <Kicker>{kicker}</Kicker>}
      <h1 className="text-balance text-[clamp(28px,4vw,40px)] font-medium leading-[1.1] tracking-[-0.02em]">
        {main}{light && <span className="text-faint"> {light}</span>}
      </h1>
    </div>
  )
}

type P = SVGProps<SVGSVGElement>
const base = (p: P) => ({ width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true, ...p })
export const Icon = {
  ArrowUpRight: (p: P) => <svg {...base(p)}><path d="M7 17 17 7M8 7h9v9" /></svg>,
  ArrowRight: (p: P) => <svg {...base(p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>,
  Home: (p: P) => <svg {...base(p)}><path d="M3 11 12 4l9 7M5 10v10h14V10" /></svg>,
  Doc: (p: P) => <svg {...base(p)}><path d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6" /></svg>,
  Scan: (p: P) => <svg {...base(p)}><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16" /></svg>,
  Kit: (p: P) => <svg {...base(p)}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 12h18" /></svg>,
  Link: (p: P) => <svg {...base(p)}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>,
  Inbox: (p: P) => <svg {...base(p)}><path d="M3 13h5l1.5 3h5L16 13h5M5 5h14l2 8v6H3v-6z" /></svg>,
  Lock: (p: P) => <svg {...base(p)}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>,
  Unlock: (p: P) => <svg {...base(p)}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 7.5-2" /></svg>,
  Copy: (p: P) => <svg {...base(p)}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a1 1 0 0 1 1-1h9" /></svg>,
  Check: (p: P) => <svg {...base(p)}><path d="m5 12 4.5 4.5L19 7" /></svg>,
  Alert: (p: P) => <svg {...base(p)}><path d="M12 3 2 20h20zM12 10v4M12 17v.5" /></svg>,
  Reset: (p: P) => <svg {...base(p)}><path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4" /></svg>,
  File: (p: P) => <svg {...base(p)}><path d="M7 3h7l5 5v13H7zM14 3v5h5" /></svg>,
  Download: (p: P) => <svg {...base(p)}><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>,
}
