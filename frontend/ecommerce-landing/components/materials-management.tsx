"use client"

import { useState } from "react"
import { Plus, Edit, Package, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Grocery {
  id: string
  productName: string
  price: number
  category: string
  stock: number
}

export function MaterialsManagement() {
  const [groceries, setGroceries] = useState<Grocery[]>([
    { id: "1", productName: "Basmati Rice", price: 85.5, category: "Grains", stock: 150 },
    { id: "2", productName: "Wheat Flour", price: 45.0, category: "Flour", stock: 200 },
    { id: "3", productName: "Red Lentils", price: 120.75, category: "Pulses", stock: 300 },
  ])

  const [isAddingGrocery, setIsAddingGrocery] = useState(false)
  const [editingGrocery, setEditingGrocery] = useState<string | null>(null)
  const [newGrocery, setNewGrocery] = useState({
    productName: "",
    price: 0,
    category: "",
    stock: 0,
  })

  const handleAddGrocery = () => {
    if (newGrocery.productName && newGrocery.price > 0) {
      const grocery: Grocery = {
        id: Date.now().toString(),
        ...newGrocery,
      }
      setGroceries([...groceries, grocery])
      setNewGrocery({ productName: "", price: 0, category: "", stock: 0 })
      setIsAddingGrocery(false)
    }
  }

  const handleEditPrice = (id: string, newPrice: number) => {
    setGroceries(groceries.map((grocery) => (grocery.id === id ? { ...grocery, price: newPrice } : grocery)))
    setEditingGrocery(null)
  }

  return (
    <Card className="glass-card border-white/10 futuristic-glow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl">
              <Package className="h-7 w-7 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold">Grocery Management</span>
              <p className="text-white/60 text-sm font-normal mt-1">Manage your grocery inventory with precision</p>
            </div>
          </div>
          <Button
            onClick={() => setIsAddingGrocery(true)}
            className="glass-button text-white px-6 py-3 futuristic-glow"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Grocery
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Grocery Form */}
        {isAddingGrocery && (
          <div className="glass-card p-6 space-y-6 futuristic-glow">
            <div className="flex items-center space-x-3 mb-4">
              <Sparkles className="h-6 w-6 text-purple-400" />
              <h3 className="text-white font-bold text-xl">Add New Grocery</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="productName" className="text-white/90 font-medium">
                  Product Name
                </Label>
                <Input
                  id="productName"
                  value={newGrocery.productName}
                  onChange={(e) => setNewGrocery({ ...newGrocery, productName: e.target.value })}
                  className="glass-input h-12 rounded-xl"
                  placeholder="Enter product name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price" className="text-white/90 font-medium">
                  Price (₹/kg)
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={newGrocery.price}
                  onChange={(e) => setNewGrocery({ ...newGrocery, price: Number.parseFloat(e.target.value) })}
                  className="glass-input h-12 rounded-xl"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-white/90 font-medium">
                  Category
                </Label>
                <Input
                  id="category"
                  value={newGrocery.category}
                  onChange={(e) => setNewGrocery({ ...newGrocery, category: e.target.value })}
                  className="glass-input h-12 rounded-xl"
                  placeholder="Enter category"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock" className="text-white/90 font-medium">
                  Stock (kgs)
                </Label>
                <Input
                  id="stock"
                  type="number"
                  value={newGrocery.stock}
                  onChange={(e) => setNewGrocery({ ...newGrocery, stock: Number.parseInt(e.target.value) })}
                  className="glass-input h-12 rounded-xl"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex space-x-4 pt-4">
              <Button onClick={handleAddGrocery} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-colors duration-200" >
                <Plus className="h-4 w-4 mr-2" />
                Add Grocery
              </Button>
              <Button
                onClick={() => setIsAddingGrocery(false)}
                variant="outline"
                className="glass-button text-white border-white/30 px-8 py-3"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Groceries List */}
        <div className="space-y-4">
          {groceries.map((grocery) => (
            <div key={grocery.id} className="glass-card p-6 futuristic-glow">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-xl">{grocery.productName}</h4>
                      <p className="text-white/70">
                        {grocery.category} • Stock:{" "}
                        <span className="font-semibold text-green-400">{grocery.stock} kgs</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {editingGrocery === grocery.id ? (
                    <div className="flex items-center space-x-3">
                      <Input
                        type="number"
                        defaultValue={grocery.price}
                        className="glass-input w-32 h-10 rounded-xl"
                        onBlur={(e) => handleEditPrice(grocery.id, Number.parseFloat(e.target.value))}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleEditPrice(grocery.id, Number.parseFloat(e.currentTarget.value))
                          }
                        }}
                      />
                      <Button
                        onClick={() => setEditingGrocery(null)}
                        variant="outline"
                        size="sm"
                        className="glass-button text-white border-white/30 px-4"
                      >
                        Save
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="text-right">
                        <span className="text-white font-bold text-2xl">₹{grocery.price.toFixed(2)}</span>
                        <p className="text-white/60 text-sm">per kg</p>
                      </div>
                      <Button
                        onClick={() => setEditingGrocery(grocery.id)}
                        variant="ghost"
                        size="sm"
                        className="glass-button text-white px-4 py-2"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
