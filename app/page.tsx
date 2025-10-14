
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GraduationCap, Briefcase, User, School } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
      <main className="flex-1">
        <section className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-700">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center space-y-6 text-center">
              <div className="inline-block p-4 bg-blue-50 rounded-full shadow-sm dark:bg-slate-700">
                <School className="h-14 w-14 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-blue-200">
                Sistema Integral Universitario
              </h1>
              <div className="h-1 w-24 bg-blue-600 rounded-full mx-auto"></div>
              <p className="mx-auto max-w-[700px] text-gray-600 md:text-xl dark:text-gray-300">
                Simplificamos la gestión académica y administrativa universitaria en una sola plataforma
              </p>
              <Link href="/login" className="mt-4">
                <Button className="px-8 py-3 text-md font-semibold bg-blue-600 hover:bg-blue-700 rounded-full shadow-md transition-all duration-300">
                  Acceder al Sistema
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        <section className="w-full py-12 md:py-20 lg:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center space-y-6 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Bienvenido al SIU</h2>
              <p className="max-w-[900px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-300">
                Nuestra plataforma digital unifica la gestión académica y administrativa. Estudiantes, docentes y personal administrativo pueden realizar trámites, consultar información y gestionar recursos de forma eficiente desde cualquier lugar.
              </p>
              
              <div className="flex flex-col items-center mt-8">
                <Link href="/login">
                  <Button className="px-12 py-6 text-lg font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                    Iniciar Sesión
                  </Button>
                </Link>
                <p className="mt-4 text-sm text-gray-500">
                  Ingrese con su legajo y contraseña institucional
                </p>
              </div>
            </div>
            
            <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="flex flex-col items-center space-y-3 text-center">
                <div className="bg-blue-100 p-4 rounded-full">
                  <GraduationCap className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold">Estudiantes</h3>
                <p className="text-gray-600">Acceso a materias, inscripciones, exámenes, notas y trámites académicos.</p>
              </div>
              
              <div className="flex flex-col items-center space-y-3 text-center">
                <div className="bg-green-100 p-4 rounded-full">
                  <Briefcase className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold">Docentes</h3>
                <p className="text-gray-600">Gestión de cursos, calificaciones, asistencias y actas de exámenes.</p>
              </div>
              
              <div className="flex flex-col items-center space-y-3 text-center">
                <div className="bg-red-100 p-4 rounded-full">
                  <User className="h-10 w-10 text-red-600" />
                </div>
                <h3 className="text-xl font-bold">Administrativos</h3>
                <p className="text-gray-600">Administración del sistema, planes de estudio, alumnos y docentes.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full shrink-0 border-t bg-slate-900 text-white">
        <div className="container mx-auto px-4 py-10 md:px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-2">
                <School className="h-8 w-8 text-blue-500" />
                <h3 className="text-lg font-bold">SIU</h3>
              </div>
              <p className="text-sm text-gray-400">
                Sistema Integral Universitario para la gestión académica y administrativa de la Universidad.
              </p>
            </div>
            <div className="flex flex-col space-y-3">
              <h3 className="text-lg font-bold">Enlaces Rápidos</h3>
              <nav className="flex flex-col space-y-2 text-sm text-gray-400">
                <Link href="/login" className="hover:text-blue-400 transition-colors">Iniciar Sesión</Link>
                <Link href="#" className="hover:text-blue-400 transition-colors">Manual de Usuario</Link>
                <Link href="#" className="hover:text-blue-400 transition-colors">Preguntas Frecuentes</Link>
              </nav>
            </div>
            <div className="flex flex-col space-y-3">
              <h3 className="text-lg font-bold">Soporte</h3>
              <div className="flex flex-col space-y-2 text-sm text-gray-400">
                <Link href="mailto:soporte@universidad.edu.ar" className="hover:text-blue-400 transition-colors">soporte@universidad.edu.ar</Link>
                <p>Teléfono: (221) 123-4567</p>
                <p>Horario: Lunes a Viernes 8:00 a 18:00</p>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-6">
            <p className="text-xs text-gray-400 text-center">
              © {new Date().getFullYear()} Universidad Nacional de La Plata. Secretaría de Tecnologías de la Información Académica. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
