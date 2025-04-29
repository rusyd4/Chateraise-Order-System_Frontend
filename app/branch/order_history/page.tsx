"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiFetch from "../../../lib/api";
import BranchNavbar from "../../components/BranchNavbar";
import { Calendar } from "@/components/ui/calendar";
import * as XLSX from "xlsx";

interface OrderItem {
  food_name: string;
  quantity: number;
  price: number;
}

interface Order {
  order_id: number;
  delivery_date: string;
  order_date: string;
  items: OrderItem[];
}

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [orderHistoryHover, setOrderHistoryHover] = useState(false);
  const [storeHover, setStoreHover] = useState(false);

  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [appliedDateRange, setAppliedDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [showCalendar, setShowCalendar] = useState(false);

  const router = useRouter();
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (appliedDateRange.from && appliedDateRange.to) {
      const filtered = orders.filter((order) => {
        const orderDate = new Date(order.order_date);
        return orderDate >= appliedDateRange.from! && orderDate <= appliedDateRange.to!;
      });
      setFilteredOrders(filtered);
    } else {
      setFilteredOrders(orders);
    }
  }, [appliedDateRange, orders]);

  async function fetchOrders() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/branch/orders");
      setOrders(data);
      setFilteredOrders(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  }

  // Remove handleMonthChange and monthFilter state as they are no longer needed

  // Extract unique order_date dates sorted ascending
  const uniqueDates = Array.from(
    new Set(filteredOrders.map((order) => new Date(order.order_date).toISOString().slice(0, 10)))
  ).sort();

  // Extract unique food items with price
  interface FoodAggregate {
    food_name: string;
    price: number;
    totalQty: number;
    qtyByDate: { [date: string]: number };
  }

  const foodMap: { [foodName: string]: FoodAggregate } = {};

  filteredOrders.forEach((order) => {
    const orderDate = new Date(order.order_date).toISOString().slice(0, 10);
    order.items.forEach((item) => {
      if (!foodMap[item.food_name]) {
        foodMap[item.food_name] = {
          food_name: item.food_name,
          price: item.price,
          totalQty: 0,
          qtyByDate: {},
        };
      }
      foodMap[item.food_name].totalQty += item.quantity;
      foodMap[item.food_name].qtyByDate[orderDate] =
        (foodMap[item.food_name].qtyByDate[orderDate] || 0) + item.quantity;
    });
  });

  const foodAggregates = Object.values(foodMap);

  function goToOrderHistory() {
    router.push("/branch/order_history");
  }

  // Export to Excel function
  function exportToExcel() {
    const wsData = [];

    // Header rows
    wsData.push(["", "", "Order Date", ...uniqueDates]);
    wsData.push(["", "", "", ...uniqueDates.map(date => new Date(date).toLocaleDateString(undefined, { day: "2-digit", month: "short" }))]);
    wsData.push(["", "", "Delivery Date", ...uniqueDates.map(date => {
      const orderDate = new Date(date);
      orderDate.setDate(orderDate.getDate() + 2);
      return orderDate.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
    })]);
    wsData.push(["Food Items", "Price", "Total Quantity", ...uniqueDates]);

    // Data rows
    foodAggregates.forEach(food => {
      const row = [
        food.food_name,
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(food.price),
        food.totalQty,
        ...uniqueDates.map(date => food.qtyByDate[date] || 0)
      ];
      wsData.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Order History");
    XLSX.writeFile(wb, "order_history.xlsx");
  }

  return (
    <>
      <BranchNavbar />
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Order History</h1>
        <div className="mb-4">
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="bg-[#6D0000] text-white px-4 py-2 rounded transition transform hover:scale-105 hover:bg-[#7a0000] active:translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#6D0000]"
          >
            {showCalendar ? "Done" : "Select Date Range"}
          </button>
          {showCalendar && (
            <div className="mt-4">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  if (range && "from" in range && "to" in range) {
                    setDateRange({ from: range.from, to: range.to });
                  } else {
                    setDateRange({ from: undefined, to: undefined });
                  }
                }}
                numberOfMonths={2}
              />
            </div>
          )}
        </div>
        <div className="mb-4 flex space-x-4">
          <button
            onClick={() => setAppliedDateRange(dateRange)}
            className="bg-[#6D0000] text-white px-4 py-2 rounded transition transform hover:scale-105 hover:bg-[#7a0000] active:translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#6D0000]"
          >
            Apply
          </button>
          <button
            onClick={() => {
              setDateRange({ from: undefined, to: undefined });
              setAppliedDateRange({ from: undefined, to: undefined });
            }}
            className="bg-[#6D0000] text-white px-4 py-2 rounded transition transform hover:scale-105 hover:bg-[#7a0000] active:translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#6D0000]"
          >
            Reset
          </button>
          <button
            onClick={exportToExcel}
            className="bg-[#6D0000] text-white px-4 py-2 rounded transition transform hover:scale-105 hover:bg-[#7a0000] active:translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#6D0000]"
          >
            Export to Excel
          </button>
        </div>
        {loading && <p>Loading orders...</p>}
        {error && <p className="text-red-600">Error: {error}</p>}
        <div className="overflow-x-auto">
          <table className="min-w-full border border-black text-center rounded-lg overflow-hidden">
            <thead className="bg-[#6D0000] text-white">
              <tr className="border-b border-white">
                <th colSpan={3}></th>
                <th colSpan={uniqueDates.length} className="border border-white px-4 py-2 font-semibold">
                  Order Date
                </th>
              </tr>
              <tr className="border-b border-white">
                <th colSpan={3}></th>
                {uniqueDates.map((date) => (
                  <th key={date} className="border border-white px-4 py-2">
                    {new Date(date).toLocaleDateString(undefined, { day: "2-digit", month: "short" })}
                  </th>
                ))}
              </tr>
              <tr className="border-b border-white">
                <th colSpan={3}></th>
                <th colSpan={uniqueDates.length} className="border border-white px-4 py-2 font-semibold">
                  Delivery Date
                </th>
              </tr>
              <tr className="border-b border-white">
                <th className="border border-white px-4 py-2 font-semibold">Food Items</th>
                <th className="border border-white px-4 py-2 font-semibold">Price</th>
                <th className="border border-white px-4 py-2 font-semibold">Total Quantity</th>
                {uniqueDates.map((date) => {
                  const orderDate = new Date(date);
                  orderDate.setDate(orderDate.getDate() + 2);
                  return (
                    <th key={"qty-" + date} className="border border-white px-4 py-2 font-semibold">
                      {orderDate.toLocaleDateString(undefined, { day: "2-digit", month: "short" })}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {foodAggregates.length === 0 ? (
                <tr>
                  <td colSpan={3 + uniqueDates.length} className="text-center py-4">
                    No orders found.
                  </td>
                </tr>
              ) : (
                foodAggregates.map((food) => (
                  <tr key={food.food_name} className="border-t border-[#6D0000] hover:bg-[#f9e6e6] transition-colors duration-200">
                    <td className="border border-[#6D0000] px-4 py-2 text-left">{food.food_name}</td>
                    <td className="border border-[#6D0000] px-4 py-2">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(food.price)}</td>
                    <td className="border border-[#6D0000] px-4 py-2">{food.totalQty}</td>
                    {uniqueDates.map((date) => (
                      <td key={date} className="border border-[#6D0000] px-4 py-2">
                        {food.qtyByDate[date] || 0}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
