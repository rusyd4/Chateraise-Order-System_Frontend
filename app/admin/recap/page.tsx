"use client";

import { useEffect, useState } from "react";
import apiFetch from "../../../lib/api";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface OrderItem {
  food_name: string;
  quantity: number;
  price?: number;
}

interface Order {
  order_id: number;
  branch_name: string;
  order_date: string;
  submitted_at: string;
  items: OrderItem[];
}

type FilterOption = "today" | "last7days" | "last30days";

export default function AdminRecap() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<FilterOption>("today");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pathname = usePathname();

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  async function fetchOrders() {
    setLoading(true);
    setError("");
    try {
      const data: Order[] = await apiFetch("/admin/orders");
      setOrders(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setLoading(false);
    }
  }

  // Filter orders based on selected filter option
  function filterOrdersByDate(orders: Order[]): Order[] {
    const now = new Date();
    return orders.filter((order) => {
      const orderDate = new Date(order.order_date);
      if (filter === "today") {
        return (
          orderDate.getFullYear() === now.getFullYear() &&
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getDate() === now.getDate()
        );
      } else if (filter === "last7days") {
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        return orderDate >= sevenDaysAgo && orderDate <= now;
      } else if (filter === "last30days") {
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return orderDate >= thirtyDaysAgo && orderDate <= now;
      }
      return true;
    });
  }

  // Aggregate data: item names on left, store names on top, quantities in cells, plus total per item
  function aggregateData(orders: Order[]) {
    const filteredOrders = filterOrdersByDate(orders);

    // Get unique store names
    const storeNames = Array.from(new Set(filteredOrders.map((order) => order.branch_name)));

    // Map of item name to map of store name to quantity
    const itemStoreMap: Record<string, Record<string, number>> = {};

    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!itemStoreMap[item.food_name]) {
          itemStoreMap[item.food_name] = {};
        }
        if (!itemStoreMap[item.food_name][order.branch_name]) {
          itemStoreMap[item.food_name][order.branch_name] = 0;
        }
        itemStoreMap[item.food_name][order.branch_name] += item.quantity;
      });
    });

    // Calculate total per item
    const items = Object.keys(itemStoreMap).map((itemName) => {
      const storeQuantities = itemStoreMap[itemName];
      const total = Object.values(storeQuantities).reduce((acc, val) => acc + val, 0);
      return { itemName, storeQuantities, total };
    });

    return { storeNames, items };
  }

  const { storeNames, items } = aggregateData(orders);

  return (
    <div className="flex max-w-7xl mx-auto min-h-screen p-8 space-x-8">
      <nav className="w-48 flex flex-col space-y-4 border-r border-gray-300 pr-4">
        <Link
          href="/admin/dashboard"
          className={`px-3 py-2 rounded ${
            pathname === "/admin/dashboard" ? "bg-blue-600 text-white" : "hover:bg-gray-200"
          }`}
        >
          Orders
        </Link>
        <Link
          href="/admin/food"
          className={`px-3 py-2 rounded ${
            pathname === "/admin/food" ? "bg-blue-600 text-white" : "hover:bg-gray-200"
          }`}
        >
          Manage Food Items
        </Link>
        <Link
          href="/admin/branch"
          className={`px-3 py-2 rounded ${
            pathname === "/admin/branch" ? "bg-blue-600 text-white" : "hover:bg-gray-200"
          }`}
        >
          Manage Branch Stores
        </Link>
        <Link
          href="/admin/recap"
          className={`px-3 py-2 rounded ${
            pathname === "/admin/recap" ? "bg-blue-600 text-white" : "hover:bg-gray-200"
          }`}
        >
          Recap
        </Link>
      </nav>
      <main className="flex-1">
        <h1 className="text-3xl font-bold mb-6">Recap of Orders</h1>

        <div className="mb-6">
          <label htmlFor="filter" className="mr-4 font-medium">
            Filter by:
          </label>
          <select
            id="filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterOption)}
            className="border border-gray-300 rounded px-3 py-2"
          >
            <option value="today">Today</option>
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
          </select>
        </div>

        {loading ? (
          <p>Loading orders...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : items.length === 0 ? (
          <p>No orders found for the selected period.</p>
        ) : (
          <div className="overflow-auto border border-gray-300 rounded">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">Item Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Total</th>
                  {storeNames.map((store) => (
                    <th key={store} className="border border-gray-300 px-4 py-2 text-right">
                      {store}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(({ itemName, storeQuantities, total }) => (
                  <tr key={itemName} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">{itemName}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right font-semibold">{total}</td>
                    {storeNames.map((store) => (
                      <td key={store} className="border border-gray-300 px-4 py-2 text-right">
                        {storeQuantities[store] || 0}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
