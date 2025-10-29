'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function inscribirseEnCursada(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const cursadaId = Number(formData.get('cursadaId'))

  // Obtener usuario actual
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
    console.error('No hay sesión activa')
    return
  }

  // Verificar si ya está inscripto
  const { data: existing } = await supabase
    .from('inscripciones_cursada')
    .select('id')
    .eq('alumno_id', userData.user.id)
    .eq('cursada_id', cursadaId)
    .maybeSingle()

  if (existing) {
    console.log('Ya estás inscripto en esta cursada')
    return
  }

  // Insertar
  const { error } = await supabase.from('inscripciones_cursada').insert({
    alumno_id: userData.user.id,
    cursada_id: cursadaId,
    fecha_inscripcion: new Date().toISOString()
  })

  if (error) {
    console.error('Error al inscribirse:', error)
    return
  }

  revalidatePath('/dashboard/alumno/materias/inscripcion')
  console.log('Inscripción realizada correctamente')
}