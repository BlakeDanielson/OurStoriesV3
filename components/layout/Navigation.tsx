'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Menu,
  X,
  BookOpen,
  User,
  Settings,
  LogOut,
  LayoutDashboard,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavigationItem {
  href: string
  label: string
  icon?: React.ReactNode
}

const navigationItems: NavigationItem[] = [
  { href: '/', label: 'Home' },
  { href: '/stories', label: 'Stories' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
]

const userMenuItems: NavigationItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  { href: '/profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  {
    href: '/settings',
    label: 'Settings',
    icon: <Settings className="w-4 h-4" />,
  },
]

// Development/Testing menu items (only show in development)
const devMenuItems: NavigationItem[] = [
  { href: '/test-text-generation', label: 'Text Generation Test' },
  { href: '/test-child-photos', label: 'Child Photos Test' },
  { href: '/test-character-images', label: 'Character Images Test' },
  { href: '/test-character-consistency', label: 'Character Consistency Test' },
]

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const { user, signOut, loading } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const getUserInitials = (email: string) => {
    return email.charAt(0).toUpperCase()
  }

  return (
    <>
      {/* Skip to main content link for screen readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Skip to main content
      </a>

      <header
        className={cn(
          'sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-200',
          isScrolled && 'shadow-sm'
        )}
        role="banner"
      >
        <nav
          className="container mx-auto px-4 h-16 flex items-center justify-between"
          role="navigation"
          aria-label="Main navigation"
        >
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md"
            aria-label="ourStories - Go to homepage"
          >
            <BookOpen className="h-6 w-6 text-primary" aria-hidden="true" />
            <span className="font-bold text-xl">ourStories</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <ul className="flex items-center space-x-6" role="menubar">
              {navigationItems.map(item => (
                <li key={item.href} role="none">
                  <Link
                    href={item.href}
                    className={cn(
                      'text-sm font-medium transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md px-2 py-1',
                      pathname === item.href
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    )}
                    role="menuitem"
                    aria-current={pathname === item.href ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Auth Section */}
            {!loading && (
              <div className="flex items-center space-x-2">
                {user ? (
                  // User Menu
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="relative h-8 w-8 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={user.user_metadata?.avatar_url}
                            alt="Profile"
                          />
                          <AvatarFallback>
                            {getUserInitials(user.email || 'U')}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-56"
                      align="end"
                      forceMount
                    >
                      <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-1 leading-none">
                          <p className="font-medium">
                            {user.user_metadata?.full_name || 'User'}
                          </p>
                          <p className="w-[200px] truncate text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      {userMenuItems.map(item => (
                        <DropdownMenuItem key={item.href} asChild>
                          <Link href={item.href} className="flex items-center">
                            {item.icon}
                            <span className="ml-2">{item.label}</span>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleSignOut}
                        className="cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="ml-2">Sign Out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  // Guest Buttons
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <Link href="/auth/signin">Sign In</Link>
                    </Button>
                    <Button
                      size="sm"
                      asChild
                      className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <Link href="/auth/signup">Get Started</Link>
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                aria-label={isOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isOpen}
                aria-controls="mobile-menu"
              >
                {isOpen ? (
                  <X className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Menu className="h-5 w-5" aria-hidden="true" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] sm:w-[400px]"
              id="mobile-menu"
              aria-label="Mobile navigation menu"
            >
              <div className="flex flex-col space-y-6 mt-6">
                {/* Mobile Navigation Links */}
                <nav aria-label="Mobile navigation">
                  <ul className="flex flex-col space-y-4" role="menu">
                    {navigationItems.map(item => (
                      <li key={item.href} role="none">
                        <Link
                          href={item.href}
                          className={cn(
                            'block px-3 py-2 text-base font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                            pathname === item.href
                              ? 'bg-accent text-accent-foreground'
                              : 'text-foreground'
                          )}
                          role="menuitem"
                          aria-current={
                            pathname === item.href ? 'page' : undefined
                          }
                          onClick={() => setIsOpen(false)}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>

                {/* Mobile User Section */}
                {!loading && (
                  <div className="pt-6 border-t">
                    {user ? (
                      <div className="space-y-4">
                        {/* User Info */}
                        <div className="flex items-center gap-3 px-3 py-2">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={user.user_metadata?.avatar_url}
                              alt="Profile"
                            />
                            <AvatarFallback>
                              {getUserInitials(user.email || 'U')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <p className="font-medium text-sm">
                              {user.user_metadata?.full_name || 'User'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>

                        {/* User Menu Items */}
                        <ul className="flex flex-col space-y-2" role="menu">
                          {userMenuItems.map(item => (
                            <li key={item.href} role="none">
                              <Link
                                href={item.href}
                                className={cn(
                                  'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                                  pathname === item.href
                                    ? 'bg-accent text-accent-foreground'
                                    : 'text-foreground'
                                )}
                                role="menuitem"
                                aria-current={
                                  pathname === item.href ? 'page' : undefined
                                }
                                onClick={() => setIsOpen(false)}
                              >
                                {item.icon}
                                {item.label}
                              </Link>
                            </li>
                          ))}
                        </ul>

                        {/* Sign Out Button */}
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => {
                            handleSignOut()
                            setIsOpen(false)
                          }}
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign Out
                        </Button>
                      </div>
                    ) : (
                      // Mobile Auth Buttons
                      <div className="flex flex-col space-y-3">
                        <Button
                          variant="outline"
                          asChild
                          className="w-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                          <Link
                            href="/auth/signin"
                            onClick={() => setIsOpen(false)}
                          >
                            Sign In
                          </Link>
                        </Button>
                        <Button
                          asChild
                          className="w-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                          <Link
                            href="/auth/signup"
                            onClick={() => setIsOpen(false)}
                          >
                            Get Started
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </header>
    </>
  )
}
