'use server'

import { z } from 'zod'

// Esquema de validación para los datos de la materia
export const materiaSchema = z.object({
  codigo: z.string()
    .min(1, 'El código es obligatorio')
    .max(20, 'El código no puede tener más de 20 caracteres'),
  nombre: z.string()
    .min(1, 'El nombre es obligatorio')
    .max(100, 'El nombre no puede tener más de 100 caracteres'),
  descripcion: z.string()
    .min(1, 'La descripción es obligatoria')
    .max(500, 'La descripción no puede tener más de 500 caracteres'),
  duracion: z.enum(['Anual', 'Cuatrimestral'], {
    errorMap: () => ({ message: 'La duración debe ser Anual o Cuatrimestral' })
  })
})

export type MateriaFormData = z.infer<typeof materiaSchema>

// Función para validar los datos del formulario
export function validateMateriaForm(data: Partial<MateriaFormData>) {
  const result = materiaSchema.safeParse(data)
  
  if (!result.success) {
    // Convertir errores de Zod a un formato más amigable
    const formattedErrors: Record<string, string> = {}
    
    result.error.issues.forEach(issue => {
      const path = issue.path[0] as string
      formattedErrors[path] = issue.message
    })
    
    return { success: false, errors: formattedErrors }
  }
  
  return { success: true, data: result.data }
}