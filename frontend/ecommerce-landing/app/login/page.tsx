"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Factory, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { authApi, tokenManager, onboardingManager, LoginRequest, ApiError, validators } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

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
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const savedLanguage = localStorage.getItem("selectedLanguage") || "english"
    setLanguage(savedLanguage)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!validators.email(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }
    
    if (!formData.password.trim()) {
      newErrors.password = "Password is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const loginData: LoginRequest = {
        email: formData.email,
        password: formData.password
      }

      const response = await authApi.login(loginData)
      
      // Store tokens
      tokenManager.setTokens({
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        expires_in: response.expires_in
      })

      toast({
        title: "Login successful!",
        description: "Welcome back to SupplyChain",
      })

      // Check if user needs to complete profile selection
      if (onboardingManager.requiresProfileSelection()) {
        router.push("/profile-selection")
      } else {
        // Redirect to dashboard or home page
        router.push("/dashboard")
      }
      
    } catch (error: any) {
      console.error("Login error:", error)
      
      let errorTitle = "Login failed"
      let errorDescription = "Please check your credentials and try again"

      if (error instanceof ApiError) {
        switch (error.status) {
          case 0:
            // Network errors (no response from server)
            errorTitle = "Connection Error"
            errorDescription = error.message || "Unable to connect to our servers. Please check your internet connection and try again."
            break;

          case 401:
            errorTitle = "Invalid Credentials"
            errorDescription = "The email or password you entered is incorrect. Please try again."
            break;

          case 422:
            errorTitle = "Validation Error"
            if (error.data?.detail && Array.isArray(error.data.detail)) {
              const validationErrors = error.data.detail.map((err: any) => 
                `${err.loc?.join(' -> ') || 'Field'}: ${err.msg}`
              ).join(', ');
              errorDescription = `Please fix: ${validationErrors}`;
            } else {
              errorDescription = "Please check your input and try again.";
            }
            break;

          case 500:
            errorTitle = "Server Error"
            errorDescription = "There was a problem with the server. Please try again later."
            break;

          default:
            errorTitle = "Login Error"
            errorDescription = error.message || "An unexpected error occurred. Please try again."
        }
      } else {
        errorDescription = error?.message || "Network error. Please check your connection and try again."
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const t = translations[language as keyof typeof translations] || translations.english

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/landing" className="inline-flex items-center space-x-2">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <Factory className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">SupplyChain</span>
          </Link>
        </div>

        <Card className="shadow-lg border-0 rounded-xl bg-zinc-900 border-zinc-800">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-white">{t.welcomeBack}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-zinc-300">
                  {t.email}
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  className={`rounded-lg bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-teal-500 focus:ring-teal-500 ${
                    errors.email ? 'border-red-500' : ''
                  }`}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-red-400">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-zinc-300">
                  {t.password}
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className={`rounded-lg bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-teal-500 focus:ring-teal-500 ${
                    errors.password ? 'border-red-500' : ''
                  }`}
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="text-sm text-red-400">{errors.password}</p>
                )}
              </div>

              <Button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  t.loginButton
                )}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-zinc-400">
                {t.noAccount}{" "}
                <Link href="/signup" className="text-teal-400 hover:text-teal-300 font-medium">
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
