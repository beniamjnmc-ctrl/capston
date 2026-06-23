import { NextResponse } from 'next/server'
import { createClient } from './utils/supabase/middleware'

export async function middleware(request) {
  try {
    const { supabase, supabaseResponse } = createClient(request)
    // Required by @supabase/ssr: refreshes the session token on every request
    await supabase.auth.getUser()
    return supabaseResponse
  } catch {
    // Never block navigation if middleware fails
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
