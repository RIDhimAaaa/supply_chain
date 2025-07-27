"use client" // This component uses client-side hooks like useState and useEffect

import { useState, useEffect } from "react"
import {
  Bell,
  Search,
  ShoppingCart,
  Users,
  Package,
  Home,
  Settings,
  Plus,
  Minus,
  Eye,
  Clock,
  MapPin,
  CreditCard,
  Filter,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import Image from "next/image"

// Assuming these components are correctly aliased in your tsconfig.json
// and are working with your new Tailwind setup
import { Button } from "@/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card"
import { Input } from "@/components/input"
import { Badge } from "@/components/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/progress"
import { Separator } from "@/components/seperator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/dropdown-menu"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select"

// Mock data (keep as is)
const products = [
  {
    id: 1,
    name: "Fresh Bananas",
    price: 2.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Fruits",
    inStock: true,
    rating: 4.5,
    stock: 150,
    unit: "kg",
  },
  {
    id: 2,
    name: "Organic Milk",
    price: 4.49,
    image: "/placeholder.svg?height=200&width=200",
    category: "Dairy",
    inStock: true,
    rating: 4.8,
    stock: 200,
    unit: "L",
  },
  {
    id: 3,
    name: "Whole Wheat Bread",
    price: 3.29,
    image: "/placeholder.svg?height=200&width=200",
    category: "Bakery",
    inStock: false,
    rating: 4.2,
    stock: 0,
    unit: "loaf",
  },
  {
    id: 4,
    name: "Fresh Tomatoes",
    price: 3.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Vegetables",
    inStock: true,
    rating: 4.6,
    stock: 300,
    unit: "kg",
  },
  {
    id: 5,
    name: "Greek Yogurt",
    price: 5.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Dairy",
    inStock: true,
    rating: 4.7,
    stock: 100,
    unit: "pack",
  },
  {
    id: 6,
    name: "Chicken Breast",
    price: 8.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Meat",
    inStock: true,
    rating: 4.4,
    stock: 50,
    unit: "kg",
  },
]

const groups = [
  { id: 1, name: "Office Lunch Group", members: 12, totalOrder: 156.78, status: "active", color: "supply-purple" },
  { id: 2, name: "Neighborhood Co-op", members: 8, totalOrder: 89.45, status: "pending", color: "supply-orange" },
  { id: 3, name: "Family Bulk Buy", members: 4, totalOrder: 234.12, status: "completed", color: "supply-green" },
]

const orders = [
  { id: "ORD-001", status: "delivered", total: 45.67, deliveryTime: "2 hours ago", items: 8, color: "supply-green" },
  {
    id: "ORD-002",
    status: "in-transit",
    total: 78.9,
    deliveryTime: "Arriving in 30 mins",
    items: 12,
    color: "supply-orange",
  },
  {
    id: "ORD-003",
    status: "processing",
    total: 123.45,
    deliveryTime: "Est. 2-3 hours",
    items: 15,
    color: "supply-purple",
  },
]

// Mapping for dynamic class names to ensure Tailwind generates them
const categoryColors: { [key: string]: string } = {
  Fruits: "supply-orange",
  Vegetables: "supply-green",
  Dairy: "supply-purple",
  Meat: "supply-teal",
  Bakery: "supply-orange", // Ensure consistency, was already orange
}

export default function VendorDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [cartItems, setCartItems] = useState([
    { id: 1, name: "Fresh Bananas", price: 2.99, quantity: 2, image: "/placeholder.svg?height=60&width=60" },
    { id: 2, name: "Organic Milk", price: 4.49, quantity: 1, image: "/placeholder.svg?height=60&width=60" },
  ])
  const [selectedCategory, setSelectedCategory] = useState("all")

  // --- IMPORTANT CHANGE: Apply theme classes to the <html> element ---
  useEffect(() => {
    // Add the 'vendor-theme' class to the html element
    document.documentElement.classList.add('vendor-theme');
    // Also add the 'dark' class if you want the dark mode of the vendor theme
    // to be explicitly active (as per your screenshot).
    document.documentElement.classList.add('dark');

    // Cleanup function: Remove the classes when the component unmounts
    return () => {
      document.documentElement.classList.remove('vendor-theme');
      document.documentElement.classList.remove('dark');
    };
  }, []); // Empty dependency array ensures this runs only once on mount and once on unmount

  const addToCart = (product: any) => {
    const existingItem = cartItems.find((item) => item.id === product.id)
    if (existingItem) {
      setCartItems(cartItems.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)))
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1 }])
    }
  }

  const removeFromCart = (productId: number) => {
    setCartItems(cartItems.filter((item) => item.id !== productId))
  }

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(productId)
    } else {
      setCartItems(cartItems.map((item) => (item.id === productId ? { ...item, quantity: newQuantity } : item)))
    }
  }

  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0)

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((product) => product.category.toLowerCase() === selectedCategory)

  return (
    // The outermost div no longer needs 'bg-supply-dark' or 'text-white' directly.
    // These will now be applied to the <body> via the CSS variables set on <html> by useEffect.
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-supply-card border-b border-supply-border sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-white">SupplyChain</h1>
            <p className="text-sm text-gray-400 hidden md:block">
              Manage your groceries and track orders with precision
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search groceries, orders, vendors..."
                className="pl-10 w-80 bg-supply-card border-supply-border text-white placeholder:text-gray-400"
              />
            </div>

            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-supply-border">
              <Bell className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Notifications</span>
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative text-gray-300 hover:text-white hover:bg-supply-border"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">Cart</span>
                  {cartItemCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-supply-purple">
                      {cartItemCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-96 bg-supply-card border-supply-border">
                <SheetHeader>
                  <SheetTitle className="text-white">Shopping Cart</SheetTitle>
                  <SheetDescription className="text-gray-400">{cartItemCount} items in your cart</SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center space-x-3 p-3 border border-supply-border rounded-lg bg-supply-dark"
                    >
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        width={60}
                        height={60}
                        className="rounded-md object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm text-white">{item.name}</h4>
                        <p className="text-sm text-gray-400">₹{item.price}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="border-supply-border hover:bg-supply-border"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium text-white">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="border-supply-border hover:bg-supply-border"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}

                  {cartItems.length === 0 && <div className="text-center py-8 text-gray-400">Your cart is empty</div>}

                  {cartItems.length > 0 && (
                    <div className="border-t border-supply-border pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-semibold text-white">Total: ₹{cartTotal.toFixed(2)}</span>
                      </div>
                      <Button className="w-full bg-supply-purple hover:bg-supply-purple/80">Proceed to Checkout</Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Vendor" />
                    <AvatarFallback className="bg-supply-purple text-white">RK</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-supply-card border-supply-border" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-white">Rajesh Kumar</p>
                    <p className="text-xs leading-none text-gray-400">Admin • Online</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-supply-border" />
                <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-supply-border">
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-supply-border">
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-supply-border">
                  Support
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-supply-border" />
                <DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-red-900/20">
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-supply-card border-r border-supply-border min-h-screen">
          <div className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="w-full">
              <TabsList className="grid w-full grid-cols-1 h-auto bg-transparent p-0 space-y-2">
                <TabsTrigger
                  value="overview"
                  className="w-full justify-start data-[state=active]:bg-supply-purple/20 data-[state=active]:text-supply-purple text-gray-300 hover:text-white hover:bg-supply-border"
                >
                  <Home className="h-4 w-4 mr-3" />
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="products"
                  className="w-full justify-start data-[state=active]:bg-supply-teal/20 data-[state=active]:text-supply-teal text-gray-300 hover:text-white hover:bg-supply-border"
                >
                  <Package className="h-4 w-4 mr-3" />
                  Browse Products
                </TabsTrigger>
                <TabsTrigger
                  value="groups"
                  className="w-full justify-start data-[state=active]:bg-supply-orange/20 data-[state=active]:text-supply-orange text-gray-300 hover:text-white hover:bg-supply-border"
                >
                  <Users className="h-4 w-4 mr-3" />
                  Groups
                </TabsTrigger>
                <TabsTrigger
                  value="orders"
                  className="w-full justify-start data-[state=active]:bg-supply-green/20 data-[state=active]:text-supply-green text-gray-300 hover:text-white hover:bg-supply-border"
                >
                  <ShoppingCart className="h-4 w-4 mr-3" />
                  Orders & Delivery
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="w-full justify-start data-[state=active]:bg-supply-purple/20 data-[state=active]:text-supply-purple text-gray-300 hover:text-white hover:bg-supply-border"
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">Dashboard Overview</h2>
                <p className="text-gray-400">Welcome back! Here's what's happening with your orders and groups.</p>
              </div>

              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-supply-card border-supply-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">Total Orders</CardTitle>
                    <div className="p-2 bg-supply-purple/20 rounded-lg">
                      <ShoppingCart className="h-4 w-4 text-supply-purple" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">24</div>
                    <div className="flex items-center text-xs text-supply-green">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +12% from last month
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-supply-card border-supply-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">Active Groups</CardTitle>
                    <div className="p-2 bg-supply-orange/20 rounded-lg">
                      <Users className="h-4 w-4 text-supply-orange" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">3</div>
                    <p className="text-xs text-gray-400">2 pending invitations</p>
                  </CardContent>
                </Card>
                <Card className="bg-supply-card border-supply-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">Monthly Spending</CardTitle>
                    <div className="p-2 bg-supply-teal/20 rounded-lg">
                      <CreditCard className="h-4 w-4 text-supply-teal" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">₹1,234</div>
                    <div className="flex items-center text-xs text-red-400">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      -8% from last month
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-supply-card border-supply-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">Delivery Success</CardTitle>
                    <div className="p-2 bg-supply-green/20 rounded-lg">
                      <Package className="h-4 w-4 text-supply-green" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">98.5%</div>
                    <div className="flex items-center text-xs text-supply-green">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +2.1% from last month
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-supply-card border-supply-border">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {orders.slice(0, 3).map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-3 bg-supply-dark rounded-lg border border-supply-border"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${order.color === 'supply-green' ? 'bg-supply-green/20' : order.color === 'supply-orange' ? 'bg-supply-orange/20' : 'bg-supply-purple/20'}`}>
                              <Package className={`h-4 w-4 ${order.color === 'supply-green' ? 'text-supply-green' : order.color === 'supply-orange' ? 'text-supply-orange' : 'text-supply-purple'}`} />
                            </div>
                            <div>
                              <p className="font-medium text-white">{order.id}</p>
                              <p className="text-sm text-gray-400">{order.items} items</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-white">₹{order.total}</p>
                            <Badge className={`${
                                order.status === "delivered" ? "bg-supply-green/20 text-supply-green border-supply-green/30" :
                                order.status === "in-transit" ? "bg-supply-orange/20 text-supply-orange border-supply-orange/30" :
                                "bg-supply-purple/20 text-supply-purple border-supply-purple/30"
                            }`}>
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-supply-card border-supply-border">
                  <CardHeader>
                    <CardTitle className="text-white">Active Groups</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {groups
                        .filter((g) => g.status === "active")
                        .map((group) => (
                          <div
                            key={group.id}
                            className="flex items-center justify-between p-3 bg-supply-dark rounded-lg border border-supply-border"
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg ${group.color === 'supply-green' ? 'bg-supply-green/20' : group.color === 'supply-orange' ? 'bg-supply-orange/20' : 'bg-supply-purple/20'}`}>
                                <Users className={`h-4 w-4 ${group.color === 'supply-green' ? 'text-supply-green' : group.color === 'supply-orange' ? 'text-supply-orange' : 'text-supply-purple'}`} />
                              </div>
                              <div>
                                <p className="font-medium text-white">{group.name}</p>
                                <p className="text-sm text-gray-400">{group.members} members</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-white">₹{group.totalOrder}</p>
                              <Badge className="bg-supply-green/20 text-supply-green border-supply-green/30">
                                Active
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-white">Browse Products</h2>
                  <p className="text-gray-400">Discover and add products to your cart</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-40 bg-supply-card border-supply-border text-white">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-supply-card border-supply-border">
                      <SelectItem value="all" className="text-white hover:bg-supply-border">
                        All Categories
                      </SelectItem>
                      <SelectItem value="fruits" className="text-white hover:bg-supply-border">
                        Fruits
                      </SelectItem>
                      <SelectItem value="vegetables" className="text-white hover:bg-supply-border">
                        Vegetables
                      </SelectItem>
                      <SelectItem value="dairy" className="text-white hover:bg-supply-border">
                        Dairy
                      </SelectItem>
                      <SelectItem value="meat" className="text-white hover:bg-supply-border">
                        Meat
                      </SelectItem>
                      <SelectItem value="bakery" className="text-white hover:bg-supply-border">
                        Bakery
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-supply-border text-gray-300 hover:text-white hover:bg-supply-border bg-transparent"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="bg-supply-card border-supply-border overflow-hidden hover:shadow-lg hover:shadow-supply-purple/10 transition-all duration-300"
                  >
                    <div className="aspect-square relative">
                      <Image
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                      {!product.inStock && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <Badge variant="destructive">Out of Stock</Badge>
                        </div>
                      )}
                      <div
                        className={`absolute top-2 left-2 p-2 rounded-lg ${
                          categoryColors[product.category as keyof typeof categoryColors] === 'supply-orange' ? 'bg-supply-orange/20' :
                          categoryColors[product.category as keyof typeof categoryColors] === 'supply-green' ? 'bg-supply-green/20' :
                          categoryColors[product.category as keyof typeof categoryColors] === 'supply-purple' ? 'bg-supply-purple/20' :
                          'bg-supply-teal/20'
                        }`}
                      >
                        <Package
                           className={`h-4 w-4 ${
                            categoryColors[product.category as keyof typeof categoryColors] === 'supply-orange' ? 'text-supply-orange' :
                            categoryColors[product.category as keyof typeof categoryColors] === 'supply-green' ? 'text-supply-green' :
                            categoryColors[product.category as keyof typeof categoryColors] === 'supply-purple' ? 'text-supply-purple' :
                            'text-supply-teal'
                          }`}
                        />
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg text-white">{product.name}</h3>
                            <p className="text-sm text-gray-400">
                              {product.category} • Stock: {product.stock} {product.unit}
                            </p>
                          </div>
                          <Badge
                            className={`${
                              categoryColors[product.category as keyof typeof categoryColors] === 'supply-orange' ? 'bg-supply-orange/20 text-supply-orange border-supply-orange/30' :
                              categoryColors[product.category as keyof typeof categoryColors] === 'supply-green' ? 'bg-supply-green/20 text-supply-green border-supply-green/30' :
                              categoryColors[product.category as keyof typeof categoryColors] === 'supply-purple' ? 'bg-supply-purple/20 text-supply-purple border-supply-purple/30' :
                              'bg-supply-teal/20 text-supply-teal border-supply-teal/30'
                            }`}
                          >
                            {product.category}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-3 h-3 ${
                                  i < Math.floor(product.rating) ? "text-yellow-400" : "text-gray-600"
                                }`}
                              >
                                ★
                              </div>
                            ))}
                          </div>
                          <span className="text-sm text-gray-400">({product.rating})</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-2xl font-bold text-white">₹{product.price}</span>
                          <Button
                            onClick={() => addToCart(product)}
                            disabled={!product.inStock}
                            size="sm"
                            className="bg-supply-teal hover:bg-supply-teal/80 text-white"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add to Cart
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Groups Tab */}
            <TabsContent value="groups" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-white">Group Purchases</h2>
                  <p className="text-gray-400">Collaborate with others to buy groceries together</p>
                </div>
                <Button className="bg-supply-orange hover:bg-supply-orange/80">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Group
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {groups.map((group) => (
                  <Card key={group.id} className="bg-supply-card border-supply-border">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${group.color === 'supply-green' ? 'bg-supply-green/20' : group.color === 'supply-orange' ? 'bg-supply-orange/20' : 'bg-supply-purple/20'}`}>
                              <Users className={`h-4 w-4 ${group.color === 'supply-green' ? 'text-supply-green' : group.color === 'supply-orange' ? 'text-supply-orange' : 'text-supply-purple'}`} />
                            </div>
                          <CardTitle className="text-lg text-white">{group.name}</CardTitle>
                        </div>
                        <Badge
                          className={`${
                            group.status === "active"
                              ? "bg-supply-green/20 text-supply-green border-supply-green/30"
                              : group.status === "pending"
                                ? "bg-supply-orange/20 text-supply-orange border-supply-orange/30"
                                : "bg-gray-600/20 text-gray-400 border-gray-600/30"
                          }`}
                        >
                          {group.status}
                        </Badge>
                      </div>
                      <CardDescription className="text-gray-400">
                        {group.members} members • ₹{group.totalOrder} total order
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-300">{group.members} active members</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-300">Split payment enabled</span>
                        </div>
                        <Separator className="bg-supply-border" />
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-supply-border text-gray-300 hover:text-white hover:bg-supply-border bg-transparent"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          <Button size="sm" className={`flex-1 ${group.color === 'supply-green' ? 'bg-supply-green hover:bg-supply-green/80' : group.color === 'supply-orange' ? 'bg-supply-orange hover:bg-supply-orange/80' : 'bg-supply-purple hover:bg-supply-purple/80'}`}>
                            Join Order
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-supply-card border-supply-border">
                <CardHeader>
                  <CardTitle className="text-white">Join Existing Groups</CardTitle>
                  <CardDescription className="text-gray-400">
                    Enter a group code to join an existing purchase group
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter group code..."
                      className="flex-1 bg-supply-dark border-supply-border text-white placeholder:text-gray-400"
                    />
                    <Button className="bg-supply-purple hover:bg-supply-purple/80">Join Group</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders & Delivery Tab */}
            <TabsContent value="orders" className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">Orders & Delivery</h2>
                <p className="text-gray-400">Track your orders and delivery status</p>
              </div>

              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} className="bg-supply-card border-supply-border">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-lg ${order.color === 'supply-green' ? 'bg-supply-green/20' : order.color === 'supply-orange' ? 'bg-supply-orange/20' : 'bg-supply-purple/20'}`}>
                            <Package className={`h-5 w-5 ${order.color === 'supply-green' ? 'text-supply-green' : order.color === 'supply-orange' ? 'text-supply-orange' : 'text-supply-purple'}`} />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-4">
                              <h3 className="font-semibold text-lg text-white">Order {order.id}</h3>
                              <Badge
                                className={`${
                                  order.status === "delivered"
                                    ? "bg-supply-green/20 text-supply-green border-supply-green/30"
                                    : order.status === "in-transit"
                                      ? "bg-supply-orange/20 text-supply-orange border-supply-orange/30"
                                      : "bg-supply-purple/20 text-supply-purple border-supply-purple/30"
                                }`}
                              >
                                {order.status.replace("-", " ")}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                              <div className="flex items-center space-x-1">
                                <Package className="h-4 w-4" />
                                <span>{order.items} items</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{order.deliveryTime}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <CreditCard className="h-4 w-4" />
                                <span>₹{order.total}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {order.status === "in-transit" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-supply-border text-gray-300 hover:text-white hover:bg-supply-border bg-transparent"
                            >
                              <MapPin className="h-4 w-4 mr-1" />
                              Track Order
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-supply-border text-gray-300 hover:text-white hover:bg-supply-border bg-transparent"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>

                      {order.status === "in-transit" && (
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Delivery Progress</span>
                            <span className="text-supply-orange">75%</span>
                          </div>
                          <Progress value={75} className="h-2 bg-supply-dark" />
                          <p className="text-sm text-gray-400">
                            Your order is on the way and will arrive in approximately 30 minutes
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-supply-card border-supply-border">
                <CardHeader>
                  <CardTitle className="text-white">Delivery Preferences</CardTitle>
                  <CardDescription className="text-gray-400">
                    Manage your delivery settings and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-gray-300">Preferred Delivery Time</label>
                      <Select>
                        <SelectTrigger className="bg-supply-dark border-supply-border text-white">
                          <SelectValue placeholder="Select time slot" />
                        </SelectTrigger>
                        <SelectContent className="bg-supply-card border-supply-border">
                          <SelectItem value="morning" className="text-white hover:bg-supply-border">
                            Morning (8AM - 12PM)
                          </SelectItem>
                          <SelectItem value="afternoon" className="text-white hover:bg-supply-border">
                            Afternoon (12PM - 6PM)
                          </SelectItem>
                          <SelectItem value="evening" className="text-white hover:bg-supply-border">
                            Evening (6PM - 10PM)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300">Delivery Address</label>
                      <Input
                        placeholder="Enter delivery address"
                        className="bg-supply-dark border-supply-border text-white placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                  <Button className="bg-supply-green hover:bg-supply-green/80">Save Preferences</Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">Settings</h2>
                <p className="text-gray-400">Manage your account and application preferences</p>
              </div>

              <div className="grid gap-6">
                <Card className="bg-supply-card border-supply-border">
                  <CardHeader>
                    <CardTitle className="text-white">Profile Information</CardTitle>
                    <CardDescription className="text-gray-400">
                      Update your personal information and contact details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-gray-300">Full Name</label>
                        <Input defaultValue="Rajesh Kumar" className="bg-supply-dark border-supply-border text-white" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-300">Email</label>
                        <Input
                          defaultValue="rajesh@vendor.com"
                          className="bg-supply-dark border-supply-border text-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-300">Phone</label>
                        <Input
                          defaultValue="+91 98765 43210"
                          className="bg-supply-dark border-supply-border text-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-300">Business Name</label>
                        <Input
                          defaultValue="Kumar's Grocery Store"
                          className="bg-supply-dark border-supply-border text-white"
                        />
                      </div>
                    </div>
                    <Button className="bg-supply-purple hover:bg-supply-purple/80">Save Changes</Button>
                  </CardContent>
                </Card>

                <Card className="bg-supply-card border-supply-border">
                  <CardHeader>
                    <CardTitle className="text-white">Notification Preferences</CardTitle>
                    <CardDescription className="text-gray-400">
                      Choose what notifications you want to receive
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-supply-dark rounded-lg border border-supply-border">
                        <span className="text-gray-300">Order updates</span>
                        <Badge className="bg-supply-green/20 text-supply-green border-supply-green/30">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-supply-dark rounded-lg border border-supply-border">
                        <span className="text-gray-300">Group invitations</span>
                        <Badge className="bg-supply-green/20 text-supply-green border-supply-green/30">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-supply-dark rounded-lg border border-supply-border">
                        <span className="text-gray-300">Delivery notifications</span>
                        <Badge className="bg-supply-green/20 text-supply-green border-supply-green/30">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-supply-dark rounded-lg border border-supply-border">
                        <span className="text-gray-300">Marketing emails</span>
                        <Badge className="bg-gray-600/20 text-gray-400 border-gray-600/30">Disabled</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}