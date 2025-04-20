"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiFetch from "../../../lib/api";

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

  useEffect(() => {
    fetchFoodItems();
  }, []);

  async function fetchFoodItems() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/branch/food-items");
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

  function removeFromCart(food: FoodItem) {
    setCart((prev) => {
      const existing = prev.find((item) => item.food_id === food.food_id);
      if (existing) {
        if (existing.quantity === 1) {
          return prev.filter((item) => item.food_id !== food.food_id);
        } else {
          return prev.map((item) =>
            item.food_id === food.food_id ? { ...item, quantity: item.quantity - 1 } : item
          );
        }
      }
      return prev;
    });
  }

  function getQuantity(food_id: number) {
    const item = cart.find((item) => item.food_id === food_id);
    return item ? item.quantity : 0;
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
          <div className="flex flex-col space-y-4">
            {foodItems.map((food) => (
              <div
                key={food.food_id}
                className="border border-gray-300 rounded p-4 flex items-center justify-between"
              >
                <div className="flex flex-col">
                  <h2 className="text-lg font-semibold">{food.food_name}</h2>
                  <p className="text-gray-700">${food.price}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => removeFromCart(food)}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                    aria-label={`Remove one ${food.food_name}`}
                  >
                    -
                  </button>
                  <input
                    type="text"
                    readOnly
                    value={getQuantity(food.food_id)}
                    className="w-12 text-center border border-gray-300 rounded"
                    aria-label={`Quantity of ${food.food_name}`}
                  />
                  <button
                    onClick={() => addToCart(food)}
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
                    aria-label={`Add one ${food.food_name}`}
                  >
                    +
                  </button>
                </div>
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
