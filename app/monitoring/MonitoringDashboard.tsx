'use client'

import useSWR from 'swr'
import { Loader2, ShieldAlert, Activity, RefreshCcw, Radio, Server } from 'lucide-react'

import { Navbar } from '@/components/Navbar'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then(res => res.json())

function formatRelativeTime(iso?: string | null) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function MonitoringDashboard() {
  const { data, error, isLoading, mutate } = useSWR('/api/admin/monitoring', fetcher, {
    refreshInterval: 60_000,
    revalidateOnFocus: true
  })

  const moralis = data?.moralis
  const twitterLimits = data?.twitter?.rows ?? []
  const cronJobs = data?.cron?.rows ?? []

  return (
    <div className="min-h-screen bg-[#050712] text-white">
      <Navbar />
      <main className="w-full px-4 sm:px-6 lg:px-12 py-10 max-w-6xl mx-auto space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold gradient-text">Ops Monitoring</h1>
            <p className="text-sm md:text-base text-[#94A3B8]">
              Quick health check for Moralis keys, Twitter limits and background jobs.
            </p>
          </div>
          <button
            onClick={() => mutate()}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#b8c5d6] hover:text-white hover:border-white/30"
          >
            <RefreshCcw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            Refresh
          </button>
        </header>

        {error && (
          <div className="glass-card border border-[#f87171]/40 bg-[#f87171]/10 rounded-2xl p-6 flex items-start gap-3">
            <ShieldAlert className="h-6 w-6 text-[#fca5a5]" />
            <div>
              <h2 className="text-lg font-semibold">Failed to load monitoring data</h2>
              <p className="text-sm text-[#fca5a5]">{String(error)}</p>
            </div>
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="glass-card rounded-2xl border border-white/10 p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Radio className="h-5 w-5 text-[#00FFA3]" />
              <h2 className="text-lg font-semibold">Moralis Status</h2>
            </div>
            {moralis ? (
              <ul className="text-sm text-[#94A3B8] space-y-2">
                <li>Configured: <span className="text-white font-semibold">{moralis.configured ? 'Yes' : 'No'}</span></li>
                <li>API Keys: <span className="text-white font-semibold">{moralis.keyCount}</span></li>
                <li>Active Key: <span className="text-white font-semibold">{moralis.activeKeyLabel || '—'}</span></li>
                <li>
                  Disabled Until: <span className="text-white font-semibold">{moralis.disabledUntil ? formatRelativeTime(moralis.disabledUntil) : '—'}</span>
                </li>
                {moralis.isTemporarilyDisabled && (
                  <li className="text-[#fbbf24] text-xs">Requests paused until {moralis.disabledUntil}</li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-[#94A3B8]">Loading...</p>
            )}
          </div>

          <div className="glass-card rounded-2xl border border-white/10 p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-[#00D1FF]" />
              <h2 className="text-lg font-semibold">Twitter Rate Limit</h2>
            </div>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : twitterLimits.length === 0 ? (
              <p className="text-sm text-[#94A3B8]">No entries. Limits reset or not triggered yet.</p>
            ) : (
              <ul className="text-sm text-[#94A3B8] space-y-2">
                {twitterLimits.map((row: any) => (
                  <li key={row.key} className="flex flex-col border border-white/5 rounded-xl p-3 bg-white/5">
                    <span className="text-xs uppercase tracking-widest text-[#6b7280]">{row.key}</span>
                    <span className="text-white font-semibold">Resume at: {row.resume_at ? new Date(row.resume_at).toLocaleString() : 'Ready now'}</span>
                    <span className="text-xs text-[#6b7280]">Updated {formatRelativeTime(row.updated_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="glass-card rounded-2xl border border-white/10 p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Server className="h-5 w-5 text-[#34d399]" />
              <h2 className="text-lg font-semibold">Cron Summary</h2>
            </div>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : cronJobs.length === 0 ? (
              <p className="text-sm text-[#94A3B8]">No cron job data yet.</p>
            ) : (
              <ul className="text-sm text-[#94A3B8] space-y-2 max-h-64 overflow-auto pr-1">
                {cronJobs.map((job: any) => (
                  <li key={job.job_name} className="border border-white/5 rounded-xl p-3 bg-white/5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-white font-semibold">{job.job_name}</span>
                      <span className="text-xs text-[#6b7280]">Updated {formatRelativeTime(job.updated_at)}</span>
                    </div>
                    <div className="mt-2 space-y-1 text-xs">
                      <div>
                        <span className="text-[#6b7280]">Last success:</span>{' '}
                        <span className="text-[#34d399]">{job.last_success_at ? `${new Date(job.last_success_at).toLocaleString()}` : 'Never'}</span>
                      </div>
                      {job.last_success_summary && (
                        <pre className="bg-black/40 rounded-lg p-2 text-[11px] text-[#cbd5f5] whitespace-pre-wrap">
                          {JSON.stringify(job.last_success_summary, null, 2)}
                        </pre>
                      )}
                      <div>
                        <span className="text-[#6b7280]">Last error:</span>{' '}
                        <span className="text-[#f87171]">{job.last_error_at ? `${new Date(job.last_error_at).toLocaleString()}` : 'None'}</span>
                      </div>
                      {job.last_error_message && (
                        <p className="text-[#fca5a5]">{job.last_error_message}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
