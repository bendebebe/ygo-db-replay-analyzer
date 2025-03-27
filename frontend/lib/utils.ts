import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const gradientText = (className?: string) => {
  return cn(
    "bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500",
    className
  )
}

export const cardStyle = (className?: string) => {
  return cn(
    "bg-black/40 border-white/10 backdrop-blur-sm shadow-xl",
    className
  )
}

export const buttonGradient = (className?: string) => {
  return cn(
    "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
    className
  )
}