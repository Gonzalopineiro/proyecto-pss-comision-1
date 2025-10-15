'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

// Acción para verificar si el usuario está autenticado y redirigir al dashboard si es así
export async function checkAuthAndRedirect() {
  const supabase = await createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  /*if (session) {
    redirect('/dashboard')
  }*/
  
  return { isAuthenticated: false }
}