import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import SidebarAlumno from '@/components/ui/sidebar_alumno'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Shield, Calendar, User, BookOpen, AlertCircle } from 'lucide-react'
import GenerarConstanciaClient from './GenerarConstanciaClient' // Componente para la constancia de alumno regular
import CertificadosCliente from './CertificadosCliente' // Componente para el certificado analítico

// --- TIPOS DE DATOS (los que ya tenías) ---
export type FinalAprobadoRow = {
  nota: string | number | null
  mesas_examen: { 
    fecha_examen: string;
    materias: { nombre: string; codigo_materia: string } 
  }
}

export type CursadaAprobadaRow = {
  estado: string;
  cursadas: {
    materia_docente: {
      materias: {
        codigo_materia: string;
        nombre: string;
      } | null;
    } | null;
  } | null;
};

export type AlumnoCompleto = {
    id: string;
    nombre: string;
    apellido: string;
    dni: number | null;
    legajo: number | null;
    nacimiento: string | null;
    email: string | null;
    telefono: string | null;
    direccion: string | null;
}

export default async function CertificadosPage(){
  // 1. Verificar autenticación del usuario
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }

  // 2. Obtener TODA la información del alumno (para ambos certificados)
  const { data: alumnoData, error: userError } = await supabase
    .from('usuarios')
    .select(`
      id,
      nombre,
      apellido,
      dni,
      legajo,
      nacimiento,
      email,
      telefono,
      direccion,
      carreras!carrera_id (
        nombre
      )
    `)
    .eq('email', user.email)
    .single<AlumnoCompleto & { carreras: { nombre: string } | null }>()
  
  if (userError || !alumnoData) {
      // Puedes mostrar un mensaje más amigable aquí
      return <p>Error al cargar la información del alumno.</p>
  }

  // 3. Obtener finales aprobados (para el Certificado Analítico)
  const { data: finalesAprobadosData } = await supabase
      .from('inscripciones_mesa_examen')
      .select(`
          nota,
          mesas_examen(
              fecha_examen,
              materias(codigo_materia, nombre)
          )
      `)
      .eq('estudiante_id', user.id)
      .eq('estado', 'aprobado')
      .order('fecha_examen', { foreignTable: 'mesas_examen', ascending: true });

  const finalesAprobados = (finalesAprobadosData as FinalAprobadoRow[] | null) ?? []

  // 4. Obtener cursadas aprobadas (para el Certificado Analítico)
  const { data: cursadasAprobadasData } = await supabase
    .from('inscripciones_cursada')
    .select(`
      estado,
      cursadas!inner(
        materia_docente!inner(
          materias(
            codigo_materia,
            nombre
          )
        )
      )
    `)
    .eq('alumno_id', user.id)
    .eq('estado', 'aprobada');
  
  const cursadasAprobadas = (cursadasAprobadasData as CursadaAprobadaRow[] | null) ?? []


  // --- RENDERIZADO DE LA PÁGINA ---
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex">
        <SidebarAlumno />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto"> {/* Reducido a max-w-4xl para mejor lectura en una columna */}
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow mb-8">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Certificados y Constancias
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Genera y descarga tus certificados académicos oficiales.
              </p>
            </div>

            {/* Información del estudiante */}
            <Card className="p-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {alumnoData.nombre} {alumnoData.apellido}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Legajo: {alumnoData.legajo || 'No asignado'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Carrera: {alumnoData.carreras?.nombre || 'No asignada'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Contenedor de los dos certificados */}
            <div className="grid grid-cols-1 gap-8"> {/* <-- LÍNEA MODIFICADA */}
              
              {/* Card 1: Constancia de Alumno Regular */}
              <Card className="p-6 flex flex-col hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      Constancia de Alumno Regular
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      Certifica tu condición de alumno regular ante instituciones externas.
                    </p>
                  </div>
                </div>
                
                <div className="flex-grow space-y-4 mt-4">
                  {/* Requisitos */}
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm text-amber-800 dark:text-amber-200">Requisitos:</p>
                        <p className="text-sm text-amber-700 dark:text-amber-300">• Al menos una cursada activa en el último año.</p>
                      </div>
                    </div>
                  </div>

                  {/* Información incluida */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Información incluida:</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary"><User className="w-3 h-3 mr-1.5" />Datos personales</Badge>
                      <Badge variant="secondary"><BookOpen className="w-3 h-3 mr-1.5" />Carrera</Badge>
                      <Badge variant="secondary"><Calendar className="w-3 h-3 mr-1.5" />Fecha de generación</Badge>
                      <Badge variant="secondary"><Shield className="w-3 h-3 mr-1.5" />Código de verificación</Badge>
                    </div>
                  </div>
                </div>

                {/* Botón de generación */}
                <div className="mt-6">
                  <GenerarConstanciaClient />
                </div>
              </Card>

              {/* Card 2: Certificado Analítico de Materias */}
              <Card className="p-6 flex flex-col hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      Certificado Analítico
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      Lista todas las cursadas y finales que has aprobado hasta la fecha.
                    </p>
                  </div>
                </div>

                <div className="flex-grow space-y-4 mt-4">
                  {/* Requisitos */}
                   <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm text-amber-800 dark:text-amber-200">Requisitos:</p>
                        <p className="text-sm text-amber-700 dark:text-amber-300">• Tener al menos una cursada o final aprobado.</p>
                      </div>
                    </div>
                  </div>

                  {/* Información incluida */}
                  <div>
                     <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Información incluida:</p>
                     <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary"><User className="w-3 h-3 mr-1.5" />Datos personales</Badge>
                        <Badge variant="secondary"><FileText className="w-3 h-3 mr-1.5" />Detalle de materias</Badge>
                        <Badge variant="secondary"><Calendar className="w-3 h-3 mr-1.5" />Notas y Fechas</Badge>
                        <Badge variant="secondary"><Shield className="w-3 h-3 mr-1.5" />Código de verificación</Badge>
                     </div>
                  </div>
                </div>
                
                {/* Botón de generación (usa tu componente cliente existente) */}
                <div className="mt-6">
                   <CertificadosCliente
                        alumno={alumnoData}
                        finalesAprobados={finalesAprobados}
                        cursadasAprobadas={cursadasAprobadas}
                    />
                </div>
              </Card>

            </div>
          </div>
        </main>
      </div>
    </div>
  )
}