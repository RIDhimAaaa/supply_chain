"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ProfileDropdown } from "@/components/profileDropdown"

export function DashboardHeader() {
  return (
    <header className="glass-header p-6 lg:p-8 futuristic-glow">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
        {/* Left side with Profile and App Name */}
        <div className="flex items-center space-x-6">
          <ProfileDropdown />
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">SupplyChain</h1>
            <p className="text-white/70 text-lg">Manage your groceries and track orders with precision</p>
          </div>
        </div>

        {/* Right side with Search */}
        <div className="flex items-center">
          <div className="relative flex-1 lg:flex-none lg:w-96">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
            <Input
              placeholder="Search groceries, orders, vendors..."
              className="glass-input pl-12 h-12 text-lg rounded-2xl"
            />
          </div>
        </div>
      </div>
    </header>
  )
}
