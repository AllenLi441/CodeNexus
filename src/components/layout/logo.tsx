import { cn } from '@/lib/utils'

export function CodeNexusLogo({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      aria-label="CodeNexus logo"
    >
      {/* Hexagon base */}
      <path
        d="M16 2L28 9V23L16 30L4 23V9L16 2Z"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Left angle bracket < */}
      <path
        d="M10 16L13.5 12.5L10 16L13.5 19.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right angle bracket > */}
      <path
        d="M22 16L18.5 12.5L22 16L18.5 19.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Slash / */}
      <path
        d="M17.5 11.5L14.5 20.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeOpacity="0.7"
      />
    </svg>
  )
}

export function BrandHeader({ dark = false }: { dark?: boolean }) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2', dark ? 'text-white' : 'text-primary')}>
      <CodeNexusLogo className="flex-shrink-0" size={28} />
      <div className="min-w-0 leading-none">
        <span className="block truncate text-lg font-bold tracking-tight">CodeNexus</span>
        <span className={cn('text-xs block -mt-0.5', dark ? 'text-white/50' : 'text-muted-foreground')}>
          AI 编程中枢
        </span>
      </div>
    </div>
  )
}
