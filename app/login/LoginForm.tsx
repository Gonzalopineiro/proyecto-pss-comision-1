"use client"
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { User, Lock, GraduationCap, Briefcase, Mail } from 'lucide-react'

export function LoginForm({ role }: { role?: string }) {
  const router = useRouter()
  const [legajo, setLegajo] = useState("")
  const [password, setPassword] = useState("")
  const [selectedRole, setSelectedRole] = useState(role || "estudiante")
  const [errors, setErrors] = useState<{ legajo?: string; password?: string; server?: string }>()
  const [loading, setLoading] = useState(false)
  const [remember, setRemember] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotLegajo, setForgotLegajo] = useState("")
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotErrors, setForgotErrors] = useState<{ legajo?: string; email?: string; server?: string }>()
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotMessage, setForgotMessage] = useState<string | null>(null)

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('siu_legajo')
      if (saved) {
        setLegajo(saved)
        setRemember(true)
      }
    } catch (e) {
      // ignore
    }
  }, [])

  function validate() {
    const e: { legajo?: string; password?: string } = {}
    if (!legajo || legajo.trim() === "") e.legajo = "El legajo es obligatorio"
    else if (!/^[0-9]{3,}$/.test(String(legajo))) e.legajo = "El legajo debe ser numérico y tener al menos 3 dígitos"

    if (!password || password.trim() === "") e.password = "La contraseña es obligatoria"

    setErrors(Object.keys(e).length ? e : undefined)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors(undefined)
    if (!validate()) return
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ legajo, password, role: selectedRole, remember })
      })

      const data = await res.json()
      if (!res.ok) {
        setErrors({ server: data?.error || 'Error en el servidor' })
        setLoading(false)
        return
      }

      // Persistir legajo en localStorage si el usuario lo pidió
      try {
        if (remember) localStorage.setItem('siu_legajo', String(legajo))
        else localStorage.removeItem('siu_legajo')
      } catch (e) {
        // ignore
      }

      // Login correcto; ir al dashboard según rol
      if (selectedRole === "estudiante") router.push("/dashboard/estudiante")
      else if (selectedRole === "docente") router.push("/dashboard/docente")
      else if (selectedRole === "administrativo") router.push("/dashboard/administrativo")
      else router.push("/")
    } catch (err) {
      setErrors({ server: 'Error de red' })
      setLoading(false)
    }
  }
  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-md">
        <div className="flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-4">
            {selectedRole === 'estudiante' ? (
              <GraduationCap className="h-7 w-7 text-blue-600" />
            ) : selectedRole === 'docente' ? (
              <Briefcase className="h-7 w-7 text-green-600" />
            ) : (
              <User className="h-7 w-7 text-red-600" />
            )}
          </div>
          <h2 className="text-2xl font-semibold mb-1">Iniciar Sesión</h2>
          <p className="text-sm text-gray-500 mb-6">Accede al sistema con tus credenciales</p>
        </div>

        <label className="text-sm block">Rol</label>
        {/* Si el rol viene por prop, mostrar texto fijo para evitar confusión */}
        {role ? (
          <div className="w-full mb-4 mt-1 p-2 rounded border bg-gray-50 dark:bg-slate-700 text-sm">{selectedRole}</div>
        ) : (
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full mb-4 mt-1 p-2 rounded border"
          >
            <option value="estudiante">Estudiante</option>
            <option value="docente">Docente</option>
            <option value="administrativo">Administrativo</option>
          </select>
        )}

        <label className="text-sm">Legajo</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            value={legajo}
            onChange={(e) => setLegajo(e.target.value)}
            className={`w-full mb-1 mt-1 p-3 pl-10 rounded-lg border ${errors?.legajo ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'} bg-white dark:bg-slate-800`}
            placeholder="Ingresa tu legajo"
            aria-invalid={errors?.legajo ? true : false}
          />
        </div>
        {errors?.legajo && <p className="text-xs text-red-600 mb-2">{errors.legajo}</p>}

        <label className="text-sm">Contraseña</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className={`w-full mb-3 mt-1 p-3 pl-10 rounded-lg border ${errors?.password ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'} bg-white dark:bg-slate-800`}
            placeholder="Ingresa tu contraseña"
            aria-invalid={errors?.password ? true : false}
          />
        </div>
        {errors?.password && <p className="text-xs text-red-600 mb-2">{errors.password}</p>}

        {errors?.server && <p className="text-sm text-red-600 mb-2">{errors.server}</p>}

        <div className="flex items-center justify-between mb-4">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-4 h-4" />
            <span>Recordarme</span>
          </label>
          <button type="button" onClick={() => { setForgotOpen(true); setForgotLegajo(legajo || ''); setForgotEmail('') }} className="text-sm text-slate-600 hover:underline">¿Olvidaste tu contraseña?</button>
        </div>

        <Button type="submit" variant="primary-dark" className="w-full py-3" disabled={loading}>
          {loading ? 'Ingresando...' : 'Iniciar Sesión'}
        </Button>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">La sesión expira automáticamente tras 20 minutos de inactividad</p>
      </form>

      {/* Forgot password modal */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setForgotOpen(false)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-semibold mb-2">Recuperar contraseña</h3>
            <p className="text-sm text-gray-600 mb-4">Ingresa los siguientes datos para recibir instrucciones.</p>

            <label className="text-sm">Legajo</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input value={forgotLegajo} onChange={(e) => setForgotLegajo(e.target.value)} className={`w-full mb-2 mt-1 p-3 pl-10 rounded-lg border border-gray-200 dark:border-slate-700`} placeholder="Legajo" />
            </div>

            <label className="text-sm">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className={`w-full mb-3 mt-1 p-3 pl-10 rounded-lg border border-gray-200 dark:border-slate-700`} placeholder="tu@email.com" />
            </div>

            {forgotErrors?.server && <p className="text-sm text-red-600 mb-2">{forgotErrors.server}</p>}
            {forgotMessage && <p className="text-sm text-green-600 mb-2">{forgotMessage}</p>}

            <div className="flex items-center justify-end gap-3">
              <button type="button" className="px-4 py-2 rounded-md border" onClick={() => setForgotOpen(false)}>Cancelar</button>
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-slate-900 text-white"
                onClick={async () => {
                  setForgotErrors(undefined)
                  setForgotMessage(null)
                  setForgotLoading(true)
                  try {
                    const res = await fetch('/api/auth/forgot', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ legajo: forgotLegajo, email: forgotEmail })
                    })
                    const data = await res.json()
                    if (!res.ok) {
                      setForgotErrors({ server: data?.error || 'Error' })
                    } else {
                      setForgotMessage(data?.message || 'Revisa tu email')
                    }
                  } catch (e) {
                    setForgotErrors({ server: 'Error de red' })
                  } finally {
                    setForgotLoading(false)
                  }
                }}
              >
                {forgotLoading ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LoginForm
