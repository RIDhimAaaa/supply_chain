"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Factory } from "lucide-react"

const translations = {
  english: {
    welcomeBack: "Welcome Back",
    email: "Email",
    password: "Password",
    loginButton: "Login",
    noAccount: "Don't have an account?",
    signUpLink: "Sign Up",
  },
  punjabi: {
    welcomeBack: "ਵਾਪਸ ਜੀ ਆਇਆਂ ਨੂੰ",
    email: "ਈਮੇਲ",
    password: "ਪਾਸਵਰਡ",
    loginButton: "ਲਾਗਇਨ ਕਰੋ",
    noAccount: "ਖਾਤਾ ਨਹੀਂ ਹੈ?",
    signUpLink: "ਸਾਈਨ ਅਪ ਕਰੋ",
  },
  hindi: {
    welcomeBack: "वापस आपका स्वागत है",
    email: "ईमेल",
    password: "पासवर्ड",
    loginButton: "लॉगिन करें",
    noAccount: "खाता नहीं है?",
    signUpLink: "साइन अप करें",
  },
}

export default function LoginPage() {
  const [language, setLanguage] = useState("english")

  useEffect(() => {
    const savedLanguage = localStorage.getItem("selectedLanguage") || "english"
    setLanguage(savedLanguage)
  }, [])

  const t = translations[language as keyof typeof translations] || translations.english

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/landing" className="inline-flex items-center space-x-2">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <Factory className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">SupplyChain</span>
          </Link>
        </div>

        <Card className="shadow-lg border-0 rounded-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900">{t.welcomeBack}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  {t.email}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="rounded-lg border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  {t.password}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="rounded-lg border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                />
              </div>
            </div>

            <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg">
              {t.loginButton}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                {t.noAccount}{" "}
                <Link href="/signup" className="text-teal-600 hover:text-teal-700 font-medium">
                  {t.signUpLink}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
