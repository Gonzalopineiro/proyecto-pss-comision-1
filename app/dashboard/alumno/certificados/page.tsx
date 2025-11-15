import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import SidebarAlumno from '@/components/ui/sidebar_alumno'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Shield, Calendar, User, BookOpen, AlertCircle, Download, Printer, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import GenerarConstanciaClient from './GenerarConstanciaClient' // Componente para la constancia de alumno regular
import CertificadosCliente from './CertificadosCliente' // Componente para el certificado analítico
import CertificadoExamenCliente from './CertificadoExamenCliente' // Componente para el certificado de examen
import { obtenerExamenesAprobados } from './actions'

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

  // 5. Obtener cursadas activas del último año (para Constancia de Alumno Regular)
  const añoActual = new Date().getFullYear()
  const { data: cursadasActivasData } = await supabase
    .from('inscripciones_cursada')
    .select(`
      cursadas!inner(
        id,
        anio,
        cuatrimestre
      )
    `)
    .eq('alumno_id', user.id)
    .in('estado', ['pendiente', 'regular', 'aprobada'])
    .gte('cursadas.anio', añoActual - 1)
  
  const tieneCursadasActivas = (cursadasActivasData?.length ?? 0) > 0

  // 6. Obtener exámenes aprobados con información del docente (para Certificado de Examen)
  const examenesAprobados = await obtenerExamenesAprobados()


  // --- RENDERIZADO DE LA PÁGINA ---
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex">
        <SidebarAlumno />
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Generación de Certificados
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Genere, descargue e imprima sus certificados académicos
              </p>
            </div>

            {/* Contenedor de certificados */}
            <div className="space-y-6">
              
              {/* Card 1: Constancia de Alumno Regular */}
              <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        Constancia de Alumno Regular
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        Certifica su condición de alumno regular en la universidad
                      </p>
                      
                      {/* Lista de información incluida */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                          <span>Requiere al menos una cursada activa en el último año</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                          <span>Incluye datos personales, carrera y código de verificación</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Botones de acción */}
                    <div className="flex gap-2 ml-6">
                      <GenerarConstanciaClient tieneCursadasActivas={tieneCursadasActivas} />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Card 2: Certificado Analítico (Certificado de Materias Aprobadas) */}
              <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        Certificado de Materias Aprobadas
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        Listado completo de todas las materias aprobadas con notas y fechas
                      </p>
                      
                      {/* Lista de información incluida */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                          <span>Incluye materias cursadas y aprobadas con nota y fecha</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                          <span>Acceso rápido académico oficial</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                          <span>Código de verificación único incluido</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Botones de acción */}
                    <div className="flex gap-2 ml-6">
                      <CertificadosCliente
                        alumno={alumnoData}
                        finalesAprobados={finalesAprobados}
                        cursadasAprobadas={cursadasAprobadas}
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Card 3: Certificado de Examen */}
              <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        Certificado de Examen
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        Certificado oficial del resultado de examen rendido
                      </p>
                      
                      {/* Lista de información incluida */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                          <span>Incluye materia, fecha, nota y docente firmante</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                          <span>Resultado oficial del examen</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-500"></div>
                          <span>Validado por docente autorizado</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Botones de acción */}
                    <div className="flex gap-2 ml-6">
                      <CertificadoExamenCliente
                        alumno={{
                          nombre: alumnoData.nombre,
                          apellido: alumnoData.apellido,
                          dni: alumnoData.dni,
                          legajo: alumnoData.legajo,
                          email: alumnoData.email,
                          carrera: alumnoData.carreras
                        }}
                        examenesAprobados={examenesAprobados}
                      />
                    </div>
                  </div>
                </div>
              </Card>

            </div>

            {/* Nota informativa sobre código de verificación */}
            <Card className="mt-8 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Código de Verificación
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Todos los certificados incluyen un código único de verificación alfanumérico de 10 caracteres para validación digital posterior.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}