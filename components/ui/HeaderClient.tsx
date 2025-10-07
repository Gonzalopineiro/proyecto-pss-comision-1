"use client"
import React from 'react'
import Header from './header'

export default function HeaderClient({ name, role }: { name: string; role: string }){
  return <Header name={name} role={role} />
}
