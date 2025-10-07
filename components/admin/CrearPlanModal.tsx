// components/admin/CrearPlanModal.tsx
"use client";
import React, { useState } from 'react';
import CrearPlanForm from './CrearPlanForm';

export default function CrearPlanModal({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {children}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-4xl px-4">
            <CrearPlanForm onCancel={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}