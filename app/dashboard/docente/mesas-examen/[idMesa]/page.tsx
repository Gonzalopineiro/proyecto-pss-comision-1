// app/docente/mesas-examen/[idMesa]/page.tsx
import { getDatosMesaExamen, type MesaExamenDetalles } from './actions'
import FormularioCargaNotas from './formulario-carga-notas'
import { Badge } from '@/components/ui/badge' // (Asumo que usas shadcn)
import { AlertTriangle } from 'lucide-react'

// Componente para la cabecera (basado en tu mockup)
function CabeceraMesa({ detalles }: { detalles: MesaExamenDetalles }) {
  const estadoVariant = {
    'Pendiente': 'default',
    'Cerrada': 'secondary',
    'Publicada': 'success', // (Asumo que tienes este variant)
  }[detalles.estado] || 'default'

  return (
    <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-white dark:bg-slate-800 shadow-sm">
      <div>
        <p className="text-sm font-medium text-slate-500">Materia</p>
        <p className="text-lg font-semibold">{detalles.materiaNombre}</p>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">Código</p>
        <p className="text-lg font-semibold">{detalles.materiaCodigo}</p>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">Inscriptos</p>
        <p className="text-lg font-semibold">{detalles.inscriptosCount} estudiantes</p>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">Estado</p>
        <Badge variant={estadoVariant as any}>{detalles.estado}</Badge>
      </div>
    </div>
  )
}

/**
 * PÁGINA PRINCIPAL (SERVER COMPONENT)
 * Esta es la página de ruta dinámica
 */
export default async function CargarCalificacionesPage({ params }: {
  params: { idMesa: string }
}) {
  const { idMesa } = params

  try {
    // 1. Obtener los datos del servidor
    const { detalles, alumnos } = await getDatosMesaExamen(idMesa)

    // 2. Renderizar la página y pasar datos al componente de cliente
    return (
      <div className="container mx-auto p-4">
        <CabeceraMesa detalles={detalles} />
        
        <FormularioCargaNotas 
          idMesa={idMesa}
          initialAlumnos={alumnos}
          estadoMesa={detalles.estado}
        />
      </div>
    )
  } catch (error) {
    // Manejo de error si la mesa no se encuentra
    return (
      <div className="container mx-auto p-4 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
        <h1 className="mt-4 text-xl font-bold">Error al cargar la mesa</h1>
        <p className="text-slate-600">{(error as Error).message}</p>
      </div>
    )
  }
}
