import { Card } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/server";
import SidebarAlumno from "@/components/ui/sidebar_alumno";
import CursadasTable, { Cursada } from "./CursadasTable";

export default async function InscripcionCursadasPage() {
  const supabase = await createClient();

  // Obtener usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return <p>No hay sesión activa</p>;
  }

  // Buscar datos completos del alumno en tabla 'usuarios' usando el email
  const { data: usuarioData, error: usuarioError } = await supabase
    .from("usuarios")
    .select("nombre, apellido, legajo, email")
    .eq("email", user.email)
    .maybeSingle(); // trae 1 registro o null

  if (usuarioError || !usuarioData) {
    console.error("No se encontró información del alumno");
    return <p>No se pudo obtener la información del alumno</p>;
  }

  const alumno = {
    nombre: `${usuarioData.nombre} ${usuarioData.apellido}`,
    legajo: usuarioData.legajo,
    mail: usuarioData.email,
  };

  // Obtener cursadas activas con información completa
  const { data: cursadasData } = await supabase
    .from("cursadas")
    .select(
      `
      id,
      cupo_maximo,
      horarios,
      materia_docente_id,
      materia_docente:materia_docente_id(
        materia:materia_id(
          id,
          nombre,
          codigo_materia
        ),
        docente:docente_id(
          nombre,
          apellido
        )
      )
    `
    )
    .eq("estado", "activa")
    .order("created_at");

  // Obtener inscripciones del usuario
  const { data: inscripcionesData } = await supabase
    .from("inscripciones_cursada")
    .select("cursada_id")
    .eq("alumno_id", user.id);

  const cursadasInscripto = new Set(
    (inscripcionesData || []).map((i) => i.cursada_id)
  );

  const cursadas = (cursadasData || [])
    .map((cursada: any) => {
      if (!cursada?.materia_docente) return null;

      const { materia, docente } = cursada.materia_docente;

      return {
        id: cursada.id,
        cupo_maximo: cursada.cupo_maximo,
        horarios: cursada.horarios,
        materia_docente: {
          materia: {
            id: materia?.id || 0,
            nombre: materia?.nombre || "Sin nombre",
            codigo_materia: materia?.codigo_materia || "Sin código",
          },
          docente: {
            nombre: docente?.nombre || "Sin nombre",
            apellido: docente?.apellido || "Sin apellido",
          },
        },
      };
    })
    .filter(Boolean) as Cursada[];

  // Fechas de inscripción
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentCuatrimestre = currentMonth <= 6 ? "Primer" : "Segundo";

  const formatDate = (date: Date) =>
    date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const inscripcionInicio = new Date(
    currentYear,
    currentCuatrimestre === "Primer" ? 2 : 7,
    15
  );
  const inscripcionFin = new Date(
    currentYear,
    currentCuatrimestre === "Primer" ? 3 : 8,
    1
  );

  const fechaInicio = formatDate(inscripcionInicio);
  const fechaFin = formatDate(inscripcionFin);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex">
        <aside className="w-64">
          <SidebarAlumno />
        </aside>
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto mt-6">
            <div className="flex flex-col gap-4">
              <h1 className="text-3xl font-bold tracking-tight">
                Inscripción a Cursadas
              </h1>
              <p className="text-muted-foreground">
                Selecciona las materias a las que deseas inscribirte para el
                período lectivo actual
              </p>

              <Card className="p-6">
                <div className="grid grid-cols-2">
                  <div>
                    <h2 className="text-xl font-semibold text-black-600 dark:text-white-600 mb">
                      Período de Inscripción Activo
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {currentCuatrimestre} Cuatrimestre {currentYear}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">
                      Válido desde
                    </p>
                    <p className="text-sm">
                      {fechaInicio} al {fechaFin}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Componente CursadasTable */}
              <div className="mt-8">
                <CursadasTable
                  cursadas={cursadas}
                  cursadasInscripto={cursadasInscripto}
                  alumno={alumno}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}