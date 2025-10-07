import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
  const body = await req.json()
  const { legajo, password, role, remember } = body || {}

    if (!legajo || !password) {
      return NextResponse.json({ error: 'Legajo y contraseña son obligatorios' }, { status: 400 })
    }

    // Validación demo: legajo numérico y al menos 3 dígitos
    if (!/^[0-9]{3,}$/.test(String(legajo))) {
      return NextResponse.json({ error: 'Legajo inválido' }, { status: 400 })
    }

    // Aquí iría la verificación real contra la base de datos.
    // Para demo, aceptamos cualquier credencial que cumpla la validación anterior.

    const session = { legajo: String(legajo), role: role || 'estudiante' }
    const value = Buffer.from(JSON.stringify(session)).toString('base64')

    const res = NextResponse.json({ ok: true })
    // Cookie httpOnly con la sesión (demo)
    const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 8 // 30 días vs 8 horas
    res.cookies.set('session', value, {
      httpOnly: true,
      path: '/',
      maxAge,
    })

    return res
  } catch (err) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
