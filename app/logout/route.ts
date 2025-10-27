import { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Cerrar sesión en Supabase
    await supabase.auth.signOut()
    
    // Redirigir al login
    redirect('/login')
  } catch (error) {
    console.error('Error al cerrar sesión:', error)
    redirect('/login')
  }
}