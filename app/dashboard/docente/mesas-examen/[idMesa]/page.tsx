// app/docente/mesas-examen/[idMesa]/page.tsx
import { 
  getDatosMesaExamen, 
  getUsuarioActual, // <- Ahora sí lo encuentra
  type MesaExamenDetalles, 
  type AlumnoInscripcion,
  type Usuario 
} from './actions'
import FormularioCargaNotas from './formulario-carga-notas' // <- Ahora sí lo encuentra
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, ArrowLeft } from 'lucide-react'

function CabeceraMesa({ detalles }: { detalles: MesaExamenDetalles }) {
  
  const estadoVariantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    'programada': 'default',
    'finalizada': 'secondary',
    'cancelada': 'destructive',
  };
  
  const estadoVariant = estadoVariantMap[detalles.estado] || 'default'

  return (
    <div className="mb-6 p-4 border rounded-lg bg-white dark:bg-slate-800 shadow-sm">
      <div className="mb-6">
        <a
          href="/docente/mesas-examen"
          className="inline-flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Panel Docente
        </a>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">Carrera</p>
          <p className="text-lg font-semibold">{detalles.carreraNombre}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Materia</p>
          <p className="text-lg font-semibold">{detalles.materiaNombre}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Código</p>
          <p className="text-lg font-semibold">{detalles.materiaCodigo}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Docente a cargo</p>
          <p className="text-lg font-semibold">{detalles.docenteNombre}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Fecha</p>
          <p className="text-lg font-semibold">{detalles.fecha}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Inscriptos</p>
          <p className="text-lg font-semibold">{detalles.inscriptosCount} estudiantes</p>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Estado</p>
          <Badge variant={estadoVariant} className="capitalize">{detalles.estado}</Badge>
        </div>
      </div>
    </div>
  )
}

export default async function CargarCalificacionesPage({ params }: {
  params: { idMesa: string }
}) {
  const { idMesa } = params

  try {
    const [
      { detalles, alumnos }, 
      usuario
    ] = await Promise.all([
      getDatosMesaExamen(idMesa),
      getUsuarioActual()
    ]);

    return (
      <div className="container mx-auto p-4">
        <CabeceraMesa detalles={detalles} />
        <FormularioCargaNotas
          idMesa={idMesa}
          initialAlumnos={alumnos}
          estadoMesa={detalles.estado}
          detallesMesa={detalles}
          usuario={usuario}
        />
      </div>
    )
  } catch (error) {
    return (
      <div className="container mx-auto p-4 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
        <h1 className="mt-4 text-xl font-bold">Error al cargar la mesa</h1>
        <p className="text-slate-600">{(error as Error).message}</p>
      </div>
    )
  }
}