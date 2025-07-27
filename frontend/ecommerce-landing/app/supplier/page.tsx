import { MaterialsManagement } from "@/components/materials-management"
import { OrderTracking } from "@/components/orderTracking"
import { DashboardHeader } from "@/components/dashboardHeader"

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-black">
      <DashboardHeader />
      <div className="pt-[140px] p-6 lg:p-8 space-y-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <MaterialsManagement />
          <OrderTracking />
        </div>
      </div>
    </div>
  )
}
