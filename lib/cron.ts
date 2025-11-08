import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

interface CronPatch {
  last_success_at?: string | null
  last_success_summary?: Record<string, unknown> | null
  last_error_at?: string | null
  last_error_message?: string | null
}

async function upsertCronStatus(jobName: string, patch: CronPatch) {
  if (!isSupabaseConfigured) {
    return
  }

  try {
    const { data } = await supabaseAdmin
      .from('cron_status')
      .select('job_name, last_success_at, last_success_summary, last_error_at, last_error_message')
      .eq('job_name', jobName)
      .maybeSingle()

    const payload = {
      job_name: jobName,
      last_success_at: data?.last_success_at ?? null,
      last_success_summary: data?.last_success_summary ?? null,
      last_error_at: data?.last_error_at ?? null,
      last_error_message: data?.last_error_message ?? null,
      ...patch,
      updated_at: new Date().toISOString()
    }

    await supabaseAdmin
      .from('cron_status')
      .upsert(payload, { onConflict: 'job_name' })
  } catch (error) {
    console.error(`[CronStatus] Failed to upsert status for ${jobName}:`, error)
  }
}

export async function recordCronSuccess(jobName: string, summary?: Record<string, unknown>) {
  await upsertCronStatus(jobName, {
    last_success_at: new Date().toISOString(),
    last_success_summary: summary ? summary : null
  })
}

export async function recordCronFailure(jobName: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  await upsertCronStatus(jobName, {
    last_error_at: new Date().toISOString(),
    last_error_message: message
  })
}
