import React from "react"
import { redirect } from "next/navigation"

export default function DocenteLoginRedirect(){
  redirect('/login?role=docente')
}