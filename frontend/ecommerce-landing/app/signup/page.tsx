"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import Link from "next/link"
import { Factory, Package, Search } from "lucide-react"
import { useSearchParams } from "next/navigation"

const translations = {
  english: {
    createAccount: "Create Your Account",
    accountType: "I want to",
    supplier: "Sell raw materials (Supplier)",
    vendor: "Buy raw materials (Vendor)",
    email: "Email",
    password: "Password",
    signUpButton: "Sign Up",
    haveAccount: "Already have an account?",
    loginLink: "Login",
  },
  punjabi: {
    createAccount: "ਨਵਾਂ ਖਾਤਾ ਬਣਾਓ",
    accountType: "ਮੈਂ ਚਾਹੁੰਦਾ ਹਾਂ",
    supplier: "ਕੱਚਾ ਮਾਲ ਵੇਚਣਾ (ਸਪਲਾਈਅਰ)",
    vendor: "ਕੱਚਾ ਮਾਲ ਖਰੀਦਣਾ (ਖਰੀਦਦਾਰ)",
    email: "ਈਮੇਲ",
    password: "ਪਾਸਵਰਡ",
    signUpButton: "ਸਾਈਨ ਅਪ ਕਰੋ",
    haveAccount: "ਪਹਿਲਾਂ ਤੋਂ ਖਾਤਾ ਹੈ?",
    loginLink: "ਲਾਗਇਨ ਕਰੋ",
  },
  hindi: {
    createAccount: "नया खाता बनाएं",
    accountType: "मैं चाहता हूं",
    supplier: "कच्चा माल बेचना (सप्लायर)",
    vendor: "कच्चा माल खरीदना (खरीदार)",
    email: "ईमेल",
    password: "पासवर्ड",
    signUpButton: "साइन अप करें",
    haveAccount: "पहले से खाता है?",
    loginLink: "लॉगिन करें",
  },
}

export default function SignUpPage() {
  const [language, setLanguage] = useState("english")
  const [accountType, setAccountType] = useState("supplier")
  const searchParams = useSearchParams()

  useEffect(() => {
    const savedLanguage = localStorage.getItem("selectedLanguage") || "english"
    setLanguage(savedLanguage)

    // Set account type from URL parameter
    const type = searchParams.get("type")
    if (type === "supplier" || type === "vendor") {
      setAccountType(type)
    }
  }, [searchParams])

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
            <CardTitle className="text-2xl font-bold text-gray-900">{t.createAccount}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {/* Account Type Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">{t.accountType}</Label>
                <RadioGroup value={accountType} onValueChange={setAccountType} className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-teal-50 transition-colors">
                    <RadioGroupItem value="supplier" id="supplier" />
                    <div className="flex items-center space-x-2">
                      <Package className="w-4 h-4 text-teal-600" />
                      <Label htmlFor="supplier" className="text-sm cursor-pointer">
                        {t.supplier}
                      </Label>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-teal-50 transition-colors">
                    <RadioGroupItem value="vendor" id="vendor" />
                    <div className="flex items-center space-x-2">
                      <Search className="w-4 h-4 text-teal-600" />
                      <Label htmlFor="vendor" className="text-sm cursor-pointer">
                        {t.vendor}
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

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
                  placeholder="Create a password"
                  className="rounded-lg border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                />
              </div>
            </div>

            <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg">
              {t.signUpButton}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                {t.haveAccount}{" "}
                <Link href="/login" className="text-teal-600 hover:text-teal-700 font-medium">
                  {t.loginLink}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
