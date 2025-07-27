"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Factory, Loader2 } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { authApi, SignupRequest, ApiError, validators, onboardingManager } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import axios from "axios"

const translations = {
  english: {
    createAccount: "Create Your Account",
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    password: "Create Password",
    signUpButton: "Sign Up",
    haveAccount: "Already have an account?",
    loginLink: "Login",
  },
  punjabi: {
    createAccount: "ਨਵਾਂ ਖਾਤਾ ਬਣਾਓ",
    firstName: "ਪਹਿਲਾ ਨਾਮ",
    lastName: "ਆਖਰੀ ਨਾਮ",
    email: "ਈਮੇਲ",
    password: "ਪਾਸਵਰਡ ਬਣਾਓ",
    signUpButton: "ਸਾਈਨ ਅਪ ਕਰੋ",
    haveAccount: "ਪਹਿਲਾਂ ਤੋਂ ਖਾਤਾ ਹੈ?",
    loginLink: "ਲਾਗਇਨ ਕਰੋ",
  },
  hindi: {
    createAccount: "नया खाता बनाएं",
    firstName: "पहला नाम",
    lastName: "अंतिम नाम",
    email: "ईमेल",
    password: "पासवर्ड बनाएं",
    signUpButton: "साइन अप करें",
    haveAccount: "पहले से खाता है?",
    loginLink: "लॉगिन करें",
  },
}

export default function SignUpPage() {
  const [language, setLanguage] = useState("english")
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const savedLanguage = localStorage.getItem("selectedLanguage") || "english"
    setLanguage(savedLanguage)
  }, [searchParams])

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

    // First name validation
    if (!validators.name(formData.firstName)) {
      newErrors.firstName = "First name is required and must be less than 50 characters"
    }

    // Last name validation
    if (!validators.name(formData.lastName)) {
      newErrors.lastName = "Last name is required and must be less than 50 characters"
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!validators.email(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // Password validation
    const passwordValidation = validators.password(formData.password)
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.message || "Password is invalid"
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
      const signupData: SignupRequest = {
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName
      }

      const response = await authApi.signup(signupData)
      
      // Mark signup as complete in onboarding flow
      onboardingManager.markSignupComplete()
      
      toast({
        title: "Account created successfully!",
        description: response.message,
      })

      // Redirect to profile selection page instead of login
      router.push("/profile-selection")
      
    } catch (error: any) {
      console.error("Signup error:", error)
      
      let errorTitle = "Signup failed"
      let errorDescription = "An unexpected error occurred"

      if (error instanceof ApiError) {
        // Handle specific backend error responses
        switch (error.status) {
          case 0:
            // Network errors (no response from server)
            errorTitle = "Connection Error"
            errorDescription = error.message || "Unable to connect to our servers. Please check your internet connection and try again."
            break;

          case 400:
            if (error.message.includes("User may already exist") || error.message.includes("already exist")) {
              errorTitle = "Account Already Exists"
              errorDescription = "An account with this email already exists. Please try logging in instead."
            } else if (error.message.includes("validation")) {
              errorTitle = "Invalid Information"
              errorDescription = "Please check your information and try again."
            } else {
              errorTitle = "Invalid Request"
              errorDescription = error.message || "Please check your information and try again."
            }
            break;

          case 422:
            errorTitle = "Validation Error"
            if (error.data?.detail && Array.isArray(error.data.detail)) {
              // Handle FastAPI validation errors
              const validationErrors = error.data.detail.map((err: any) => 
                `${err.loc?.join(' -> ') || 'Field'}: ${err.msg}`
              ).join(', ');
              errorDescription = `Please fix: ${validationErrors}`;
            } else {
              errorDescription = "Please check your input and try again.";
            }
            break;

          case 500:
            if (error.message.includes("Failed to initialize user role")) {
              errorTitle = "Account Setup Issue"
              errorDescription = "There was a problem setting up your account. Our team has been notified. Please try again later."
            } else if (error.message.includes("Default 'vendor' role not configured")) {
              errorTitle = "System Configuration Error"
              errorDescription = "The system is temporarily unavailable. Please contact support."
            } else {
              errorTitle = "Server Error"
              errorDescription = "Our servers are experiencing issues. Please try again in a few minutes."
            }
            break;

          case 503:
            errorTitle = "Service Unavailable"
            errorDescription = "The service is temporarily unavailable. Please try again later."
            break;

          default:
            errorTitle = "Unexpected Error"
            errorDescription = error.message || "An unexpected error occurred. Please try again."
        }
      } else {
        // Handle network errors
        errorTitle = "Network Error"
        errorDescription = "Unable to connect to our servers. Please check your internet connection and try again."
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
            <CardTitle className="text-2xl font-bold text-white">{t.createAccount}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium text-zinc-300">
                  {t.firstName}
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter your first name"
                  className={`rounded-lg bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-teal-500 focus:ring-teal-500 ${
                    errors.firstName ? 'border-red-500' : ''
                  }`}
                  disabled={isLoading}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-400">{errors.firstName}</p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium text-zinc-300">
                  {t.lastName}
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter your last name"
                  className={`rounded-lg bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-teal-500 focus:ring-teal-500 ${
                    errors.lastName ? 'border-red-500' : ''
                  }`}
                  disabled={isLoading}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-400">{errors.lastName}</p>
                )}
              </div>

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
                  placeholder="Create a password"
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
                    Creating Account...
                  </>
                ) : (
                  t.signUpButton
                )}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-zinc-400">
                {t.haveAccount}{" "}
                <Link href="/login" className="text-teal-400 hover:text-teal-300 font-medium">
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
