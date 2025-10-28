import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

export function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      className={`w-full mt-1 p-2 rounded border bg-white dark:bg-slate-800 dark:border-slate-600 ${className}`}
      {...props}
    />
  )
}