
'use client'

import { useEffect, useState, useRef } from "react";
import apiFetch from "../../../lib/api";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
import Navbar from "../Navbar";

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

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  function isOrderWithinLastWeek(orderDateStr: string): boolean {
    const orderDate = new Date(orderDateStr);
    const now = new Date();
    const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    return orderDate >= sevenDaysAgo && orderDate <= now;
  }

  async function fetchOrders() {
    setLoadingOrders(true);
    setErrorOrders("");
    try {
      const data = await apiFetch("/admin/orders");
      // Filter orders to only those from the last week
      const recentOrders = data.filter((order: Order) => isOrderWithinLastWeek(order.delivery_date));
      setOrders(recentOrders);
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
    if (!selectedBranch && !selectedDate) {
      alert("Please select at least one filter: branch or date");
      return;
    }
    setLoadingFilteredOrders(true);
    setErrorFilteredOrders("");
    try {
      const queryParams = new URLSearchParams();
      if (selectedBranch) queryParams.append("branch_name", selectedBranch);
      if (selectedDate) queryParams.append("delivery_date", format(selectedDate, "yyyy-MM-dd"));
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
    const element = printRef.current;
    try {
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
                        {selectedBranch || "-- All Branches --"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <DropdownMenuRadioGroup
                        value={selectedBranch}
                        onValueChange={(value) => setSelectedBranch(value)}
                      >
                        <DropdownMenuRadioItem value="">
                          -- All Branches --
                        </DropdownMenuRadioItem>
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
                <div
                  id="deliveryDate"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal border border-gray-300 rounded px-3 py-1 text-sm leading-6",
                    !selectedDeliveryDate && "text-muted-foreground"
                  )}
                >
                  {selectedDeliveryDate ? format(selectedDeliveryDate, "PPP") : "No delivery date"}
                </div>
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
              {/* Modal Overlay */}
              <div className="fixed inset-0 bg-black/75 flex justify-center items-center z-50 overflow-y-auto">
                {/* Modal Content */}
                <div
                  ref={printRef}
                  className="bg-white p-8 border border-gray-300 rounded shadow"
                  style={{ height: '95vh', width: 'calc(95vh / 1.414)' }}
                >
                  {filteredOrders.length === 0 ? (
                    <p>No orders to display.</p>
                  ) : (
                    <>
                      {filteredOrders.map((order: Order, index: number) => {
                        // Format dates
                        const orderDateFormatted = new Date(order.order_date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: '2-digit',
                        });
                        const deliveryDateObj = new Date(order.delivery_date);
                        const deliveryDateFormatted = deliveryDateObj.toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                        });
                        const deliveryDay = deliveryDateObj.toLocaleDateString('en-US', { weekday: 'short' });

                        return (
                          <div key={order.order_id || index} className="mb-6 border-b border-gray-300 pb-4">
                            {/* Header Section */} 
                            <div className="flex justify-between items-center mb-4">
                              <div className="flex items-center space-x-4">
                                <img
                                  src="/Chateraiselogo.png"
                                  alt="Chateraise Logo"
                                  width={120}
                                  height={120}
                                  className="object-contain"
                                />
                                {order.qrCodeImageUrl && (
                                  <img
                                    src={order.qrCodeImageUrl}
                                    alt="Order QR Code"
                                    width={80}
                                    height={80}
                                    className="object-contain border border-gray-300 rounded"
                                  />
                                )}
                              </div>
                              <table className="text-sm border border-black rounded w-auto">
                                <tbody>
                                  <tr>
                                    <td className="text-[10px] border border-t-white border-b-black border-x-white p-1 font-semibold">Order Date</td>
                                    <td className="text-[10px] border border-t-white border-b-black border-x-white px-2 py-1"></td>
                                    <td className="text-[10px] border border-t-white border-b-black border-x-white x-2 py-1">{orderDateFormatted}</td>
                                    <td className="text-[10px] border border-t-white border-b-black border-x-white px-2 py-1"></td>
                                  </tr> 
                                  <tr>
                                    <td className="text-[10px] border border-black p-1 font-semibold">Jam Datang</td>
                                    <td className="text-[10px] border border-black px-6 py-1"></td>
                                    <td className="text-[10px] border border-black p-1 font-semibold">Jam Selesai</td>
                                    <td className="text-[10px] border border-black px-6 py-1"></td>
                                  </tr>
                                  <tr>
                                    <td className="text-[10px] border border-black p-1 font-semibold">Suhu Truck</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>

                            {/* Document Title */}
                            <h1 className="text-center text-4xl font-extrabold mb-6">DELIVERY ORDER</h1>

                            {/* Customer and Delivery Information */}
                            <div className="mb-6 grid grid-cols-3 gap-x-8">
                              <div className="space-y-1">
                                <p>Customer Name  :</p>
                                <p>Delivery Date  :</p>
                                <p>Delivery Time  :</p>
                                <p>Delivery Address :</p>
                              </div>
                              <div className="space-y-1 font-bold">
                                <p>{order.branch_name}</p>
                                <p>{`${deliveryDateFormatted} (${deliveryDay})`}</p>
                                <p>{order.delivery_time || "--"}</p>
                                <p>{order.branch_address || "--"}</p>
                              </div>
                            </div>

                            {/* Product Table */}
                            <table className="w-full border border-black rounded mb-6 text-sm">
                              <thead>
                                <tr>
                                  <th className="border border-t-white border-b-black border-x-white px-2 py-1"></th>
                                  <th className="border border-t-white border-b-black border-x-white px-2 py-1"></th>
                                  <th className="border border-t-white border-b-black border-l-white border-r-black px-2 py-1"></th>
                                  <th className="border border-black px-2 py-1" colSpan={3}>
                                    Damage Report (Qty)
                                  </th>
                                </tr>
                                <tr>
                                  <th className="border border-black px-2 py-1">Case Mark</th>
                                  <th className="border border-black px-2 py-1">Product</th>
                                  <th className="border border-black px-2 py-1">Qty</th>
                                  <th className="border border-black px-2 py-1">Melt Cream</th>
                                  <th className="border border-black px-2 py-1">Broken</th>
                                  <th className="border border-black px-2 py-1">Other</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.items.map((item, idx) => (
                                  <tr key={idx} className="odd:bg-white even:bg-gray-50">
                                    <td className="border border-black px-2 py-1">{item.food_id}</td>
                                    <td className="border border-black px-2 py-1">{item.food_name}</td>
                                    <td className="border border-black px-2 py-1">{item.quantity} carton</td>
                                    <td className="border border-black px-2 py-1"></td>
                                    <td className="border border-black px-2 py-1"></td>
                                    <td className="border border-black px-2 py-1"></td>
                                    </tr>
                                ))}
                              </tbody>
                            </table>

                            {/* Notes Section */}
                            <div className="flex justify-between">
                              <div className="w-1/2">
                                <h3 className="font-semibold mb-2">Catatan</h3>
                                <ul className="list-disc list-inside text-[10px] space-y-1">
                                  <p className="font-bold underline">
                                    1. Upper Carton dari pudding wajib dikembalikan
                                  </p>
                                  <p>2. Hitung ulang saat penerimaan</p>
                                  <p>3. Komplain setelah meninggalkan toko/pabrik tidak diterima</p>
                                  <p>
                                    4. Jika ada produk rusak wajib menuliskan BAP & foto. Kirim segera melalui email
                                  </p>
                                </ul>
                              </div>

                              {/* Signature/Confirmation Table */}
                              <div className="w-1/2 pl-4">
                                <table className="w-full border border-black text-[12px]">
                                  <thead>
                                    <tr>
                                      <th className="border border-black py-1">Received by</th>
                                      <th className="border border-black py-1">Delivered by</th>
                                      <th className="border border-black py-1">Prepared by</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td className="border border-black px-8 py-8"></td>
                                      <td className="border border-black px-8 py-8"></td>
                                      <td className="border border-black px-8 py-8"></td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
                <div className="ml-4 flex flex-col space-y-4">
                  <button
                    onClick={handleSaveAsPDF}
                    className="bg-[#6D0000] text-white px-4 py-2 rounded transition transform hover:scale-105 hover:bg-[#7a0000] active:translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#6D0000]"
                  >
                    Save as PDF
                  </button>
                  <button
                    onClick={() => setShowOrderDetails(false)}
                    className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
                  >
                    Back to Filters
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
