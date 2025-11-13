
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import SidebarAlumno from '@/components/ui/sidebar_alumno'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Shield, Calendar, User, BookOpen, AlertCircle } from 'lucide-react'
import GenerarConstanciaClient from './GenerarConstanciaClient'

export default async function CertificadosPage(){
  // Verificar autenticación
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }

  // Obtener información básica del alumno
  const { data: usuarioData } = await supabase
    .from('usuarios')
    .select(`
      nombre,
      apellido,
      legajo,
      carreras!carrera_id (
        nombre
      )
    `)
    .eq('email', user.email)
    .single()

  const nombreCompleto = usuarioData 
    ? `${usuarioData.nombre} ${usuarioData.apellido}`
    : 'Usuario'

  const carreraNombre = usuarioData?.carreras 
    ? (usuarioData.carreras as any).nombre 
    : 'No asignada'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex">
        <SidebarAlumno />
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow mb-8">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Certificados y Constancias
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Genera y descarga tus certificados académicos
              </p>
            </div>

            {/* Información del estudiante */}
            <Card className="p-6 mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {nombreCompleto}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Legajo: {usuarioData?.legajo || 'No asignado'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Carrera: {carreraNombre}
                  </p>
                </div>
              </div>
            </Card>

            {/* Certificados disponibles */}
            <div className="grid grid-cols-1 gap-6">
              {/* Constancia de Alumno Regular */}
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      Constancia de Alumno Regular
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      Certifica tu condición de alumno regular ante instituciones externas
                    </p>
                    
                    {/* Requisitos */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-amber-800 dark:text-amber-200">
                            Requisitos:
                          </p>
                          <p className="text-amber-700 dark:text-amber-300">
                            • Al menos una cursada activa en el último año
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Información incluida */}
                    <div className="space-y-2 mb-4">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Información incluida:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="text-xs">
                          <User className="w-3 h-3 mr-1" />
                          Datos personales
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          <BookOpen className="w-3 h-3 mr-1" />
                          Carrera
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          <Calendar className="w-3 h-3 mr-1" />
                          Fecha de generación
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          <Shield className="w-3 h-3 mr-1" />
                          Código de verificación
                        </Badge>
                      </div>
                    </div>

                    {/* Botón de generación */}
                    <GenerarConstanciaClient />
                  </div>
                </div>
              </Card>


            </div>

            {/* Información adicional */}
            <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Sobre los certificados
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Todos los certificados generados incluyen un código de verificación único 
                    que permite a las instituciones validar su autenticidad. Los documentos 
                    se generan en formato PDF y son válidos para presentaciones oficiales.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}