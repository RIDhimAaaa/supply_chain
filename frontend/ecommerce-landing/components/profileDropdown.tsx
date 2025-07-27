"use client"

import { User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ProfileDropdown() {
  return (
    <div className="flex items-center space-x-4">
      {/* Profile Info with Hover Effect */}
      <div className="group relative">
        <div className="flex items-center space-x-3 glass-button px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 hover:bg-white/10">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center ring-2 ring-white/20">
            <User className="h-5 w-5 text-white" />
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-white font-semibold text-sm">Rajesh Kumar</p>
            <p className="text-white/60 text-xs">Admin • Online</p>
          </div>
        </div>

        {/* Hover Card */}
        <div className="absolute left-0 top-16 w-80 glass-card p-6 z-[100000] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center ring-4 ring-white/10">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Rajesh Kumar</h3>
              <p className="text-white/70 text-sm mb-1">rajesh@supplychain.com</p>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-green-400 text-xs font-medium">Online</span>
                <span className="text-white/50 text-xs">•</span>
                <span className="text-purple-400 text-xs font-medium">Administrator</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
              <p className="text-white font-bold text-lg">24</p>
              <p className="text-white/60 text-xs">Orders</p>
            </div>
            <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
              <p className="text-white font-bold text-lg">156</p>
              <p className="text-white/60 text-xs">Products</p>
            </div>
            <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
              <p className="text-white font-bold text-lg">8</p>
              <p className="text-white/60 text-xs">Vendors</p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Role:</span>
              <span className="text-white">System Administrator</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Last Login:</span>
              <span className="text-white">Today, 9:30 AM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Location:</span>
              <span className="text-white">Mumbai, India</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sign Out Button */}
      <Button
        onClick={() => console.log("Sign out")}
        variant="ghost"
        className="glass-button text-red-400 hover:text-red-300 hover:bg-red-500/10 px-4 py-3 rounded-xl transition-all duration-300"
      >
        <LogOut className="h-4 w-4 mr-2" />
        <span className="hidden lg:inline font-medium">Sign Out</span>
      </Button>
    </div>
  )
}
