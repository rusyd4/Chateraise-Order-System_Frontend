"use client";

import apiFetch from "../../../lib/api";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Calendar } from "../../../components/ui/calendar";
import * as XLSX from "xlsx";
import Navbar from "../../components/AdminNavbar";

interface OrderItem {
  food_id: number;
  food_name: string;
  quantity: number;
  price?: number;
}

interface Order {
  order_id: number;
  branch_name: string;
  delivery_date: string;
  order_date: string;
  items: OrderItem[];
}

interface FoodItem {
  food_id: number;
  food_name: string;
}

export default function AdminRecap() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [appliedDateRange, setAppliedDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });

  const pathname = usePathname();

  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchFoodItems();
  }, []);

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

  async function fetchFoodItems() {
    try {
      const data: FoodItem[] = await apiFetch("/admin/food-items");
      setFoodItems(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    }
  }

  // Filter orders based on selected date range
  function filterOrdersByDateRange(orders: Order[]): Order[] {
    if (!appliedDateRange.from || !appliedDateRange.to) {
      return orders;
    }
    const fromDate = new Date(appliedDateRange.from);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(appliedDateRange.to);
    toDate.setHours(23, 59, 59, 999);

    return orders.filter((order) => {
      const orderDate = new Date(order.delivery_date);
      return orderDate >= fromDate && orderDate <= toDate;
    });
  }

  // Aggregate data: item names on left, store names on top, quantities in cells, plus total per item
  function aggregateData(orders: Order[]) {
    const filteredOrders = filterOrdersByDateRange(orders);

    // Get unique store names
    const storeNames = Array.from(new Set(filteredOrders.map((order) => order.branch_name)));

    // Create a map from food_name to food_id for quick lookup
    const foodNameToIdMap: Record<string, number> = {};
    foodItems.forEach((food) => {
      foodNameToIdMap[food.food_name] = food.food_id;
    });

    // Map of item name to map of store name to quantity and food_id
    const itemStoreMap: Record<string, { storeQuantities: Record<string, number>; food_id: number }> = {};

    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!itemStoreMap[item.food_name]) {
          itemStoreMap[item.food_name] = { storeQuantities: {}, food_id: foodNameToIdMap[item.food_name] || 0 };
        }
        if (!itemStoreMap[item.food_name].storeQuantities[order.branch_name]) {
          itemStoreMap[item.food_name].storeQuantities[order.branch_name] = 0;
        }
        itemStoreMap[item.food_name].storeQuantities[order.branch_name] += item.quantity;
      });
    });

    // Calculate total per item
    const items = Object.keys(itemStoreMap).map((itemName) => {
      const { storeQuantities, food_id } = itemStoreMap[itemName];
      const total = Object.values(storeQuantities).reduce((acc, val) => acc + val, 0);
      return { itemName, storeQuantities, total, food_id };
    });

    return { storeNames, items };
  }

  const { storeNames, items } = aggregateData(orders);

  return (
    <div className="flex max-w-7xl mx-auto min-h-screen p-8 space-x-8">
      <Navbar />
      <main className="flex-1 p-8 space-y-6">
        <h1 className="text-3xl font-bold mb-6">Recap of Orders</h1>

        <div className="mb-6">
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

        <div className="mb-6 flex space-x-4">
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
            onClick={() => {
              // Export to Excel function
              const exportData = () => {
                // Prepare data for worksheet
                const wsData = [];

                // Header row
                const headerRow = ["Food ID", "Item Name", "Total", ...storeNames];
                wsData.push(headerRow);

                // Data rows
                items.forEach(({ itemName, storeQuantities, total, food_id }) => {
                  const row = [
                    food_id,
                    itemName,
                    total,
                    ...storeNames.map((store) => storeQuantities[store] || 0),
                  ];
                  wsData.push(row);
                });

                // Create worksheet and workbook
                const ws = XLSX.utils.aoa_to_sheet(wsData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Recap");

                // Export to file
                XLSX.writeFile(wb, "recap_orders.xlsx");
              };

              exportData();
            }}
            className="bg-[#6D0000] text-white px-4 py-2 rounded transition transform hover:scale-105 hover:bg-[#7a0000] active:translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#6D0000]"
          >
            Export to Excel
          </button>
        </div>

        {loading ? (
          <p>Loading orders...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : !appliedDateRange.from || !appliedDateRange.to ? (
          // Hide table when date picker is not applied yet
          null
        ) : items.length === 0 ? (
          <p>No orders found for the selected period.</p>
        ) : (
          <div className="overflow-auto border border-gray-300 rounded">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-[#6D0000] text-white">
                  <th className="border border-gray-300 px-4 py-2 text-left">Food ID</th>
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
                {items.map(({ itemName, storeQuantities, total, food_id }) => (
                  <tr key={itemName} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">{food_id}</td>
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
