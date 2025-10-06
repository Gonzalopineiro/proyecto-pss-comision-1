import React from "react"
import { redirect } from "next/navigation"

export default function AlumnoLoginRedirect(){
  redirect('/login?role=estudiante')
}