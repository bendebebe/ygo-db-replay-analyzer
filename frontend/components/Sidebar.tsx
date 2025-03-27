"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, List, Menu, X, ChevronLeft, ChevronRight, User, LogOut } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth/context"
export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const auth = useAuth()

  // Check if we're on mobile
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setIsCollapsed(true)
      }
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: auth.isAuthenticated ? "/logout" : "/login", label: auth.isAuthenticated ? "Logout" : "Login", icon: auth.isAuthenticated ? LogOut : User },
  ]
  if (auth.isAuthenticated) {
    navItems.push({ href: "/sessions", label: "Saved Sessions", icon: List })
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-primary text-primary-foreground md:hidden"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 app-gradient-bg transform transition-all duration-300 ease-in-out border-r border-white/10 md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-20" : "w-64",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div
            className={cn(
              "p-4 border-b border-white/10 flex items-center",
              isCollapsed ? "justify-center" : "justify-between",
            )}
          >
            {!isCollapsed && (
              <Link
                href="/"
                className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500"
              >
                Yu-Gi-Oh! FYI
              </Link>
            )}

            {/* Collapse toggle button */}
            <button onClick={toggleCollapse} className="p-2 rounded-full hover:bg-white/10 transition-colors">
              {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>

          {/* Sidebar content */}
          <nav className="flex-1 p-2 overflow-y-auto">
            <div className="space-y-2 mt-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-lg transition-all duration-200",
                      isCollapsed ? "justify-center p-3" : "p-3",
                      isActive
                        ? "bg-primary/20 text-primary border-l-4 border-primary"
                        : "hover:bg-white/10 border-l-4 border-transparent",
                    )}
                    onClick={() => isMobile && setIsOpen(false)}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <item.icon className={cn("h-5 w-5", isCollapsed ? "" : "mr-3")} />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* Sidebar footer */}
          {!isCollapsed && (
            <div className="p-4 border-t border-white/10">
              <div className="rounded-lg p-2">
                <p className="text-sm text-gray-300">Analyze your duels and improve your strategy</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}

