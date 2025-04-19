"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface FoodItem {
  food_id: number;
  food_name: string;
  description: string;
  price: number;
  image_url?: string;
}

interface CartItem extends FoodItem {
  quantity: number;
}

export default function BranchStore() {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    fetchFoodItems();
  }, []);

  async function fetchFoodItems() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:5000/branch/food-items", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch food items");
      }
      const data = await res.json();
      setFoodItems(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error");
      }
    } finally {
      setLoading(false);
    }
  }

  function addToCart(food: FoodItem) {
    setCart((prev) => {
      const existing = prev.find((item) => item.food_id === food.food_id);
      if (existing) {
        return prev.map((item) =>
          item.food_id === food.food_id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prev, { ...food, quantity: 1 }];
      }
    });
  }

  function handleCheckout() {
    // Save cart to localStorage or context for checkout page
    localStorage.setItem("cart", JSON.stringify(cart));
    router.push("/branch/checkout");
  }

  function goToOrderHistory() {
    router.push("/branch/order_history");
  }

  return (
    <div>
      <nav className="bg-gray-800 text-white p-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="text-xl font-bold cursor-pointer" onClick={() => router.push("/")}>
          Logo
        </div>
        <div className="space-x-4">
          <button
            className="hover:underline"
            onClick={() => router.push("/branch/store")}
          >
            Store
          </button>
          <button
            className="hover:underline"
            onClick={goToOrderHistory}
          >
            Order History
          </button>
        </div>
      </nav>
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Store</h1>
        {loading ? (
          <p>Loading food items...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {foodItems.map((food) => (
              <div
                key={food.food_id}
                className="border border-gray-300 rounded p-4 flex flex-col items-center"
              >
                {food.image_url ? (
                  <img
                    src={food.image_url}
                    alt={food.food_name}
                    className="w-full h-40 object-cover mb-4 rounded"
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-200 mb-4 rounded flex items-center justify-center text-gray-500">
                    No Image
                  </div>
                )}
                <h2 className="text-lg font-semibold mb-2">{food.food_name}</h2>
                <p className="mb-4">${food.price}</p>
                <button
                  onClick={() => addToCart(food)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                  +
                </button>
              </div>
            ))}
          </div>
        )}
        {cart.length > 0 && (
          <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded p-4 shadow-lg">
            <p className="mb-2 font-semibold">Cart Items: {cart.reduce((acc, item) => acc + item.quantity, 0)}</p>
            <button
              onClick={handleCheckout}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
