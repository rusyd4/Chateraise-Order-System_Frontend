"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import apiFetch from "../../../../lib/api";
import BranchNavbar from "../../../components/BranchNavbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table";
import { Button } from "../../../../components/ui/button";

interface OrderItem {
  food_name: string;
  quantity: number;
  price: number;
}

interface Order {
  order_id: number;
  delivery_date: string;
  order_date: string;
  order_status: string; // added order_status field
  items: OrderItem[];
}

interface OrderItem {
  food_name: string;
  quantity: number;
  price: number;
}

interface Order {
  order_id: number;
  delivery_date: string;
  order_date: string;
  order_status: string; // added order_status field
  items: OrderItem[];
}

export default function OrderDetailPage() {
  const params = useParams();
  const order_id = params?.order_id;
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [finishLoading, setFinishLoading] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);

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

  async function finishOrder() {
    if (!order_id) return;
    setFinishLoading(true);
    setFinishError(null);
    try {
      const response = await apiFetch(`/branch/orders/${order_id}/status/finished`, {
        method: "PUT",
      });
      if (response.msg === "Order status updated to Finished") {
        // Update order status in state
        setOrder((prev) => prev ? { ...prev, order_status: "Finished" } : prev);
        // Redirect to branch store page
        router.push("/branch/store");
      } else {
        setFinishError(response.msg || "Failed to finish order");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFinishError(err.message);
      } else {
        setFinishError("An unknown error occurred");
      }
    } finally {
      setFinishLoading(false);
    }
  }

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
            <p>
              <strong>Order Status:</strong> {order.order_status}
            </p>
            <h2 className="text-2xl font-semibold mt-6 mb-4">Items</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Food Name</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-center">Price</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-left">{item.food_name}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-center">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                      }).format(item.price)}
                    </TableCell>
                    <TableCell className="text-center">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                      }).format(item.price * item.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {order.order_status === "In-progress" && (
              <div className="mt-6">
                <Button onClick={finishOrder} disabled={finishLoading} variant="destructive">
                  {finishLoading ? "Finishing..." : "Finish Order"}
                </Button>
                {finishError && <p className="text-red-600 mt-2">{finishError}</p>}
              </div>
            )}
          </div>
        )}
        {!loading && !error && !order && <p>No order details found.</p>}
      </div>
    </>
  );
}
