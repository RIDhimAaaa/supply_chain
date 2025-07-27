"use client"

import { useState } from "react"
import { Truck, Package, CheckCircle, Clock, Mail, MapPin, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Order {
  id: string
  productName: string
  quantity: number
  status: "incoming" | "packed" | "dispatched"
  orderDate: string
  vendor: {
    name: string
    email: string
    address: string
  }
}

export function OrderTracking() {
  const [orders] = useState<Order[]>([
    {
      id: "ORD-001",
      productName: "Basmati Rice",
      quantity: 50,
      status: "incoming",
      orderDate: "2024-01-15",
      vendor: {
        name: "Amit Sharma",
        email: "amit.sharma@gmail.com",
        address: "123 Market Street, Delhi, DL 110001",
      },
    },
    {
      id: "ORD-002",
      productName: "Wheat Flour",
      quantity: 100,
      status: "packed",
      orderDate: "2024-01-14",
      vendor: {
        name: "Priya Patel",
        email: "priya.patel@gmail.com",
        address: "456 Commerce Road, Mumbai, MH 400001",
      },
    },
    {
      id: "ORD-003",
      productName: "Red Lentils",
      quantity: 200,
      status: "dispatched",
      orderDate: "2024-01-13",
      vendor: {
        name: "Suresh Kumar",
        email: "suresh.kumar@gmail.com",
        address: "789 Trade Center, Bangalore, KA 560001",
      },
    },
  ])

  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "incoming":
        return <Clock className="h-5 w-5" />
      case "packed":
        return <Package className="h-5 w-5" />
      case "dispatched":
        return <Truck className="h-5 w-5" />
    }
  }

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "incoming":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
      case "packed":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30"
      case "dispatched":
        return "bg-green-500/20 text-green-300 border-green-500/30"
    }
  }

  const getStatusGradient = (status: Order["status"]) => {
    switch (status) {
      case "incoming":
        return "from-yellow-500 to-orange-500"
      case "packed":
        return "from-blue-500 to-purple-500"
      case "dispatched":
        return "from-green-500 to-emerald-500"
    }
  }

  const groupedOrders = {
    incoming: orders.filter((order) => order.status === "incoming"),
    packed: orders.filter((order) => order.status === "packed"),
    dispatched: orders.filter((order) => order.status === "dispatched"),
  }

  return (
    <Card className="glass-card border-white/10 futuristic-glow">
      <CardHeader>
        <CardTitle className="flex items-center space-x-4 text-white">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl">
            <Truck className="h-7 w-7 text-white" />
          </div>
          <div>
            <span className="text-2xl font-bold">Order Tracking</span>
            <p className="text-white/60 text-sm font-normal mt-1">Monitor your grocery orders in real-time</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Order Status Sections */}
        {Object.entries(groupedOrders).map(([status, statusOrders]) => (
          <div key={status} className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className={`p-3 bg-gradient-to-r ${getStatusGradient(status as Order["status"])} rounded-2xl`}>
                {getStatusIcon(status as Order["status"])}
              </div>
              <h3 className="text-white font-bold text-xl capitalize">{status} Orders</h3>
              <div className="px-4 py-2 bg-white/10 rounded-full">
                <span className="text-white font-semibold">{statusOrders.length}</span>
              </div>
            </div>

            <div className="space-y-4">
              {statusOrders.map((order) => (
                <div key={order.id} className="glass-card p-6 futuristic-glow">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <div
                          className={`w-12 h-12 bg-gradient-to-br ${getStatusGradient(order.status)} rounded-xl flex items-center justify-center`}
                        >
                          <Package className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-xl">{order.productName}</h4>
                          <div className="flex items-center space-x-4 mt-1">
                            <Badge className={`${getStatusColor(order.status)} border px-3 py-1 rounded-xl`}>
                              {getStatusIcon(order.status)}
                              <span className="ml-2 capitalize font-semibold">{order.status}</span>
                            </Badge>
                            <span className="text-white/70">#{order.id}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-white/70 ml-16">
                        Quantity: <span className="font-semibold text-blue-400">{order.quantity} kgs</span> • Date:{" "}
                        <span className="font-semibold text-purple-400">{order.orderDate}</span>
                      </p>
                    </div>

                    <Button
                      onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                      variant="outline"
                      className="glass-button text-white border-white/30 px-6 py-3 futuristic-glow"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      {selectedOrder === order.id ? "Hide" : "View"} Vendor Contact
                    </Button>
                  </div>

                  {/* Vendor Contact Information */}
                  {selectedOrder === order.id && (
                    <div className="mt-6 pt-6 border-t border-white/20">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl">
                          <CheckCircle className="h-5 w-5 text-white" />
                        </div>
                        <h5 className="text-white font-bold text-lg">Vendor Contact Information</h5>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center space-x-4 p-4 glass-card rounded-2xl">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                              <CheckCircle className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <p className="text-white font-bold text-lg">{order.vendor.name}</p>
                              <p className="text-white/70">Vendor Name</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 p-4 glass-card rounded-2xl">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                              <Mail className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <p className="text-white font-bold text-lg">{order.vendor.email}</p>
                              <p className="text-white/70">Email Address</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-start space-x-4 p-4 glass-card rounded-2xl">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mt-1">
                              <MapPin className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <p className="text-white font-bold text-lg">{order.vendor.address}</p>
                              <p className="text-white/70">Business Address</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
