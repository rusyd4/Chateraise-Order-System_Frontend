"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiFetch from "../../../lib/api";

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
  const [monthFilter, setMonthFilter] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (monthFilter) {
      const filtered = orders.filter((order) => {
        const orderMonth = new Date(order.order_date).toISOString().slice(0, 7);
        return orderMonth === monthFilter;
      });
      setFilteredOrders(filtered);
    } else {
      setFilteredOrders(orders);
    }
  }, [monthFilter, orders]);

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

  function handleMonthChange(e: React.ChangeEvent<HTMLInputElement>) {
    setMonthFilter(e.target.value);
  }

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

  return (
    <>
      <nav className="bg-gray-800 text-white p-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="text-xl font-bold cursor-pointer" onClick={() => router.push("/")}>
          Logo
        </div>
        <div className="space-x-4">
          <button className="hover:underline" onClick={() => router.push("/branch/store")}>
            Store
          </button>
          <button className="hover:underline" onClick={goToOrderHistory}>
            Order History
          </button>
        </div>
      </nav>
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Order History</h1>
        <div className="mb-4">
          <label htmlFor="monthFilter" className="mr-2 font-semibold">
            Filter by month:
          </label>
          <input
            type="month"
            id="monthFilter"
            value={monthFilter}
            onChange={handleMonthChange}
            className="border border-gray-300 rounded px-2 py-1"
          />
        </div>
        {loading && <p>Loading orders...</p>}
        {error && <p className="text-red-600">Error: {error}</p>}
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 text-center">
            <thead>
              <tr>
                <th colSpan={3}></th>
                <th colSpan={uniqueDates.length} className="border border-gray-300 px-4 py-2 font-semibold">
                  Order Date
                </th>
              </tr>
              <tr>
                <th colSpan={3}></th>
                {uniqueDates.map((date) => (
                  <th key={date} className="border border-gray-300 px-4 py-2">
                    {new Date(date).toLocaleDateString(undefined, { day: "2-digit", month: "short" })}
                  </th>
                ))}
              </tr>
              <tr>
                <th colSpan={3}></th>
                <th colSpan={uniqueDates.length} className="border border-gray-300 px-4 py-2 font-semibold">
                  Delivery Date
                </th>
              </tr>
              <tr>
                <th className="border border-gray-300 px-4 py-2 font-semibold">Food Items</th>
                <th className="border border-gray-300 px-4 py-2 font-semibold">Price</th>
                <th className="border border-gray-300 px-4 py-2 font-semibold">Total Quantity</th>
                {uniqueDates.map((date) => {
                  const orderDate = new Date(date);
                  orderDate.setDate(orderDate.getDate() + 2);
                  return (
                    <th key={"qty-" + date} className="border border-gray-300 px-4 py-2 font-semibold">
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
                  <tr key={food.food_name} className="border-t border-gray-300">
                    <td className="border border-gray-300 px-4 py-2 text-left">{food.food_name}</td>
                    <td className="border border-gray-300 px-4 py-2">${food.price.toFixed(2)}</td>
                    <td className="border border-gray-300 px-4 py-2">{food.totalQty}</td>
                    {uniqueDates.map((date) => (
                      <td key={date} className="border border-gray-300 px-4 py-2">
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
