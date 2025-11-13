import { NextResponse } from 'next/server'
import { eliminarAlumno } from '@/app/dashboard/administrativo/actions'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, email } = body || {}

    if (!id || !email) {
      return NextResponse.json(
        { success: false, error: 'Faltan parámetros id o email' },
        { status: 400 }
      )
    }

    const result = await eliminarAlumno(id, email)

    if (result && (result as any).success) {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { success: false, error: (result as any).error || 'No se pudo eliminar' },
      { status: 500 }
    )
  } catch (error: any) {
    console.error('Error en API eliminar alumno:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}