 'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'

export function Header() {
  const [loggedIn, setLoggedIn] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (mounted) setLoggedIn(!!user)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session?.user)
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const onLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  // Handle dashboard button click
  // If already on dashboard, force refresh to reset to step 1
  const handleDashboardClick = (e: React.MouseEvent) => {
    console.log('Dashboard button clicked. Current path:', pathname)
    if (pathname === '/dashboard') {
      e.preventDefault()
      console.log('Already on dashboard - forcing reload')
      // Force page reload to reset dashboard to step 1
      // Use router.refresh() first, then fallback to full reload
      window.location.reload()
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-brand-softGrey/80 backdrop-blur supports-[backdrop-filter]:bg-brand-softGrey/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          {/* Left: Logo + Brand */}
          <Link href="/" className="flex items-center gap-3">
            {/* Real logo */}
            <Image
              src="/images/Logo_01.png"
              alt="Rekruna logo"
              width={32}
              height={32}
              priority
              className="h-8 w-auto"
            />
            <span className="text-3xl font-semibold text-gray-900">Rekruna</span>
          </Link>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {!loggedIn ? (
              <>
                <Link href="/login">
                  <Button variant="outline">Log ind</Button>
                </Link>
                <Link href="/#pricing">
                  <Button className="">Start i dag</Button>
                </Link>
              </>
            ) : (
              <>
                {/* Profile button - only visible when logged in */}
                <Link href="/dinprofil">
                  <Button variant="outline">Profil</Button>
                </Link>
                {/* Dashboard button - only visible when logged in */}
                {/* Refreshes page if already on dashboard to reset to step 1 */}
                <Link href="/dashboard" onClick={handleDashboardClick}>
                  <Button variant="outline">Dashboard</Button>
                </Link>
                {/* Logout button */}
                <Button variant="outline" onClick={onLogout}>Log ud</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
