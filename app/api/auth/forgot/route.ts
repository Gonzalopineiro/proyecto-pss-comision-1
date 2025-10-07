import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { legajo, email } = body || {}

    const errors: any = {}
    if (!legajo || !/^[0-9]{3,}$/.test(String(legajo))) errors.legajo = 'Legajo inválido'
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email))) errors.email = 'Email inválido'

    if (Object.keys(errors).length) return NextResponse.json({ error: 'Datos inválidos', fields: errors }, { status: 400 })

    // Demo: aquí se podría generar un token y enviar un email.
    // Por ahora devolvemos OK y un mensaje genérico.
    return NextResponse.json({ ok: true, message: 'Si los datos son correctos, recibirás un email con instrucciones.' })
  } catch (err) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
