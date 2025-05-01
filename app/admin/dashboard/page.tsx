'use client'

import { useEffect, useState, useRef } from "react";
import apiFetch from "../../../lib/api";
import { usePathname } from "next/navigation";
import { format } from "date-fns";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

// ShadCN UI Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Icons
import { 
  CalendarIcon, 
  Store, 
  Package, 
  Clock, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Printer, 
  Filter, 
  Truck, 
  RefreshCw,
  ChevronLeft,
  ArrowRight,
  BarChart3,
  ChevronRight
} from "lucide-react";

// Components
import Navbar from "../../components/AdminNavbar";
import OrderDetailsModal from "./OrderDetailsModal";
import PendingOrdersModal from "./ViewOrdersModal";
import { cn } from "@/lib/utils";

interface OrderItem {
  food_id: number;
  food_name: string;
  quantity: number;
}

interface Order {
  order_id: number;
  branch_name: string;
  delivery_date: string;
  order_date: string;
  delivery_time?: string;
  branch_address?: string;
  items: OrderItem[];
  qrCodeImageUrl?: string;
}

export default function AdminDashboard() {
  // State management
  const [orders, setOrders] = useState<Order[]>([]);
  const [inProgressOrders, setInProgressOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Filter states
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState<Date | undefined>(undefined);
  
  // UI states
  const [activeTab, setActiveTab] = useState("filter");
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [isPendingOrdersOpen, setIsPendingOrdersOpen] = useState(false);
  const [isInProgressOrdersOpen, setIsInProgressOrdersOpen] = useState(false);

  // Loading and error states
  const [isLoading, setIsLoading] = useState({
    pending: false,
    inProgress: false,
    filtered: false
  });
  
  const [errors, setErrors] = useState({
    pending: "",
    inProgress: "",
    filtered: ""
  });

  const printRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();

  // Fetch orders on component mount
  useEffect(() => {
    fetchPendingOrders();
    fetchInProgressOrders();
  }, []);

  // API calls
  async function fetchPendingOrders() {
    setIsLoading(prev => ({ ...prev, pending: true }));
    setErrors(prev => ({ ...prev, pending: "" }));
    
    try {
      const data = await apiFetch("/admin/orders/pending");
      setOrders(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setErrors(prev => ({ ...prev, pending: errorMessage }));
    } finally {
      setIsLoading(prev => ({ ...prev, pending: false }));
    }
  }

  async function fetchInProgressOrders() {
    setIsLoading(prev => ({ ...prev, inProgress: true }));
    setErrors(prev => ({ ...prev, inProgress: "" }));
    
    try {
      const data = await apiFetch("/admin/orders/in-progress");
      setInProgressOrders(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setErrors(prev => ({ ...prev, inProgress: errorMessage }));
    } finally {
      setIsLoading(prev => ({ ...prev, inProgress: false }));
    }
  }

  async function fetchFilteredOrders() {
    if (!selectedBranch && !selectedDate && !selectedDeliveryDate) {
      setErrors(prev => ({ 
        ...prev, 
        filtered: "Please select at least one filter: branch, order date, or delivery date" 
      }));
      return;
    }
    
    setIsLoading(prev => ({ ...prev, filtered: true }));
    setErrors(prev => ({ ...prev, filtered: "" }));
    
    try {
      const queryParams = new URLSearchParams();
      if (selectedBranch) queryParams.append("branch_name", selectedBranch);
      if (selectedDate) queryParams.append("order_date", format(selectedDate, "yyyy-MM-dd"));
      if (selectedDeliveryDate) queryParams.append("delivery_date", format(selectedDeliveryDate, "yyyy-MM-dd"));
      
      const data = await apiFetch("/admin/orders/filter?" + queryParams.toString());
      setFilteredOrders(data);
      setIsOrderDetailsOpen(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setErrors(prev => ({ ...prev, filtered: errorMessage }));
    } finally {
      setIsLoading(prev => ({ ...prev, filtered: false }));
    }
  }

  async function handleSaveAsPDF() {
    if (!printRef.current) {
      setErrors(prev => ({ ...prev, filtered: "Nothing to print" }));
      return;
    }
    
    if (filteredOrders.length === 0) {
      setErrors(prev => ({ ...prev, filtered: "No orders to update" }));
      return;
    }
    
    try {
      // Update order status to 'In-progress' for each filtered order
      for (const order of filteredOrders) {
        try {
          await apiFetch(`/admin/orders/${order.order_id}/status/in-progress`, {
            method: "PUT",
          });
        } catch (error) {
          console.error(`Failed to update order ${order.order_id} status:`, error);
          throw new Error(`Failed to update order ${order.order_id}`);
        }
      }

      // Proceed with PDF generation
      const element = printRef.current;
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save("orders.pdf");
      
      // Refresh orders after update
      fetchPendingOrders();
      fetchInProgressOrders();
    } catch (error) {
      console.error("Error generating PDF:", error);
      setErrors(prev => ({ ...prev, filtered: "Failed to generate PDF: " + String(error) }));
    }
  }

  // Handlers
  const handleRefresh = () => {
    fetchPendingOrders();
    fetchInProgressOrders();
  };

  const handleViewOrder = (order: Order) => {
    const orderWithItems = {
      ...order,
      items: (order as any).items || [],
    };
    setSelectedOrder(orderWithItems);
    setFilteredOrders([orderWithItems]);
    setIsOrderDetailsOpen(true);
    setIsPendingOrdersOpen(false);
    setIsInProgressOrdersOpen(false);
  };

  const handleCloseOrderDetails = () => {
    setIsOrderDetailsOpen(false);
    setSelectedOrder(null);
    setFilteredOrders([]);
  };

  // Render functions
  const renderErrorAlert = (message: string, onDismiss?: () => void) => {
    if (!message) return null;
    
    return (
      <Alert variant="destructive" className="mt-4 rounded-lg transition-all duration-300 hover:shadow-lg animate-pulse">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="flex justify-between items-center">
          <span>{message}</span>
          {onDismiss && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDismiss}
              className="transition-all duration-300 hover:scale-110 hover:rotate-90"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  };

  const renderOrdersTable = (ordersData: Order[], title: string) => {
    return (
      <Card className="w-full overflow-hidden border-0 shadow-md rounded-xl bg-white transition-all duration-300 hover:shadow-lg">
        <CardHeader className="px-6 py-4 bg-[#6D0000] text-white">
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-2">
              {title === "Pending Orders" ? (
                <Clock className="h-5 w-5 text-amber-300 transition-transform duration-300 group-hover:rotate-12" />
              ) : (
                <RefreshCw className="h-5 w-5 text-blue-300 transition-transform duration-500 group-hover:rotate-180" />
              )}
              <CardTitle className="text-lg font-semibold text-white">{title}</CardTitle>
            </div>
            <Badge variant="secondary" className="px-3 py-1 bg-white/20 text-white border-white/30 transition-all duration-300 group-hover:scale-105">
              {ordersData.length} Orders
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {ordersData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Package className="h-12 w-12 mb-4 text-gray-300" />
              <p className="text-sm font-medium">No orders found</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="p-6 space-y-4">
                {ordersData.map((order) => (
                  <Card key={order.order_id} className="border border-gray-100 rounded-lg hover:border-[#6D0000]/20 transition-all duration-300 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 group">
                    <CardContent className="p-0">
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-1 transition-colors duration-300 group-hover:text-[#6D0000]">
                              Order #{order.order_id}
                            </h3>
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                              <Store className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110" />
                              {order.branch_name}
                            </p>
                          </div>
                          <Badge 
                            variant={title === "Pending Orders" ? "secondary" : "default"}
                            className={cn(
                              "px-2.5 py-0.5 text-xs transition-all duration-300 group-hover:scale-105",
                              title === "Pending Orders" 
                                ? "bg-amber-50 text-amber-700 border-amber-200" 
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            )}
                          >
                            {title === "Pending Orders" ? "Pending" : "In Progress"}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <CalendarIcon className="h-3 w-3" />
                              <span>Order: {format(new Date(order.order_date), "MMM dd, yyyy")}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Truck className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
                              <span>Delivery: {format(new Date(order.delivery_date), "MMM dd, yyyy")}</span>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-[#6D0000] hover:text-[#6D0000] hover:bg-[#6D0000]/5 -mr-2 transition-all duration-300 hover:translate-x-1"
                            onClick={() => handleViewOrder(order)}
                          >
                            View Details
                            <ChevronRight className="h-4 w-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    );
  };

  // Main render
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-red-50/30">
        <Navbar />
      
        <main className="flex-1 p-6 pt-24 md:pt-6 md:ml-64 space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-xl px-6 py-5 shadow-md mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Store Orders Dashboard
              </h1>
              <p className="text-sm text-gray-500 mt-1">Manage and track all store orders</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleRefresh}
                title="Refresh Data"
                className="rounded-full border-gray-200 text-gray-500 hover:text-[#6D0000] hover:border-[#6D0000]/30 hover:bg-[#6D0000]/5
                transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <RefreshCw className="h-4 w-4 transition-transform duration-300 hover:rotate-180" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPendingOrdersOpen(true)}
                title="View New Orders"
                className="relative rounded-full border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md"
              >
                {orders.length} New Orders
                <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-600 animate-ping"></span>
                <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-600"></span>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-md rounded-xl bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer group overflow-hidden">
            <div className="h-1 bg-amber-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-full bg-amber-50 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-3xl font-bold text-[#6D0000] transition-all duration-300 group-hover:scale-105">
                    {isLoading.pending ? (
                      <Skeleton className="h-9 w-12" />
                    ) : (
                      orders.length
                    )}
                  </span>
                  <span className="text-xs text-gray-500">orders</span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-900">Pending Orders</h3>
              <p className="text-xs text-gray-500 mt-1">Waiting for processing</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => setIsPendingOrdersOpen(true)}
                className="mt-4 px-0 text-[#6D0000] hover:text-[#8B0000] transition-all duration-300 hover:translate-x-1"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md rounded-xl bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer group overflow-hidden">
            <div className="h-1 bg-blue-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-full bg-blue-50 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <RefreshCw className="h-6 w-6 text-blue-600 transition-transform duration-700 group-hover:rotate-180" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-3xl font-bold text-[#6D0000] transition-all duration-300 group-hover:scale-105">
                    {isLoading.inProgress ? (
                      <Skeleton className="h-9 w-12" />
                    ) : (
                      inProgressOrders.length
                    )}
                  </span>
                  <span className="text-xs text-gray-500">orders</span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-900">In Progress</h3>
              <p className="text-xs text-gray-500 mt-1">Currently being processed</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => setIsInProgressOrdersOpen(true)}
                className="mt-4 px-0 text-[#6D0000] hover:text-[#8B0000] transition-all duration-300 hover:translate-x-1"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md rounded-xl bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer group overflow-hidden">
            <div className="h-1 bg-[#6D0000]" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-full bg-[#6D0000]/10 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <BarChart3 className="h-6 w-6 text-[#6D0000] transition-transform duration-300 group-hover:scale-110" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-3xl font-bold text-[#6D0000] transition-all duration-300 group-hover:scale-105">
                    {isLoading.pending || isLoading.inProgress ? (
                      <Skeleton className="h-9 w-12" />
                    ) : (
                      orders.length + inProgressOrders.length
                    )}
                  </span>
                  <span className="text-xs text-gray-500">orders</span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-900">Total Orders</h3>
              <p className="text-xs text-gray-500 mt-1">All current orders</p>
              <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5">
                <div 
                  className="bg-[#6D0000] h-1.5 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${orders.length + inProgressOrders.length > 0 
                      ? (inProgressOrders.length / (orders.length + inProgressOrders.length)) * 100 
                      : 0}%` 
                  }}
                ></div>
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>Pending</span>
                <span>In Progress</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content Section */}
        <Card className="border-0 shadow-md rounded-xl bg-white transition-all duration-300 hover:shadow-lg overflow-hidden">
          <CardHeader className="px-6 py-4 bg-gradient-to-r from-[#6D0000] to-[#8B0000] text-white rounded-t-xl">
            <div className="flex items-center justify-between group">
              <div>
                <CardTitle className="text-lg font-semibold text-white">Order Filtering</CardTitle>
                <CardDescription className="text-sm text-gray-200 mt-1">
                  Filter orders by branch, order date, or delivery date
                </CardDescription>
              </div>
              <Filter className="h-5 w-5 text-white/80 transition-all duration-300 group-hover:rotate-180 group-hover:text-white" />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Branch Selection */}
              <div>
                <label htmlFor="branchSelect" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Branch
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      id="branchSelect" 
                      className="w-full justify-between font-normal border-gray-200 hover:border-[#6D0000] hover:bg-[#6D0000]/5 transition-all duration-300 hover:shadow-md"
                    >
                      <span className={selectedBranch ? "text-gray-900" : "text-gray-500"}>
                        {selectedBranch || "Select branch"}
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-400 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full shadow-lg border-gray-100 rounded-lg overflow-hidden">
                    <DropdownMenuRadioGroup
                      value={selectedBranch}
                      onValueChange={(value) => setSelectedBranch(value)}
                    >
                      {orders.length > 0 &&
                        Array.from(new Set(orders.map((order) => order.branch_name))).map((branchName) => (
                          <DropdownMenuRadioItem 
                            key={branchName} 
                            value={branchName}
                            className="py-2.5 px-3 cursor-pointer hover:bg-[#6D0000]/5 focus:bg-[#6D0000]/5"
                          >
                            {branchName}
                          </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {/* Order Date Selection */}
              <div>
                <label htmlFor="orderDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Order Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-between font-normal border-gray-200 hover:border-[#6D0000] hover:bg-[#6D0000]/5 transition-all duration-300 hover:shadow-md",
                        !selectedDate && "text-gray-500"
                      )}
                      id="orderDate"
                    >
                      <span className="flex items-center">
                        <CalendarIcon className="mr-2 h-4 w-4 text-gray-400 transition-transform duration-300 group-hover:scale-110" />
                        {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-lg shadow-lg border-gray-100" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        if (date) {
                          const deliveryDate = new Date(date);
                          deliveryDate.setDate(deliveryDate.getDate() + 2);
                          setSelectedDeliveryDate(deliveryDate);
                        } else {
                          setSelectedDeliveryDate(undefined);
                        }
                      }}
                      initialFocus
                      className="rounded-md border shadow-md"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Delivery Date Selection */}
              <div>
                <label htmlFor="deliveryDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-between font-normal border-gray-200 hover:border-[#6D0000] hover:bg-[#6D0000]/5 transition-all duration-300 hover:shadow-md",
                        !selectedDeliveryDate && "text-gray-500"
                      )}
                      id="deliveryDate"
                    >
                      <span className="flex items-center">
                        <CalendarIcon className="mr-2 h-4 w-4 text-gray-400 transition-transform duration-300 group-hover:scale-110" />
                        {selectedDeliveryDate ? format(selectedDeliveryDate, "PPP") : "Select date"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-lg shadow-lg border-gray-100" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDeliveryDate}
                      onSelect={(date) => {
                        setSelectedDeliveryDate(date);
                        if (date) {
                          const orderDate = new Date(date);
                          orderDate.setDate(orderDate.getDate() - 2);
                          setSelectedDate(orderDate);
                        } else {
                          setSelectedDate(undefined);
                        }
                      }}
                      initialFocus
                      className="rounded-md border shadow-md"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="flex justify-end mt-8">
              <Button 
                variant="outline"
                onClick={() => {
                  setSelectedBranch("");
                  setSelectedDate(undefined);
                  setSelectedDeliveryDate(undefined);
                }}
                className="mr-3 border-gray-200 text-gray-600 hover:text-gray-900 transition-all duration-300 hover:shadow-sm"
              >
                Clear Filters
              </Button>
              <Button 
                onClick={fetchFilteredOrders}
                className="bg-[#6D0000] hover:bg-[#800000] px-8 py-2.5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md font-medium"
                disabled={isLoading.filtered}
              >
                {isLoading.filtered ? (
                  <span className="flex items-center">
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Filter className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:rotate-12" />
                    Apply Filters
                  </span>
                )}
              </Button>
            </div>
            
            {/* Error Alert */}
            {renderErrorAlert(errors.filtered, () => 
              setErrors(prev => ({ ...prev, filtered: "" }))
            )}
          </CardContent>
        </Card>
        
        
        {/* Error Alerts Section */}
        {errors.pending && renderErrorAlert(errors.pending, () => 
          setErrors(prev => ({ ...prev, pending: "" }))
        )}
        
        {errors.inProgress && renderErrorAlert(errors.inProgress, () => 
          setErrors(prev => ({ ...prev, inProgress: "" }))
        )}
      </main>
      
      {/* Modals */}
      {/* Order Details Modal */}
      {isOrderDetailsOpen && (
        <OrderDetailsModal
          filteredOrders={filteredOrders}
          printRef={printRef}
          handleSaveAsPDF={handleSaveAsPDF}
          onClose={handleCloseOrderDetails}
        />
      )}
      
      {/* Pending Orders Modal */}
      {isPendingOrdersOpen && (
        <PendingOrdersModal
          orders={orders}
          title="New Orders"
          onClose={() => setIsPendingOrdersOpen(false)}
          onViewOrder={handleViewOrder}
        />
      )}
      
      {/* In Progress Orders Modal */}
      {isInProgressOrdersOpen && (
        <PendingOrdersModal
          orders={inProgressOrders}
          title="In-Progress Orders"
          onClose={() => setIsInProgressOrdersOpen(false)}
          onViewOrder={handleViewOrder}
        />
      )}
    </div>
  );
}