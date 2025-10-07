import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-transform disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-4 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:brightness-95 shadow-md transform-gpu hover:-translate-y-0.5 focus-visible:ring-indigo-300",
        "primary-dark": "bg-slate-900 text-white hover:bg-slate-800 shadow-lg",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 shadow-sm focus-visible:ring-red-200",
        outline:
          "border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 shadow-sm dark:border-gray-700 dark:bg-slate-800 dark:text-gray-100",
        secondary:
          "bg-slate-100 text-slate-900 hover:bg-slate-200 shadow-sm dark:bg-slate-700 dark:text-slate-100",
        ghost:
          "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200",
        link: "text-indigo-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 has-[>svg]:px-3 rounded-2xl",
        sm: "h-9 gap-2 px-3 rounded-xl",
        lg: "h-12 px-6 rounded-3xl",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
