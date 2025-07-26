"use client"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function LanguageSelection() {
  const router = useRouter()

  const handleLanguageSelect = (language: string) => {
    // Store language in localStorage for persistence
    localStorage.setItem("selectedLanguage", language)
    router.push("/landing")
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white">Choose Your Preferred Language</h1>
          <p className="text-lg text-gray-300">Select a language to continue</p>
        </div>

        <div className="space-y-4">
          <Card
            className="cursor-pointer hover:shadow-lg hover:shadow-teal-500/20 transition-all duration-200 border-2 border-gray-700/50 hover:border-teal-500 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => handleLanguageSelect("english")}
          >
            <CardContent className="p-6">
              <div className="text-xl font-semibold text-white">English</div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg hover:shadow-teal-500/20 transition-all duration-200 border-2 border-gray-700/50 hover:border-teal-500 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => handleLanguageSelect("punjabi")}
          >
            <CardContent className="p-6">
              <div className="text-xl font-semibold text-white">ਪੰਜਾਬੀ</div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg hover:shadow-teal-500/20 transition-all duration-200 border-2 border-gray-700/50 hover:border-teal-500 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => handleLanguageSelect("hindi")}
          >
            <CardContent className="p-6">
              <div className="text-xl font-semibold text-white">हिन्दी</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
