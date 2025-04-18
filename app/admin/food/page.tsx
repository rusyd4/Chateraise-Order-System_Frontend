"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface FoodItem {
  food_id: number;
  food_name: string;
  description: string;
  price: number;
  is_available: boolean;
}

export default function ManageFoodItems() {
  const pathname = usePathname();

  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loadingFood, setLoadingFood] = useState(false);
  const [errorFood, setErrorFood] = useState("");

  const [foodForm, setFoodForm] = useState({
    food_name: "",
    description: "",
    price: "",
    is_available: true,
    editingId: null as number | null,
  });

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    fetchFoodItems();
  }, []);

  async function fetchFoodItems() {
    setLoadingFood(true);
    setErrorFood("");
    try {
      const res = await fetch("http://localhost:5000/admin/food-items", {
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
        setErrorFood(err.message);
      } else {
        setErrorFood(String(err));
      }
    } finally {
      setLoadingFood(false);
    }
  }

  function handleFoodFormChange(e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    let val: string | boolean = value;
    if (type === "checkbox" && e.target instanceof HTMLInputElement) {
      val = e.target.checked;
    }
    setFoodForm((prev) => ({
      ...prev,
      [name]: val,
    }));
  }

  async function handleFoodFormSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const { food_name, description, price, is_available, editingId } = foodForm;
    if (!food_name || !description || !price) {
      alert("Please fill all food item fields");
      return;
    }
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `http://localhost:5000/admin/food-items/${editingId}`
        : "http://localhost:5000/admin/food-items";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          food_name,
          description,
          price: parseFloat(price),
          is_available,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to save food item");
      }
      setFoodForm({
        food_name: "",
        description: "",
        price: "",
        is_available: true,
        editingId: null,
      });
      fetchFoodItems();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert(String(err));
      }
    }
  }

  function handleEditFood(item: FoodItem) {
    setFoodForm({
      food_name: item.food_name,
      description: item.description,
      price: item.price.toString(),
      is_available: item.is_available,
      editingId: item.food_id,
    });
  }

  async function handleDeleteFood(food_id: number) {
    if (!confirm("Are you sure you want to delete this food item?")) return;
    try {
      const res = await fetch(`http://localhost:5000/admin/food-items/${food_id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to delete food item");
      }
      fetchFoodItems();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert(String(err));
      }
    }
  }

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
      <main className="flex-1 p-0 space-y-12">
        <h2 className="text-3xl font-bold mb-4">Manage Food Items</h2>
        <form onSubmit={handleFoodFormSubmit} className="mb-6 space-y-4 max-w-md">
          <div>
            <label htmlFor="food_name" className="block font-medium mb-1">
              Food Name
            </label>
            <input
              type="text"
              id="food_name"
              name="food_name"
              value={foodForm.food_name}
              onChange={handleFoodFormChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block font-medium mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={foodForm.description}
              onChange={handleFoodFormChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label htmlFor="price" className="block font-medium mb-1">
              Price
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={foodForm.price}
              onChange={handleFoodFormChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              step="0.01"
              min="0"
              required
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_available"
              name="is_available"
              checked={foodForm.is_available}
              onChange={handleFoodFormChange}
            />
            <label htmlFor="is_available">Available</label>
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            {foodForm.editingId ? "Update Food Item" : "Add Food Item"}
          </button>
          {foodForm.editingId && (
            <button
              type="button"
              onClick={() =>
                setFoodForm({
                  food_name: "",
                  description: "",
                  price: "",
                  is_available: true,
                  editingId: null,
                })
              }
              className="ml-4 bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
            >
              Cancel
            </button>
          )}
        </form>
        <table className="w-full border border-gray-300 rounded">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 p-2">Food Name</th>
              <th className="border border-gray-300 p-2">Description</th>
              <th className="border border-gray-300 p-2">Price</th>
              <th className="border border-gray-300 p-2">Available</th>
              <th className="border border-gray-300 p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {foodItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-4">
                  No food items found.
                </td>
              </tr>
            ) : (
              foodItems.map((item, index) => (
                <tr key={item.food_id || index}>
                  <td className="border border-gray-300 p-2">{item.food_name}</td>
                  <td className="border border-gray-300 p-2">{item.description}</td>
                  <td className="border border-gray-300 p-2">{item.price}</td>
                  <td className="border border-gray-300 p-2">
                    {item.is_available ? "Yes" : "No"}
                  </td>
                  <td className="border border-gray-300 p-2 space-x-2">
                    <button
                      onClick={() => handleEditFood(item)}
                      className="bg-yellow-400 px-2 py-1 rounded hover:bg-yellow-500"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteFood(item.food_id)}
                      className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </main>
    </div>
  );
