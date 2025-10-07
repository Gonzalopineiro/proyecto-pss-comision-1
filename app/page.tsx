
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GraduationCap, Briefcase, User, School } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
      <main className="flex-1">
        <section className="w-full py-12 md:py-20 lg:py-24 bg-gradient-to-b from-white to-gray-100 dark:from-slate-800 dark:to-slate-900">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <School className="h-14 w-14 text-blue-600" />
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                Sistema Integral Universitario (SIU)
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-600 md:text-xl dark:text-gray-300">
                Gestión académica y administrativa en línea
              </p>
            </div>
          </div>
        </section>
        
        <section className="w-full py-12 md:py-20 lg:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center space-y-2 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Bienvenido al SIU</h2>
              <p className="max-w-[900px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-300">
                Nuestra plataforma digital unifica la gestión académica y administrativa. Estudiantes, docentes y personal pueden realizar trámites clave, consultar información y administrar recursos de forma eficiente y accesible desde cualquier lugar.
              </p>
            </div>
            <div className="mx-auto grid max-w-sm items-start gap-8 sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-5xl lg:grid-cols-3 mt-12">
              <Card className="w-full transform-gpu transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl rounded-2xl border border-transparent">
                <CardHeader className="flex flex-row items-center gap-4 p-6 bg-gradient-to-r from-white/50 to-slate-50 dark:from-slate-800 dark:to-slate-800 rounded-t-2xl">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-900">
                    <GraduationCap className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="grid gap-1">
                    <CardTitle className="font-bold">Soy Estudiante</CardTitle>
                    <CardDescription>Acceso a materias, notas y trámites.</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-4">
                  <Link href="/login?role=estudiante">
                    <Button variant="primary-dark" className="w-full font-semibold">
                      Ingresar
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="w-full transform-gpu transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl rounded-2xl border border-transparent">
                <CardHeader className="flex flex-row items-center gap-4 p-6 bg-gradient-to-r from-white/50 to-slate-50 dark:from-slate-800 dark:to-slate-800 rounded-t-2xl">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-50 dark:bg-green-900">
                    <Briefcase className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="grid gap-1">
                    <CardTitle className="font-bold">Soy Docente</CardTitle>
                    <CardDescription>Gestión de cursos, alumnos y actas.</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-4">
                  <Link href="/login?role=docente">
                    <Button variant="primary-dark" className="w-full font-semibold">
                      Ingresar
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="w-full transform-gpu transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl rounded-2xl border border-transparent">
                <CardHeader className="flex flex-row items-center gap-4 p-6 bg-gradient-to-r from-white/50 to-slate-50 dark:from-slate-800 dark:to-slate-800 rounded-t-2xl">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-50 dark:bg-red-900">
                    <User className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="grid gap-1">
                    <CardTitle className="font-bold">Soy Administrativo</CardTitle>
                    <CardDescription>Administración general del sistema.</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-4">
                  <Link href="/login?role=administrativo">
                    <Button variant="primary-dark" className="w-full font-semibold">
                      Ingresar
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full shrink-0 border-t bg-white dark:bg-slate-800">
        <div className="container mx-auto flex flex-col gap-2 py-6 px-4 md:px-6 sm:flex-row sm:items-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © 2025 Universidad Nacional de La Plata. Secretaría de Tecnologías de la Información Académica.
          </p>
          <nav className="sm:ml-auto flex gap-4 sm:gap-6">
            <Link className="text-xs hover:underline underline-offset-4" href="mailto:soporte@universidad.edu.ar">
              Soporte técnico: soporte@universidad.edu.ar
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
