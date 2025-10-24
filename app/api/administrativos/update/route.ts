import { NextResponse } from 'next/server'
import { actualizarAdministrativo } from '@/app/dashboard/administrativo/actions'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, email, telefono, direccion } = body || {}

    if (!id) {
      return NextResponse.json({ success: false, error: 'Falta id' }, { status: 400 })
    }

    const result = await actualizarAdministrativo(id, {
      email,
      telefono,
      direccion
    })

    if (result && (result as any).success) {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: (result as any).error || 'No se pudo actualizar' }, { status: 500 })
  } catch (error: any) {
    console.error('Error en API actualizar administrativo:', error)
    return NextResponse.json({ success: false, error: error.message || 'Error interno' }, { status: 500 })
  }
}
