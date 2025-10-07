"use client"
import React, { useState } from 'react'
import CrearMateriaForm from './CrearMateriaForm'

export default function CrearMateriaModal({ children }:{ children?: React.ReactNode }){
  const [open, setOpen] = useState(false)

  return (
    <>
      <div onClick={() => setOpen(true)} className="cursor-pointer">{children}</div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-3xl px-4">
            <CrearMateriaForm onCancel={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
