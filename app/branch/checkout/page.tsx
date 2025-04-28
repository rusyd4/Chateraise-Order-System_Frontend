"use client";

import { useEffect, useState, useRef } from "react";
import apiFetch from "../../../lib/api";

interface CartItem {
  food_id: number;
  food_name: string;
  description?: string;
  price: number | string;
  quantity: number;
}

interface BranchProfile {
  full_name: string;
  branch_address?: string;
  email?: string;
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [branchProfile, setBranchProfile] = useState<BranchProfile | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }
    fetchBranchProfile();
  }, []);

  async function fetchBranchProfile() {
    try {
      const data = await apiFetch("/branch/profile");
      setBranchProfile(data);
    } catch (err: unknown) {
      console.error(err);
    }
  }

  function calculateTotal() {
    return cart.reduce((acc, item) => {
      const price = typeof item.price === "number" ? item.price : parseFloat(item.price);
      return acc + price * item.quantity;
    }, 0);
  }

  function formatRupiah(amount: number) {
    return (
      "Rp " +
      amount
        .toFixed(0)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    );
  }

  async function createOrder() {
    try {
      const date = new Date();
      date.setDate(date.getDate() + 2);
      const delivery_date = date.toISOString();
      const items = cart.map(({ food_id, quantity }) => ({ food_id, quantity }));
      const data = await apiFetch("/branch/orders", {
        method: "POST",
        body: JSON.stringify({ delivery_date, items }),
      });
      console.log("Order created:", data);
      setShowOrderDetails(true);
      // Optionally clear cart or show success message here
    } catch (err: unknown) {
      console.error(err);
      alert("Failed to create order. Please try again.");
    }
  }

function handleConfirmOrder() {
  if (window.confirm("Are you sure you want to confirm the order?")) {
    createOrder();
  }
}

  function handlePrint() {
    if (printRef.current) {
      window.print();
    }
  }

  if (cart.length === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Checkout</h1>
        <p>Your cart is empty.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {!showOrderDetails ? (
        <>
          <h1 className="text-3xl font-bold mb-6">Checkout</h1>
          <ul className="mb-6">
            {cart.map((item) => (
              <li key={item.food_id} className="mb-2 flex justify-between">
                <span>
                  {item.food_name} x {item.quantity}
                </span>
                <span>
                  {typeof item.price === "number"
                    ? formatRupiah(item.price * item.quantity)
                    : formatRupiah(parseFloat(item.price) * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mb-6 font-semibold">
            Total: {formatRupiah(calculateTotal())}
          </p>
          <button
            onClick={handleConfirmOrder}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
          >
            Confirm Order
          </button>
          <button
            onClick={() => {
              // Return to store with cart saved
              localStorage.setItem("cart", JSON.stringify(cart));
              window.location.href = "/branch/store";
            }}
            className="ml-4 bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition"
          >
            Return to Store
          </button>
        </>
      ) : (
        <div ref={printRef} className="bg-white p-6 border border-gray-300 rounded shadow">
          <h1 className="text-3xl font-bold mb-4">Order Details</h1>
          <p>
            <strong>Branch Name:</strong> {branchProfile?.full_name || "N/A"}
          </p>
          <p>
            <strong>Address:</strong> {branchProfile?.branch_address || "N/A"}
          </p>
          <p>
            <strong>Date:</strong> {new Date().toLocaleDateString()}
          </p>
          <h2 className="text-xl font-semibold mt-4 mb-2">Order Items</h2>
          <ul className="mb-4">
            {cart.map((item) => (
              <li key={item.food_id} className="flex justify-between mb-1">
                <span>
                  {item.food_name} x {item.quantity}
                </span>
                <span>
                  {typeof item.price === "number"
                    ? formatRupiah(item.price * item.quantity)
                    : formatRupiah(parseFloat(item.price) * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <p className="font-semibold">
            Total Price: {formatRupiah(calculateTotal())}
          </p>
          <button
            onClick={handlePrint}
            className="mt-6 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
          >
            Print / Save as PDF
          </button>
          <button
            onClick={() => {
              // Return to store with cart reset
              localStorage.removeItem("cart");
              window.location.href = "/branch/store";
            }}
            className="ml-4 mt-6 bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition"
          >
            Return to Store
          </button>
        </div>
      )}
    </div>
  );
}
