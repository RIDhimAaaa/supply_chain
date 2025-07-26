"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Factory, Users, TrendingUp, Shield, Search, Package } from "lucide-react"
import Link from "next/link"
import { AuroraBackground } from "@/components/ui/aurora-background"

const translations = {
  english: {
    features: "Features",
    aboutUs: "About Us",
    login: "Login",
    signUp: "Sign Up",
    headline: "Connect suppliers and vendors in one marketplace",
    subheadline:
      "Whether you're selling raw materials or looking to buy them, find the right business partners. From metals to chemicals, connect, trade, and grow together.",
    getStartedSupplier: "Join as Supplier",
    getStartedVendor: "Join as Vendor",
    forSuppliers: "For Suppliers",
    forVendors: "For Vendors",
    suppliersDesc: "List your materials and reach thousands of buyers",
    vendorsDesc: "Find quality materials from verified suppliers",
    trustedNetwork: "Trusted Network",
    verifiedUsers: "Verified Users",
    secureTransactions: "Secure Transactions",
    globalReach: "Global Reach",
    suppliersCount: "5K+",
    suppliersLabel: "Active Suppliers",
    vendorsCount: "8K+",
    vendorsLabel: "Active Vendors",
    avgTime: "24hrs",
    avgTimeLabel: "Avg Response Time",
    successRate: "98%",
    successRateLabel: "Success Rate",
    getStarted: "Get Started",
  },
  punjabi: {
    features: "ਵਿਸ਼ੇਸ਼ਤਾਵਾਂ",
    aboutUs: "ਸਾਡੇ ਬਾਰੇ",
    login: "ਲਾਗਇਨ",
    signUp: "ਸਾਈਨ ਅਪ",
    headline: "ਸਪਲਾਈਅਰ ਅਤੇ ਖਰੀਦਦਾਰ ਦੋਵਾਂ ਲਈ ਇੱਕ ਜਗ੍ਹਾ",
    subheadline: "ਚਾਹੇ ਤੁਸੀਂ ਕੱਚਾ ਮਾਲ ਵੇਚਦੇ ਹੋ ਜਾਂ ਖਰੀਦਦੇ ਹੋ, ਸਹੀ ਬਿਜ਼ਨਸ ਪਾਰਟਨਰ ਲੱਭੋ। ਧਾਤੂ ਤੋਂ ਕੈਮੀਕਲ ਤੱਕ, ਜੁੜੋ ਅਤੇ ਬਿਜ਼ਨਸ ਵਧਾਓ।",
    getStartedSupplier: "ਸਪਲਾਈਅਰ ਬਣੋ",
    getStartedVendor: "ਖਰੀਦਦਾਰ ਬਣੋ",
    forSuppliers: "ਸਪਲਾਈਅਰ ਲਈ",
    forVendors: "ਖਰੀਦਦਾਰ ਲਈ",
    suppliersDesc: "ਆਪਣਾ ਮਾਲ ਲਿਸਟ ਕਰੋ ਅਤੇ ਹਜ਼ਾਰਾਂ ਖਰੀਦਦਾਰਾਂ ਤੱਕ ਪਹੁੰਚੋ",
    vendorsDesc: "ਚੰਗੇ ਸਪਲਾਈਅਰ ਤੋਂ ਕੁਆਲਿਟੀ ਮਾਲ ਖਰੀਦੋ",
    trustedNetwork: "ਭਰੋਸੇਮੰਦ ਨੈਟਵਰਕ",
    verifiedUsers: "ਜਾਂਚੇ ਗਏ ਯੂਜ਼ਰ",
    secureTransactions: "ਸੁਰੱਖਿਤ ਪੇਮੈਂਟ",
    globalReach: "ਪੂਰੀ ਦੁਨੀਆ ਵਿੱਚ",
    suppliersCount: "5K+",
    suppliersLabel: "ਸਪਲਾਈਅਰ",
    vendorsCount: "8K+",
    vendorsLabel: "ਖਰੀਦਦਾਰ",
    avgTime: "24 ਘੰਟੇ",
    avgTimeLabel: "ਜਵਾਬ ਦਾ ਸਮਾਂ",
    successRate: "98%",
    successRateLabel: "ਸਫਲਤਾ ਦਰ",
    getStarted: "ਸ਼ੁਰੂ ਕਰੋ",
  },
  hindi: {
    features: "सुविधाएं",
    aboutUs: "हमारे बारे में",
    login: "लॉगिन",
    signUp: "साइन अप",
    headline: "सप्लायर और खरीदार दोनों के लिए एक जगह",
    subheadline: "चाहे आप कच्चा माल बेचते हों या खरीदते हों, सही बिजनेस पार्टनर खोजें। धातु से केमिकल तक, जुड़ें और बिजनेस बढ़ाएं।",
    getStartedSupplier: "सप्लायर बनें",
    getStartedVendor: "खरीदार बनें",
    forSuppliers: "सप्लायर के लिए",
    forVendors: "खरीदार के लिए",
    suppliersDesc: "अपना माल लिस्ट करें और हजारों खरीदारों तक पहुंचें",
    vendorsDesc: "अच्छे सप्लायर से क्वालिटी माल खरीदें",
    trustedNetwork: "भरोसेमंद नेटवर्क",
    verifiedUsers: "जांचे गए यूजर",
    secureTransactions: "सुरक्षित पेमेंट",
    globalReach: "पूरी दुनिया में",
    suppliersCount: "5K+",
    suppliersLabel: "सप्लायर",
    vendorsCount: "8K+",
    vendorsLabel: "खरीदार",
    avgTime: "24 घंटे",
    avgTimeLabel: "जवाब का समय",
    successRate: "98%",
    successRateLabel: "सफलता दर",
    getStarted: "शुरू करें",
  },
}

export default function LandingPage() {
  const [language, setLanguage] = useState("english")

  useEffect(() => {
    const savedLanguage = localStorage.getItem("selectedLanguage") || "english"
    setLanguage(savedLanguage)
  }, [])

  const t = translations[language as keyof typeof translations] || translations.english

  return (
    <AuroraBackground>
      <div className="relative z-10 w-full min-h-screen">
        {/* Header / Navigation */}
        <header className="w-full border-b border-gray-800/50 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 lg:px-6">
            <div className="flex items-center justify-between h-16">
              {/* Left Side - Logo and Navigation */}
              <div className="flex items-center space-x-8">
                <Link href="/landing" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                    <Factory className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-white">SupplyChain</span>
                </Link>

                <nav className="hidden md:flex items-center space-x-6">
                  <Link href="#features" className="text-gray-300 hover:text-white font-medium transition-colors">
                    {t.features}
                  </Link>
                  <Link href="#about" className="text-gray-300 hover:text-white font-medium transition-colors">
                    {t.aboutUs}
                  </Link>
                </nav>
              </div>

              {/* Right Side - Login and Sign Up */}
              <div className="flex items-center space-x-4">
                <Link href="/login">
                  <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800/50 font-medium">
                    {t.login}
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-6 rounded-lg">
                    {t.signUp}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Hero Section */}
        <main className="container mx-auto px-4 lg:px-6">
          <section className="py-12 lg:py-20">
            <div className="max-w-4xl mx-auto text-center">
              {/* Left Column - Text Content */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight">{t.headline}</h1>

                  <p className="text-lg lg:text-xl text-gray-300 leading-relaxed">{t.subheadline}</p>
                </div>

                {/* Single CTA Button */}
                <div className="pt-4">
                  <Link href="/signup">
                    <Button
                      size="lg"
                      className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-8 py-4 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {t.getStarted}
                    </Button>
                  </Link>
                </div>

                {/* Value Propositions for Both Sides */}
                <div className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                  <div className="bg-gray-900/40 backdrop-blur-sm p-4 rounded-lg border border-gray-700/50">
                    <div className="flex items-center space-x-3 mb-2">
                      <Package className="w-6 h-6 text-teal-400" />
                      <h3 className="font-semibold text-white">{t.forSuppliers}</h3>
                    </div>
                    <p className="text-sm text-gray-300">{t.suppliersDesc}</p>
                  </div>
                  <div className="bg-gray-900/40 backdrop-blur-sm p-4 rounded-lg border border-gray-700/50">
                    <div className="flex items-center space-x-3 mb-2">
                      <Search className="w-6 h-6 text-teal-400" />
                      <h3 className="font-semibold text-white">{t.forVendors}</h3>
                    </div>
                    <p className="text-sm text-gray-300">{t.vendorsDesc}</p>
                  </div>
                </div>

                {/* Trust Indicators */}
                <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gray-900/40 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-2 border border-gray-700/50">
                      <Users className="w-6 h-6 text-teal-400" />
                    </div>
                    <p className="text-sm font-medium text-white">{t.trustedNetwork}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gray-900/40 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-2 border border-gray-700/50">
                      <Shield className="w-6 h-6 text-teal-400" />
                    </div>
                    <p className="text-sm font-medium text-white">{t.verifiedUsers}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gray-900/40 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-2 border border-gray-700/50">
                      <TrendingUp className="w-6 h-6 text-teal-400" />
                    </div>
                    <p className="text-sm font-medium text-white">{t.secureTransactions}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gray-900/40 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-2 border border-gray-700/50">
                      <Factory className="w-6 h-6 text-teal-400" />
                    </div>
                    <p className="text-sm font-medium text-white">{t.globalReach}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Stats Section - Updated for Both Sides */}
          <section className="py-12 border-t border-gray-800/50">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl lg:text-4xl font-bold text-teal-400 mb-2">{t.suppliersCount}</div>
                <div className="text-gray-300 font-medium">{t.suppliersLabel}</div>
              </div>
              <div>
                <div className="text-3xl lg:text-4xl font-bold text-teal-400 mb-2">{t.vendorsCount}</div>
                <div className="text-gray-300 font-medium">{t.vendorsLabel}</div>
              </div>
              <div>
                <div className="text-3xl lg:text-4xl font-bold text-white mb-2">{t.avgTime}</div>
                <div className="text-gray-300 font-medium">{t.avgTimeLabel}</div>
              </div>
              <div>
                <div className="text-3xl lg:text-4xl font-bold text-white mb-2">{t.successRate}</div>
                <div className="text-gray-300 font-medium">{t.successRateLabel}</div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </AuroraBackground>
  )
}
