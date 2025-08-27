import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // CRITICAL FIX: Initialize with false instead of undefined to prevent conditional rendering failures
  // This prevents blank screens on mobile during the initial render cycle
  const [isMobile, setIsMobile] = React.useState(() => {
    // Server-side rendering safe check
    if (typeof window === 'undefined') return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
  })

  React.useEffect(() => {
    // Ensure we have a window object (client-side only)
    if (typeof window === 'undefined') return;
    
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Set initial value immediately to prevent flash
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange);
  }, [])

  // Return boolean directly - no need for !!isMobile since we ensure it's always boolean
  return isMobile
}
