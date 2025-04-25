"use client";

import { useEffect, useState, useRef } from "react";
import apiFetch from "../../../lib/api";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminDashboard() {
  interface OrderItem {
    food_name: string;
    quantity: number;
  }

  interface Order {
    order_id: number;
    branch_name: string;
    order_date: string;
    submitted_at: string;
    delivery_time?: string;
    branch_address?: string;
    items: OrderItem[];
  }

  const [orders, setOrders] = useState<Order[]>([]);

  const [loadingOrders, setLoadingOrders] = useState(false);
  const [errorOrders, setErrorOrders] = useState("");

  // New states for filtered orders and filters
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loadingFilteredOrders, setLoadingFilteredOrders] = useState(false);
  const [errorFilteredOrders, setErrorFilteredOrders] = useState("");

  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedDeliveryTime, setSelectedDeliveryTime] = useState("8am - 10am");

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
      const recentOrders = data.filter((order: Order) => isOrderWithinLastWeek(order.order_date));
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
      if (selectedDate) queryParams.append("order_date", selectedDate);
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
      <nav className="w-48 flex flex-col space-y-4 border-r border-gray-300 pr-4">
        <div className="mb-4">
          <img
            src="/Chateraiselogo.png"
            alt="Chateraise Logo"
            width={200}
            height={70}
            className="object-contain"
          />
        </div>
        <Link
          href="/admin/dashboard"
          className={
            "px-3 py-2 rounded transition transform " +
            (pathname === "/admin/dashboard"
              ? "bg-[#6D0000] text-white"
              : "hover:bg-[#7a0000] hover:text-white hover:scale-105")
          }
        >
          Orders
        </Link>
        <Link
          href="/admin/food"
          className={
            "px-3 py-2 rounded transition transform " +
            (pathname === "/admin/food"
              ? "bg-[#6D0000] text-white"
              : "hover:bg-[#7a0000] hover:text-white hover:scale-105")
          }
        >
          Manage Products
        </Link>
        <Link
          href="/admin/branch"
          className={
            "px-3 py-2 rounded transition transform " +
            (pathname === "/admin/branch"
              ? "bg-[#6D0000] text-white"
              : "hover:bg-[#7a0000] hover:text-white hover:scale-105")
          }
        >
          Manage Branch Stores
        </Link>
        <Link
          href="/admin/recap"
          className={
            "px-3 py-2 rounded transition transform " +
            (pathname === "/admin/recap"
              ? "bg-[#6D0000] text-white"
              : "hover:bg-[#7a0000] hover:text-white hover:scale-105")
          }
        >
          Recap
        </Link>
      </nav>
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
                  <select
                    id="branchSelect"
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="border border-[#6D0000] rounded px-3 py-2 transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#6D0000]"
                  >
                    <option value="">-- All Branches --</option>
                    {orders.length > 0 &&
                      Array.from(new Set(orders.map((order) => order.branch_name))).map((branchName) => (
                        <option key={branchName} value={branchName}>
                          {branchName}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="orderDate" className="block font-medium mb-1">
                    Select Order Date
                  </label>
                  <input
                    type="date"
                    id="orderDate"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="border border-[#6D0000] rounded px-3 py-2 transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#6D0000]"
                  />
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
                      <p><strong>Order Date:</strong> {order.order_date}</p>
                      <p><strong>Submission Time:</strong> {order.submitted_at}</p>
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
                      {filteredOrders.map((order: Order, index: number) => (
                        <div key={order.order_id || index} className="mb-6 border-b border-gray-300 pb-4">
                          <p>
                            <strong>Order ID:</strong> {order.order_id}
                          </p>
                          <p>
                            <strong>Branch Name:</strong> {order.branch_name}
                          </p>
                          <p>
                            <strong>Order Date:</strong> {order.order_date}
                          </p>
                          <p>
                            <strong>Submission Time:</strong> {order.submitted_at}
                          </p>
                          <p>
                            <strong>Delivery Time:</strong> {selectedDeliveryTime}
                          </p>
                          <p>
                            <strong>Branch Address:</strong> {order.branch_address || "N/A"}
                          </p>
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
                    </>
                  )}
                </div>
                {/* Delivery Time Selector and Buttons */}
                <div className="ml-4 flex flex-col space-y-4">
                  <label htmlFor="deliveryTimeSelect" className="font-medium mb-1 text-white">
                    Select Delivery Time
                  </label>
                  <select
                    id="deliveryTimeSelect"
                    value={selectedDeliveryTime}
                    onChange={(e) => setSelectedDeliveryTime(e.target.value)}
                    className="px-3 py-2 rounded bg-white"
                  >
                    <option value="8am - 10am">8am - 10am</option>
                    <option value="9am - 11am">9am - 11am</option>
                    <option value="10am - 12pm">10am - 12pm</option>
                    <option value="1pm - 3pm">1pm - 3pm</option>
                    <option value="3pm - 5pm">3pm - 5pm</option>
                  </select>
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
