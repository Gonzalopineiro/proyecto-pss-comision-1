"use client"
import React from 'react'
import Header from './header'

export default function HeaderClient({ legajo, role }: { legajo: string; role: string }){
  return <Header legajo={legajo} role={role} />
}
