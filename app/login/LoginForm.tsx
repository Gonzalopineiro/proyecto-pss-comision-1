"use client"
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function LoginForm({ role }: { role?: string }) {
  const router = useRouter()
  const [legajo, setLegajo] = useState("")
  const [password, setPassword] = useState("")
  const [selectedRole, setSelectedRole] = useState(role || "estudiante")
  const [errors, setErrors] = useState<{ legajo?: string; password?: string; server?: string }>()
  const [loading, setLoading] = useState(false)

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
        body: JSON.stringify({ legajo, password, role: selectedRole })
      })

      const data = await res.json()
      if (!res.ok) {
        setErrors({ server: data?.error || 'Error en el servidor' })
        setLoading(false)
        return
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
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow">
      <h2 className="text-2xl font-bold mb-4">Iniciar sesión</h2>

      <label className="text-sm">Rol</label>
      {/* Si el rol viene por prop, mostrar texto fijo para evitar confusión */}
      {role ? (
        <div className="w-full mb-4 mt-1 p-2 rounded border bg-gray-50 dark:bg-slate-700">{selectedRole}</div>
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
      <input
        value={legajo}
        onChange={(e) => setLegajo(e.target.value)}
        className={`w-full mb-1 mt-1 p-2 rounded border ${errors?.legajo ? 'border-red-500' : ''}`}
        placeholder="legajo"
        aria-invalid={errors?.legajo ? true : false}
      />
      {errors?.legajo && <p className="text-xs text-red-600 mb-2">{errors.legajo}</p>}

      <label className="text-sm">Contraseña</label>
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        className={`w-full mb-3 mt-1 p-2 rounded border ${errors?.password ? 'border-red-500' : ''}`}
        placeholder="contraseña"
        aria-invalid={errors?.password ? true : false}
      />
      {errors?.password && <p className="text-xs text-red-600 mb-2">{errors.password}</p>}

      {errors?.server && <p className="text-sm text-red-600 mb-2">{errors.server}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Ingresando...' : 'Acceder'}
      </Button>
    </form>
  )
}

export default LoginForm
