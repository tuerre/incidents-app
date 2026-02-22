'use client'

import * as React from "react"

export function MountedOnly({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null
    }

    return <>{children}</>
}
