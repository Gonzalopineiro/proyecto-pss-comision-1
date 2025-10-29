import { NextRequest, NextResponse } from 'next/server'
import { verificarMesasSinNotas } from '../notifications/email'

export async function POST(request: NextRequest) {
  console.log('\n' + '🔥'.repeat(60))
  console.log('🚀 VERIFICACIÓN DE NOTIFICACIONES INICIADA')
  console.log('📅 Fecha/Hora:', new Date().toLocaleString('es-ES'))
  console.log('🌐 Endpoint: POST /api/check-notifications')
  console.log('🔥'.repeat(60))
  
  try {
    const result = await verificarMesasSinNotas()
    
    console.log('\n' + '✅'.repeat(60))
    console.log('🎉 VERIFICACIÓN COMPLETADA EXITOSAMENTE')
    console.log('📊 Mesas procesadas:', result.mesasNotificadas)
    console.log('✅'.repeat(60) + '\n')
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Verificación completada. ${result.mesasNotificadas} mesas notificadas.`,
        mesasNotificadas: result.mesasNotificadas,
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }
    
  } catch (error) {
    console.log('\n' + '❌'.repeat(60))
    console.log('💥 ERROR EN VERIFICACIÓN DE NOTIFICACIONES')
    console.log('🔥 Error capturado:', error)
    console.log('📅 Momento del error:', new Date().toLocaleString('es-ES'))
    console.log('❌'.repeat(60) + '\n')
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
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