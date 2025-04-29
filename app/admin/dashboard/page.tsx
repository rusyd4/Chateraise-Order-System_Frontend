'use client'

import { useEffect, useState, useRef } from "react";
import apiFetch from "../../../lib/api";
import Link from "next/link";
import { usePathname } from "next/navigation";
import OrderDetailsModal from "./OrderDetailsModal";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import Navbar from "../../components/AdminNavbar";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

export default function AdminDashboard() {
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

  const [orders, setOrders] = useState<Order[]>([]);

  const [loadingOrders, setLoadingOrders] = useState(false);
  const [errorOrders, setErrorOrders] = useState("");

  // New states for filtered orders and filters
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState<Date | undefined>(undefined);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loadingFilteredOrders, setLoadingFilteredOrders] = useState(false);
  const [errorFilteredOrders, setErrorFilteredOrders] = useState("");

  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  // Helper function to get today's date string in yyyy-MM-dd format
  function getTodayDateString(): string {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }

  useEffect(() => {
    fetchPendingOrders();
  }, []);


  async function fetchPendingOrders() {
    setLoadingOrders(true);
    setErrorOrders("");
    try {
      const data = await apiFetch("/admin/orders/pending");
      setOrders(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorOrders(err.message);
      } else {
        setErrorOrders(String(err));
      }
    } finally {
      setLoadingOrders(false);
    }
  }

  async function fetchFilteredOrders() {
    if (!selectedBranch && !selectedDate && !selectedDeliveryDate) {
      alert("Please select at least one filter: branch, order date, or delivery date");
      return;
    }
    setLoadingFilteredOrders(true);
    setErrorFilteredOrders("");
    try {
      const queryParams = new URLSearchParams();
      if (selectedBranch) queryParams.append("branch_name", selectedBranch);
      if (selectedDate) queryParams.append("order_date", format(selectedDate, "yyyy-MM-dd"));
      if (selectedDeliveryDate) queryParams.append("delivery_date", format(selectedDeliveryDate, "yyyy-MM-dd"));
      const data = await apiFetch("/admin/orders/filter?" + queryParams.toString());
      setFilteredOrders(data);
      setShowOrderDetails(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorFilteredOrders(err.message);
      } else {
        setErrorFilteredOrders(String(err));
      }
    } finally {
      setLoadingFilteredOrders(false);
    }
  }


  async function handleSaveAsPDF() {
    if (!printRef.current) {
      alert("Nothing to print");
      return;
    }
    if (filteredOrders.length === 0) {
      alert("No orders to update");
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
          // Optionally, you can alert or handle the error differently
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
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF");
    }
  }

  const pathname = usePathname();

  return (
    <div className="flex max-w-7xl mx-auto min-h-screen p-8 space-x-8">
      <Navbar />
      <main className="flex-1 p-0 space-y-12">
        <section>
          <h2 className="text-3xl font-bold mb-4">Track Branch Store Orders</h2>

          {/* Widgets for order statuses */}
          {/* Removed today widgets, only last 7 days widgets will be shown below filters */}

          {!showOrderDetails ? (
            <>
              <div className="mb-4 flex space-x-4 items-end">
                <div>
                  <label htmlFor="branchSelect" className="block font-medium mb-1">
                    Select Branch
                  </label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" id="branchSelect">
                        {selectedBranch || "-- Select Branches --"}
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
                <div>
                  <label htmlFor="orderDate" className="block font-medium mb-1">
                    Select Order Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                        id="orderDate"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
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
                <div>
                  <label htmlFor="deliveryDate" className="block font-medium mb-1">
                    Delivery Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
                          !selectedDeliveryDate && "text-muted-foreground"
                        )}
                        id="deliveryDate"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDeliveryDate ? format(selectedDeliveryDate, "PPP") : <span>Pick a date</span>}
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
                        }
                      }}
                      initialFocus
                    />
                    </PopoverContent>
                  </Popover>
                </div>
                <button
                  onClick={fetchFilteredOrders}
                  className="bg-[#6D0000] text-white px-4 py-2 rounded transition transform hover:scale-105 hover:bg-[#7a0000] active:translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#6D0000]"
                >
                  View Orders
                </button>
              </div>
              {loadingFilteredOrders ? (
                <p>Loading filtered orders...</p>
              ) : errorFilteredOrders ? (
                <p className="text-red-600">{errorFilteredOrders}</p>
              ) : filteredOrders.length === 0 && (selectedBranch || selectedDate) ? (
                <p>No filtered orders found.</p>
              ) : null}

              {/* Removed last 7 days order statuses widgets */}

              {/* Show all orders before filtering */}
              {loadingOrders ? (
                <p>Loading orders...</p>
              ) : errorOrders ? (
                <p className="text-red-600">{errorOrders}</p>
              ) : orders.length === 0 ? (
                <p>No orders found.</p>
              ) : null
              }
            </>
          ) : (
            <>

          <OrderDetailsModal
            filteredOrders={filteredOrders}
            printRef={printRef as React.RefObject<HTMLDivElement>}
            handleSaveAsPDF={handleSaveAsPDF}
            onClose={() => setShowOrderDetails(false)}
          />
            </>
          )}
        </section>
      </main>
    </div>
  );
}
