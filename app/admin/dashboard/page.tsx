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
  ChevronLeft
} from "lucide-react";

// Components
import Navbar from "../../components/AdminNavbar";
import OrderDetailsModal from "./OrderDetailsModal";
import PendingOrdersModal from "./PendingOrdersModal";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  // Type definitions
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

  const printRef = useRef<HTMLDivElement>(null);
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
      <Alert variant="destructive" className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="flex justify-between items-center">
          <span>{message}</span>
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  };

  const renderOrdersTable = (ordersData: Order[], title: string) => {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {ordersData.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No orders found</p>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {ordersData.map((order) => (
                  <Card key={order.order_id} className="mb-4">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">
                          Order #{order.order_id}
                        </CardTitle>
                        <Badge variant="outline" className="ml-2">
                          {title === "Pending Orders" ? (
                            <Clock className="h-3 w-3 mr-1 text-amber-500" />
                          ) : (
                            <RefreshCw className="h-3 w-3 mr-1 text-blue-500" />
                          )}
                          {title === "Pending Orders" ? "Pending" : "In Progress"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center">
                          <Store className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{order.branch_name}</span>
                        </div>
                        <div className="flex items-center">
                          <Truck className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{format(new Date(order.delivery_date), "PP")}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="ml-auto"
                        onClick={() => handleViewOrder(order)}
                      >
                        View Details
                      </Button>
                    </CardFooter>
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
    <div className="flex max-w-7xl mx-auto min-h-screen p-4 lg:p-8 gap-4 lg:gap-8">
      <Navbar />
      <main className="flex-1 p-0 space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Store Orders Dashboard</h1>
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleRefresh}
            title="Refresh Data"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Pending Orders</CardTitle>
              <CardDescription>Waiting for processing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">
                  {isLoading.pending ? (
                    <Skeleton className="h-10 w-12" />
                  ) : (
                    orders.length
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPendingOrdersOpen(true)}
                >
                  View All
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">In Progress</CardTitle>
              <CardDescription>Currently being processed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">
                  {isLoading.inProgress ? (
                    <Skeleton className="h-10 w-12" />
                  ) : (
                    inProgressOrders.length
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsInProgressOrdersOpen(true)}
                >
                  View All
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Total Orders</CardTitle>
              <CardDescription>All current orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">
                  {isLoading.pending || isLoading.inProgress ? (
                    <Skeleton className="h-10 w-12" />
                  ) : (
                    orders.length + inProgressOrders.length
                  )}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content Section */}
        <Card>
          <CardHeader>
            <CardTitle>Track Branch Store Orders</CardTitle>
            <CardDescription>
              Filter and manage orders from all branch stores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="filter" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-1 mb-6">
                <TabsTrigger value="filter">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter Orders
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="filter" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Branch Selection */}
                  <div>
                    <label htmlFor="branchSelect" className="block text-sm font-medium mb-2">
                      Select Branch
                    </label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" id="branchSelect" className="w-full justify-start">
                          {selectedBranch || "-- Select Branch --"}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56">
                        <DropdownMenuRadioGroup
                          value={selectedBranch}
                          onValueChange={(value) => setSelectedBranch(value)}
                        >
                          {orders.length > 0 &&
                            Array.from(new Set(orders.map((order) => order.branch_name))).map((branchName) => (
                              <DropdownMenuRadioItem key={branchName} value={branchName}>
                                {branchName}
                              </DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {/* Order Date Selection */}
                  <div>
                    <label htmlFor="orderDate" className="block text-sm font-medium mb-2">
                      Order Date
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left",
                            !selectedDate && "text-muted-foreground"
                          )}
                          id="orderDate"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : <span>Select date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
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
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  {/* Delivery Date Selection */}
                  <div>
                    <label htmlFor="deliveryDate" className="block text-sm font-medium mb-2">
                      Delivery Date
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left",
                            !selectedDeliveryDate && "text-muted-foreground"
                          )}
                          id="deliveryDate"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDeliveryDate ? format(selectedDeliveryDate, "PPP") : <span>Select date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
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
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                {/* Filter Button */}
                <div className="flex justify-end mt-6">
                  <Button 
                    onClick={fetchFilteredOrders}
                    className="bg-[#6D0000] hover:bg-[#7a0000]"
                    disabled={isLoading.filtered}
                  >
                    {isLoading.filtered ? "Loading..." : "View Orders"}
                  </Button>
                </div>
                
                {/* Error Alert */}
                {renderErrorAlert(errors.filtered, () => 
                  setErrors(prev => ({ ...prev, filtered: "" }))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        {/* Orders Widgets Section - Moved to bottom */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderOrdersTable(orders.slice(0, 5), "Pending Orders")}
          {renderOrdersTable(inProgressOrders.slice(0, 5), "In Progress Orders")}
        </div>
        
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
          title="Pending Orders"
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