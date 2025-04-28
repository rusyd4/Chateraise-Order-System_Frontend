"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import apiFetch from "../../../../lib/api";
import BranchNavbar from "../../../../components/BranchNavbar";

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

export default function OrderDetailPage() {
  const params = useParams();
  const order_id = params?.order_id;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!order_id) return;

    async function fetchOrder() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch(`/branch/orders/${order_id}`);
        setOrder(data);
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

    fetchOrder();
  }, [order_id]);

  return (
    <>
      <BranchNavbar />
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Order Details</h1>
        {loading && <p>Loading order details...</p>}
        {error && <p className="text-red-600">Error: {error}</p>}
        {!loading && !error && order && (
          <div>
            <p>
              <strong>Order ID:</strong> {order.order_id}
            </p>
            <p>
              <strong>Order Date:</strong>{" "}
              {new Date(order.order_date).toLocaleString()}
            </p>
            <p>
              <strong>Delivery Date:</strong>{" "}
              {new Date(order.delivery_date).toLocaleString()}
            </p>
            <h2 className="text-2xl font-semibold mt-6 mb-4">Items</h2>
            <table className="min-w-full border border-black text-center rounded-lg overflow-hidden">
              <thead className="bg-[#6D0000] text-white">
                <tr>
                  <th className="border border-white px-4 py-2">Food Name</th>
                  <th className="border border-white px-4 py-2">Quantity</th>
                  <th className="border border-white px-4 py-2">Price</th>
                  <th className="border border-white px-4 py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr
                    key={index}
                    className="border-t border-[#6D0000] hover:bg-[#f9e6e6] transition-colors duration-200"
                  >
                    <td className="border border-[#6D0000] px-4 py-2 text-left">
                      {item.food_name}
                    </td>
                    <td className="border border-[#6D0000] px-4 py-2">
                      {item.quantity}
                    </td>
                    <td className="border border-[#6D0000] px-4 py-2">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                      }).format(item.price)}
                    </td>
                    <td className="border border-[#6D0000] px-4 py-2">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                      }).format(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && !order && <p>No order details found.</p>}
      </div>
    </>
  );
}
