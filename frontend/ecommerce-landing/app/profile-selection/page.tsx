"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Factory, Package, Search, Truck } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuroraBackground } from "@/components/ui/aurora-background"
import { GlowCard } from "../../components/ui/spotlight-card"

const translations = {
  english: {
    chooseProfile: "Choose Your Profile",
    subtitle: "Select how you want to use SupplyChain",
    supplier: "Supplier",
    supplierDesc: "I want to sell raw materials and reach thousands of buyers worldwide",
    vendor: "Vendor",
    vendorDesc: "I want to buy quality raw materials from verified suppliers",
    delivery: "Delivery Partner",
    deliveryDesc: "I want to provide logistics and delivery services for the marketplace",
    getStarted: "Get Started",
    supplierFeatures: ["List your materials", "Reach global buyers", "Manage inventory", "Track sales"],
    vendorFeatures: ["Browse materials", "Connect with suppliers", "Bulk ordering", "Quality assurance"],
    deliveryFeatures: ["Flexible schedules", "Competitive rates", "Real-time tracking", "Reliable service"],
  },
  punjabi: {
    chooseProfile: "ਆਪਣਾ ਪ੍ਰੋਫਾਈਲ ਚੁਣੋ",
    subtitle: "ਚੁਣੋ ਕਿ ਤੁਸੀਂ SupplyChain ਕਿਵੇਂ ਵਰਤਣਾ ਚਾਹੁੰਦੇ ਹੋ",
    supplier: "ਸਪਲਾਈਅਰ",
    supplierDesc: "ਮੈਂ ਕੱਚਾ ਮਾਲ ਵੇਚਣਾ ਚਾਹੁੰਦਾ ਹਾਂ ਅਤੇ ਦੁਨੀਆ ਭਰ ਦੇ ਖਰੀਦਦਾਰਾਂ ਤੱਕ ਪਹੁੰਚਣਾ ਚਾਹੁੰਦਾ ਹਾਂ",
    vendor: "ਖਰੀਦਦਾਰ",
    vendorDesc: "ਮੈਂ ਚੰਗੇ ਸਪਲਾਈਅਰਾਂ ਤੋਂ ਕੁਆਲਿਟੀ ਕੱਚਾ ਮਾਲ ਖਰੀਦਣਾ ਚਾਹੁੰਦਾ ਹਾਂ",
    delivery: "ਡਿਲੀਵਰੀ ਪਾਰਟਨਰ",
    deliveryDesc: "ਮੈਂ ਮਾਰਕੇਟਪਲੇਸ ਲਈ ਲਾਜਿਸਟਿਕ ਅਤੇ ਡਿਲੀਵਰੀ ਸੇਵਾਵਾਂ ਪ੍ਰਦਾਨ ਕਰਨਾ ਚਾਹੁੰਦਾ ਹਾਂ",
    getStarted: "ਸ਼ੁਰੂ ਕਰੋ",
    supplierFeatures: ["ਆਪਣਾ ਮਾਲ ਲਿਸਟ ਕਰੋ", "ਗਲੋਬਲ ਖਰੀਦਦਾਰਾਂ ਤੱਕ ਪਹੁੰਚੋ", "ਇਨਵੈਂਟਰੀ ਮੈਨੇਜ ਕਰੋ", "ਸੇਲਜ਼ ਟਰੈਕ ਕਰੋ"],
    vendorFeatures: ["ਮਾਲ ਬ੍ਰਾਊਜ਼ ਕਰੋ", "ਸਪਲਾਈਅਰਾਂ ਨਾਲ ਜੁੜੋ", "ਬਲਕ ਆਰਡਰਿੰਗ", "ਕੁਆਲਿਟੀ ਐਸ਼ੋਰੈਂਸ"],
    deliveryFeatures: ["ਲਚਕਦਾਰ ਸਮਾਂ", "ਮੁਕਾਬਲੇਬਾਜ਼ ਰੇਟ", "ਰੀਅਲ-ਟਾਈਮ ਟਰੈਕਿੰਗ", "ਭਰੋਸੇਮੰਦ ਸੇਵਾ"],
  },
  hindi: {
    chooseProfile: "अपना प्रोफाइल चुनें",
    subtitle: "चुनें कि आप SupplyChain का उपयोग कैसे करना चाहते हैं",
    supplier: "सप्लायर",
    supplierDesc: "मैं कच्चा माल बेचना चाहता हूं और दुनिया भर के खरीदारों तक पहुंचना चाहता हूं",
    vendor: "खरीदार",
    vendorDesc: "मैं सत्यापित सप्लायरों से गुणवत्तापूर्ण कच्चा माल खरीदना चाहता हूं",
    delivery: "डिलीवरी पार्टनर",
    deliveryDesc: "मैं मार्केटप्लेस के लिए लॉजिस्टिक्स और डिलीवरी सेवाएं प्रदान करना चाहता हूं",
    getStarted: "शुरू करें",
    supplierFeatures: ["अपना माल लिस्ट करें", "ग्लोबल खरीदारों तक पहुंचें", "इन्वेंटरी मैनेज करें", "सेल्स ट्रैक करें"],
    vendorFeatures: ["माल ब्राउज़ करें", "सप्लायरों से जुड़ें", "बल्क ऑर्डरिंग", "क्वालिटी एश्योरेंस"],
    deliveryFeatures: ["लचीला समय", "प्रतिस्पर्धी दरें", "रीयल-टाइम ट्रैकिंग", "विश्वसनीय सेवा"],
  },
}

export default function ProfileSelection() {
  const [language, setLanguage] = useState("english")
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const savedLanguage = localStorage.getItem("selectedLanguage") || "english"
    setLanguage(savedLanguage)
  }, [])

  const handleProfileSelect = (profileType: string) => {
    setSelectedProfile(profileType)
    // Store profile type in localStorage
    localStorage.setItem("userProfile", profileType)

    // Navigate to dashboard based on profile type
    setTimeout(() => {
      router.push(`/dashboard/${profileType}`)
    }, 1000)
  }

  const t = translations[language as keyof typeof translations] || translations.english

  return (
    <AuroraBackground>
      <div className="relative z-10 w-full min-h-screen">
        {/* Header */}
        <header className="w-full border-b border-gray-800/50 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 lg:px-6">
            <div className="flex items-center justify-between h-16">
              <Link href="/landing" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                  <Factory className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">SupplyChain</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <div className="text-center mb-8 lg:mb-12">
            <h1 className="text-3xl lg:text-5xl font-bold text-white mb-4">{t.chooseProfile}</h1>
            <p className="text-base lg:text-lg text-gray-300 max-w-2xl mx-auto">{t.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
            {/* Supplier Card */}
            <GlowCard
              glowColor="teal"
              className="cursor-pointer transition-transform hover:scale-105 h-full"
              customSize={true}
              onClick={() => handleProfileSelect("supplier")}
            >
              <div className="flex flex-col h-full">
                <div className="flex flex-col items-center text-center space-y-3 flex-grow">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 bg-teal-600 rounded-full flex items-center justify-center">
                    <Package className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                  </div>
                  <h3 className="text-xl lg:text-2xl font-bold text-white">{t.supplier}</h3>
                  <p className="text-gray-300 text-xs lg:text-sm leading-relaxed">{t.supplierDesc}</p>

                  <div className="space-y-2 w-full pt-2">
                    {t.supplierFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2 text-xs lg:text-sm text-gray-400">
                        <div className="w-1.5 h-1.5 bg-teal-400 rounded-full flex-shrink-0"></div>
                        <span className="text-left">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-4">
                  <Button
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm lg:text-base py-2 lg:py-3"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleProfileSelect("supplier")
                    }}
                  >
                    {selectedProfile === "supplier" ? "Selected!" : t.getStarted}
                  </Button>
                </div>
              </div>
            </GlowCard>

            {/* Vendor Card */}
            <GlowCard
              glowColor="teal"
              className="cursor-pointer transition-transform hover:scale-105 h-full"
              customSize={true}
              onClick={() => handleProfileSelect("vendor")}
            >
              <div className="flex flex-col h-full">
                <div className="flex flex-col items-center text-center space-y-3 flex-grow">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 bg-teal-600 rounded-full flex items-center justify-center">
                    <Search className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                  </div>
                  <h3 className="text-xl lg:text-2xl font-bold text-white">{t.vendor}</h3>
                  <p className="text-gray-300 text-xs lg:text-sm leading-relaxed">{t.vendorDesc}</p>

                  <div className="space-y-2 w-full pt-2">
                    {t.vendorFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2 text-xs lg:text-sm text-gray-400">
                        <div className="w-1.5 h-1.5 bg-teal-400 rounded-full flex-shrink-0"></div>
                        <span className="text-left">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-4">
                  <Button
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm lg:text-base py-2 lg:py-3"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleProfileSelect("vendor")
                    }}
                  >
                    {selectedProfile === "vendor" ? "Selected!" : t.getStarted}
                  </Button>
                </div>
              </div>
            </GlowCard>

            {/* Delivery Partner Card */}
            <GlowCard
              glowColor="teal"
              className="cursor-pointer transition-transform hover:scale-105 h-full md:col-span-2 lg:col-span-1"
              customSize={true}
              onClick={() => handleProfileSelect("delivery")}
            >
              <div className="flex flex-col h-full">
                <div className="flex flex-col items-center text-center space-y-3 flex-grow">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 bg-teal-600 rounded-full flex items-center justify-center">
                    <Truck className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                  </div>
                  <h3 className="text-xl lg:text-2xl font-bold text-white">{t.delivery}</h3>
                  <p className="text-gray-300 text-xs lg:text-sm leading-relaxed">{t.deliveryDesc}</p>

                  <div className="space-y-2 w-full pt-2">
                    {t.deliveryFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2 text-xs lg:text-sm text-gray-400">
                        <div className="w-1.5 h-1.5 bg-teal-400 rounded-full flex-shrink-0"></div>
                        <span className="text-left">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-4">
                  <Button
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm lg:text-base py-2 lg:py-3"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleProfileSelect("delivery")
                    }}
                  >
                    {selectedProfile === "delivery" ? "Selected!" : t.getStarted}
                  </Button>
                </div>
              </div>
            </GlowCard>
          </div>
        </main>
      </div>
    </AuroraBackground>
  )
}
