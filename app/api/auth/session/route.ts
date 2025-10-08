import { NextResponse } from 'next/server'

function hasSessionCookie(cookieHeader: string | null){
  if (!cookieHeader) return false
  // simple parse: look for 'session=' prefix
  return cookieHeader.split(';').some(c => c.trim().startsWith('session='))
}

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie')
    const session = hasSessionCookie(cookieHeader)
    return NextResponse.json({ session })
  } catch (err) {
    return NextResponse.json({ session: false })
  }
}
