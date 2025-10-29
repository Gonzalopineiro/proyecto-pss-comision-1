import SidebarAlumno from "@/components/ui/sidebar_alumno";
import { obtenerMesasDisponibles, MesaDisponible } from "./actions";
import MesasTable from "./MesasTable";
import { createClient } from "@/utils/supabase/server";

export default async function InscripcionExamenesPage() {
  const supabase = await createClient();

  // Obtener mesas
  const mesas: MesaDisponible[] = await obtenerMesasDisponibles();

  // Obtener usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <p>No hay sesión activa</p>;

  // Obtener datos del alumno desde tabla 'usuarios'
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("nombre, apellido, legajo, email")
    .eq("email", user.email)
    .maybeSingle();

  if (!usuario) return <p>No se pudo obtener la información del alumno</p>;

  const alumno = {
    nombre: `${usuario.nombre} ${usuario.apellido}`,
    legajo: usuario.legajo,
    mail: usuario.email,
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex">
        <aside className="w-64">
          <SidebarAlumno />
        </aside>
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto mt-6">
            <h1 className="text-3xl font-bold tracking-tight mb-4">
              Inscripción a Exámenes
            </h1>
            <p className="text-muted-foreground mb-6">
              Selecciona los exámenes a los que deseas inscribirte para el
              período lectivo actual
            </p>

            <MesasTable mesas={mesas} alumno={alumno} />
          </div>
        </main>
      </div>
    </div>
  );
}