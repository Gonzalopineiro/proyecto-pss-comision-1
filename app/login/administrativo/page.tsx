import React from "react"
import { redirect } from "next/navigation"

export default function AdministrativoLoginRedirect(){
  redirect('/login?role=administrativo')
}