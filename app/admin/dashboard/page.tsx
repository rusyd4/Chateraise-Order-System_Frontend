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

  function handleSaveAsPDF() {
    if (!printRef.current) return;

    const printContents = printRef.current.innerHTML;
    const newWindow = window.open("", "_blank", "width=800,height=600");
    if (newWindow) {
      newWindow.document.write(
        '<html><head><title>Order Details</title><style>' +
        'body { font-family: Arial, sans-serif; padding: 20px; }' +
        'table { width: 100%; border-collapse: collapse; }' +
        'th, td { border: 1px solid #6D0000; padding: 8px; text-align: left; }' +
        'th { background-color: #f0f0f0; }' +
        '</style></head><body>' +
        printContents +
        '</body></html>'
      );
      newWindow.document.close();
      newWindow.focus();
      newWindow.print();
      // Optionally close the window after printing
      // newWindow.close();
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
                    Select Delivery Date
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
                        onSelect={setSelectedDeliveryDate}
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
              {/* Show all orders before filtering */}
              {loadingOrders ? (
                <p>Loading orders...</p>
              ) : errorOrders ? (
                <p className="text-red-600">{errorOrders}</p>
              ) : orders.length === 0 ? (
                <p>No orders found.</p>
              ) : (
                <div className="mt-6 border border-gray-300 rounded p-4 max-h-[60vh] overflow-y-auto">
                  <h3 className="text-xl font-semibold mb-4">Past 7 Days Orders</h3>
                  {orders.map((order) => (
                    <div key={order.order_id} className="mb-4 border-b border-gray-300 pb-2">
                      <p><strong>Order ID:</strong> {order.order_id}</p>
                      <p><strong>Branch Name:</strong> {order.branch_name}</p>
                      <p><strong>Order Date:</strong> {order.delivery_date}</p>
                      <p><strong>Submission Time:</strong> {order.order_date}</p>
                      <p><strong>Branch Address:</strong> {order.branch_address || "N/A"}</p>
                      <div className="mt-2">
                        <strong>Items:</strong>
                        <table className="w-full mt-1 border border-[#6D0000] rounded">
                          <thead>
                            <tr className="bg-[#6D0000] text-white">
                              <th className="border border-[#6D0000] px-2 py-1 text-left">Food Name</th>
                              <th className="border border-[#6D0000] px-2 py-1 text-left">Quantity</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item, idx) => (
                              <tr key={idx} className="odd:bg-white even:bg-gray-50">
                                <td className="border border-gray-300 px-2 py-1">{item.food_name}</td>
                                <td className="border border-gray-300 px-2 py-1">{item.quantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Modal Overlay */}
              <div className="fixed inset-0 bg-black/75 flex justify-center items-center z-50">
                {/* Modal Content */}
                <div
                  ref={printRef}
                  className="bg-white p-6 border border-gray-300 rounded shadow max-w-3xl w-full max-h-[80vh] overflow-y-auto"
                >
                  <h2 className="text-3xl font-bold mb-4">Order Details</h2>
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
                              <div className="flex items-center space-x-2">
                                <img
                                  src="/Chateraiselogo.png"
                                  alt="Chateraise Logo"
                                  width={60}
                                  height={60}
                                  className="object-contain"
                                />
                              </div>
                              <table className="text-sm border border-gray-300 rounded w-auto">
                                <tbody>
                                  <tr>
                                    <td className="border border-gray-300 px-2 py-1 font-semibold">Order Date</td>
                                    <td className="border border-gray-300 px-2 py-1">{orderDateFormatted}</td>
                                  </tr>
                                  <tr>
                                    <td className="border border-gray-300 px-2 py-1 font-semibold">Jam Datang</td>
                                    <td className="border border-gray-300 px-2 py-1">--:--</td>
                                  </tr>
                                  <tr>
                                    <td className="border border-gray-300 px-2 py-1 font-semibold">Jam Selesai</td>
                                    <td className="border border-gray-300 px-2 py-1">--:--</td>
                                  </tr>
                                  <tr>
                                    <td className="border border-gray-300 px-2 py-1 font-semibold">Suhu Truck</td>
                                    <td className="border border-gray-300 px-2 py-1">-- °C</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>

                            {/* Document Title */}
                            <h1 className="text-center text-4xl font-extrabold mb-6">DELIVERY ORDER</h1>

                            {/* Customer and Delivery Information */}
                            <div className="mb-6 grid grid-cols-2 gap-x-8">
                              <div className="space-y-1 font-semibold">
                                <p>Customer Name</p>
                                <p>Delivery Date</p>
                                <p>Delivery Time</p>
                                <p>Delivery Address</p>
                              </div>
                              <div className="space-y-1">
                                <p>{order.branch_name}</p>
                                <p>{`${deliveryDateFormatted} (${deliveryDay})`}</p>
                                <p>{order.delivery_time || "--"}</p>
                                <p>{order.branch_address || "--"}</p>
                              </div>
                            </div>

                            {/* Product Table */}
                            <table className="w-full border border-[#6D0000] rounded mb-6 text-sm">
                              <thead>
                                <tr className="bg-[#6D0000] text-white">
                                  <th className="border border-[#6D0000] px-2 py-1">Case Mark</th>
                                  <th className="border border-[#6D0000] px-2 py-1">Product name</th>
                                  <th className="border border-[#6D0000] px-2 py-1">Qty</th>
                                  <th className="border border-[#6D0000] px-2 py-1" colSpan={3}>
                                    Damage Report (Qty)
                                  </th>
                                </tr>
                                <tr className="bg-[#6D0000] text-white">
                                  <th className="border border-[#6D0000] px-2 py-1"></th>
                                  <th className="border border-[#6D0000] px-2 py-1"></th>
                                  <th className="border border-[#6D0000] px-2 py-1"></th>
                                  <th className="border border-[#6D0000] px-2 py-1">Melt Cream</th>
                                  <th className="border border-[#6D0000] px-2 py-1">Broken</th>
                                  <th className="border border-[#6D0000] px-2 py-1">Other</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.items.map((item, idx) => (
                                  <tr key={idx} className="odd:bg-white even:bg-gray-50">
                                    <td className="border border-gray-300 px-2 py-1">A5000{item.food_id}</td>
                                    <td className="border border-gray-300 px-2 py-1">{item.food_name}</td>
                                    <td className="border border-gray-300 px-2 py-1">{item.quantity} carton</td>
                                    <td className="border border-gray-300 px-2 py-1"></td>
                                    <td className="border border-gray-300 px-2 py-1"></td>
                                    <td className="border border-gray-300 px-2 py-1"></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>

                            {/* Notes Section */}
                            <div className="flex justify-between">
                              <div className="w-1/2">
                                <h3 className="font-semibold mb-2">Catatan (Notes)</h3>
                                <ul className="list-disc list-inside text-sm space-y-1">
                                  <li>Upper carton from pudding must be returned.</li>
                                  <li>Count again upon receipt.</li>
                                  <li>Complaints after leaving the store/factory will not be accepted.</li>
                                  <li>
                                    If there are damaged products, a report (BAP) and photo must be written and sent
                                    immediately via email.
                                  </li>
                                </ul>
                              </div>

                              {/* Signature/Confirmation Table */}
                              <div className="w-1/2 pl-4">
                                <table className="w-full border border-gray-300 text-sm">
                                  <thead>
                                    <tr>
                                      <th className="border border-gray-300 px-2 py-1">Received by</th>
                                      <th className="border border-gray-300 px-2 py-1">Delivered by</th>
                                      <th className="border border-gray-300 px-2 py-1">Prepared by</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td className="border border-gray-300 px-2 py-12"></td>
                                      <td className="border border-gray-300 px-2 py-12"></td>
                                      <td className="border border-gray-300 px-2 py-12"></td>
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
