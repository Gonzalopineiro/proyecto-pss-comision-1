import { NextRequest, NextResponse } from 'next/server'
import { verificarMesasSinNotas } from '../notifications/email'

export async function POST(request: NextRequest) {
  try {
    console.log('Iniciando verificación manual de mesas sin notas...')
    
    const result = await verificarMesasSinNotas()
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Verificación completada. ${result.mesasNotificadas} mesas notificadas.`,
        mesasNotificadas: result.mesasNotificadas
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Error en API de verificación:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'API de verificación de mesas sin notas. Use POST para ejecutar la verificación.',
    endpoint: '/api/check-notifications',
    method: 'POST'
  })
}