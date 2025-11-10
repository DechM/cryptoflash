import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    {
      error: 'Deprecated',
      message: 'This endpoint has been deprecated. Please use Supabase Auth for user creation.'
    },
    { status: 410 }
  )
}
