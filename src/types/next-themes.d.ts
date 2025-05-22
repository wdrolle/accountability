declare module 'next-themes' {
  import { JSX, ReactNode } from 'react'

  export interface ThemeProviderProps {
    children: ReactNode
    defaultTheme?: string
    attribute?: string
    value?: Record<string, any>
    enableSystem?: boolean
    disableTransitionOnChange?: boolean
    storageKey?: string
    themes?: string[]
  }

  export function ThemeProvider(props: ThemeProviderProps): JSX.Element
} 