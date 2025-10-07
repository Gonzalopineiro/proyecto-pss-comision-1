"use client"

import React from "react"
import { LoginForm } from "./LoginForm"
import { useSearchParams } from "next/navigation"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const role = searchParams.get("role") ?? ""

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
      <div className="w-full max-w-md">
        <LoginForm role={role} />
      </div>
    </div>
  )
}
