import { login } from './actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 items-center text-center">
          <div className="mx-auto mb-4">
            <svg className="size-16 text-slate-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z"/>
              <circle cx="12" cy="8" r="2"/>
              <path d="M12 10v4"/>
              <path d="M12 18v.01"/>
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
          <CardDescription>Accede al sistema con tus credenciales</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="legajo" className="text-sm font-medium">Legajo</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <svg className="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="14" x="3" y="5" rx="2"/>
                    <path d="M7 7h.01"/>
                    <path d="M17 7h.01"/>
                    <rect width="10" height="4" x="7" y="11" rx="1"/>
                  </svg>
                </div>
                <input 
                  id="legajo" 
                  name="legajo" 
                  type="text" 
                  className="block w-full pl-10 py-2 border rounded-md focus:ring-2 focus:ring-offset-1 focus:outline-none" 
                  placeholder="Ingresa tu legajo" 
                  required 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <svg className="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <input 
                  id="password" 
                  name="password" 
                  type="password" 
                  className="block w-full pl-10 py-2 border rounded-md focus:ring-2 focus:ring-offset-1 focus:outline-none" 
                  placeholder="Ingresa tu contraseña" 
                  required 
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember" name="remember" type="checkbox" className="size-4 rounded border-gray-300" />
                <label htmlFor="remember" className="ml-2 text-sm">Recordarme</label>
              </div>
              <a href="#" className="text-sm text-blue-600 hover:underline">¿Olvidaste tu contraseña?</a>
            </div>
            
            <Button 
              className="w-full py-2 mt-4 bg-slate-800 hover:bg-slate-700 text-white rounded-md transition-colors" 
              formAction={login}
            >
              Iniciar Sesión
            </Button>
            
            <p className="text-center text-sm text-gray-500 mt-4">
              La sesión expira automáticamente tras 20 minutos de inactividad
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}