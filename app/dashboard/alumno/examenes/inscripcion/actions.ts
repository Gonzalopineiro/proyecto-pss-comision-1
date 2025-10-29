"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache"; // 🔹 Importar para revalidar ruta

export interface MesaDisponible {
  id: string;
  materia_id: string;
  fecha_examen: string;
  hora_examen: string;
  ubicacion: string;
  estado: string;
  materias: { nombre: string };
  materia_nombre: string;
  ya_inscripto: boolean;
}

interface MesaRaw {
  id: string;
  materia_id: string;
  fecha_examen: string;
  hora_examen: string;
  ubicacion: string;
  estado: string;
  materias: { nombre: string } | { nombre: string }[];
}

export async function obtenerMesasDisponibles(): Promise<MesaDisponible[]> {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return [];

  const userId = userData.user.id;

  const { data: alumno } = await supabase
    .from("usuarios")
    .select("carrera_id")
    .eq("email", userData.user.email)
    .single();
  if (!alumno) return [];

  const { data: carrera } = await supabase
    .from("carreras")
    .select("plan_de_estudio_id")
    .eq("id", alumno.carrera_id)
    .single();
  if (!carrera) return [];

  const { data: materiasPlan } = await supabase
    .from("plan_materia")
    .select("materia_id")
    .eq("plan_id", carrera.plan_de_estudio_id);

  if (!materiasPlan) return [];
  const materiasIds = materiasPlan.map((m) => m.materia_id);
  if (materiasIds.length === 0) return [];

  const { data: mesas } = await supabase
    .from("mesas_examen")
    .select(`
      id,
      materia_id,
      fecha_examen,
      hora_examen,
      ubicacion,
      estado,
      materias (nombre)
    `)
    .eq("estado", "programada")
    .in("materia_id", materiasIds);

  if (!mesas) return [];

  const { data: inscripciones } = await supabase
    .from("inscripciones_mesa_examen")
    .select("mesa_examen_id")
    .eq("estudiante_id", userId);

  const inscriptasIds = new Set(
    (inscripciones || []).map((i) => i.mesa_examen_id)
  );

  return (mesas as MesaRaw[]).map((mesa) => {
    const materia =
      Array.isArray(mesa.materias) && mesa.materias.length > 0
        ? mesa.materias[0]
        : (mesa.materias as { nombre: string });

    return {
      ...mesa,
      materias: materia,
      materia_nombre: materia?.nombre ?? "—",
      ya_inscripto: inscriptasIds.has(mesa.id),
    };
  });
}

// 🔹 Server Action con revalidación de la página
export async function inscribirseEnMesa(formData: FormData) {
  const mesaId = formData.get("mesaId") as string;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("inscripciones_mesa_examen").insert({
    mesa_examen_id: mesaId,
    estudiante_id: user.id,
    fecha_inscripcion: new Date().toISOString(),
  });

  // 🔹 Revalidar la ruta para que la página se vuelva a renderizar con los datos actualizados
  revalidatePath("/dashboard/alumno/examenes/inscripcion");
}