
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import apiFetch from "../../../lib/api";
import BranchNavbar from "../../components/BranchNavbar";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [inputValue, setInputValue] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  const [orderHistoryHover, setOrderHistoryHover] = useState(false);

  function formatRupiah(price: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(price);
  }

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
      <BranchNavbar />
      <div className="flex-grow flex justify-center mx-4">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search"
            className={`w-full rounded-full border border-gray-300 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-[#6D0000] focus:border-transparent transition-colors duration-200 ${
              searchTerm ? "bg-white text-[#6D0000]" : "hover:bg-white hover:text-[#6D0000]"
            }`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none group-hover:text-[#6D0000]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-[#6D0000] transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 13.65z" />
            </svg>
          </div>
        </div>
      </div>
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Store</h1>
        {loading ? (
          <p>Loading food items...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <div className="grid grid-cols-6 gap-6">
            {foodItems
              .filter((food) => {
                const name = food.food_name.toLowerCase();
                const term = searchTerm.toLowerCase();
                // Simple fuzzy search: check if all characters in term appear in order in name
                let ti = 0;
                for (let ni = 0; ni < name.length && ti < term.length; ni++) {
                  if (name[ni] === term[ti]) {
                    ti++;
                  }
                }
                return ti === term.length;
              })
              .map((food) => (
                <div key={food.food_id} className="flex flex-col items-center">
                  <div
                    className="border border-gray-300 rounded-lg p-6 flex flex-col justify-center aspect-square w-full shadow-md transition-transform duration-200 hover:scale-105 hover:shadow-lg cursor-pointer"
                  >
                    <h2 className="text-lg font-semibold mb-2 text-center">{food.food_name}</h2>
                  </div>
                  <div className="flex flex-col items-center mt-2 justify-center w-full space-y-2">
                    <p className="text-gray-700 mx-auto">{formatRupiah(food.price)}</p>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => removeFromCart(food)}
                        className="bg-[#6D0000] text-white px-3 py-1 rounded hover:bg-[#7a0000] focus:outline-none focus:ring-2 focus:ring-[#7a0000] transition-transform duration-200 transform hover:scale-105 active:translate-y-0.5"
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
                        className="bg-[#6D0000] text-white px-3 py-1 rounded hover:bg-[#7a0000] focus:outline-none focus:ring-2 focus:ring-[#7a0000] transition-transform duration-200 transform hover:scale-105 active:translate-y-0.5"
                        aria-label={`Add one ${food.food_name}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
        {cart.length > 0 && (
          <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded p-4 shadow-lg">
            <div className="mb-2 font-semibold flex items-center justify-center space-x-2 w-max mx-auto">
              <img src="/Shopping_Cart_01.svg" alt="Cart Items" className="h-6 w-6" />
              <span>{cart.reduce((acc, item) => acc + item.quantity, 0)}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="bg-[#6D0000] text-white px-4 py-2 rounded hover:bg-[#7a0000] focus:outline-none focus:ring-2 focus:ring-[#7a0000] transition-transform duration-200 transform hover:scale-105 active:translate-y-0.5"
            >
              Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
