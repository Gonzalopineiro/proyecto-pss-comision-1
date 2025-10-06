"use client"
import React from "react"
import { LoginForm } from "./LoginForm"

export default function LoginPage({ searchParams }: { searchParams?: { role?: string } }) {
  const role = searchParams?.role ?? ""

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
      <div className="w-full max-w-md">
        <LoginForm role={role} />
      </div>
    </div>
  )
}
