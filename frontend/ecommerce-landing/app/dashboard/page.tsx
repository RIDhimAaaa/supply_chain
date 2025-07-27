'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { onboardingManager } from '@/lib/api'

export default function Dashboard() {
  const router = useRouter()

  useEffect(() => {
    // Check if user has completed profile selection
    if (onboardingManager.isProfileSelectionPending()) {
      // If user accessed dashboard without selecting profile after signup, redirect back
      router.replace('/profile-selection')
      return
    }

    // If we reach here, user has completed onboarding
    console.log('User has completed onboarding')
  }, [router])

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <p className="text-gray-300">Welcome to your dashboard!</p>
        
        {/* Placeholder content - replace with actual dashboard components */}
        <div className="mt-8 p-6 bg-gray-900 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
          <p className="text-gray-400">Your dashboard is ready to use. Add your dashboard components here.</p>
        </div>
      </div>
    </div>
  )
}
