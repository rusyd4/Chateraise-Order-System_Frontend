"use client";

import React,{ useEffect, useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import apiFetch from "../../../lib/api";
import Image from "next/image";

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

  const [foodForm, setFoodForm] = useState({
    food_id: "",
    food_name: "",
    description: "",
    price: "",
    is_available: true,
    editingId: null as number | null,
  });

  const fetchFoodItems = React.useCallback(async () => {
    try {
      const data = await apiFetch("/admin/food-items");
      setFoodItems(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert(String(err));
      }
    }
  }, []);

  useEffect(() => {
    fetchFoodItems();
  }, [fetchFoodItems]);

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
    const { food_id, food_name, description, price, is_available, editingId } = foodForm;
    if (!food_id || !food_name || !description || !price) {
      alert("Please fill all food item fields");
      return;
    }
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/admin/food-items/${editingId}` : "/admin/food-items";
      await apiFetch(url, {
        method,
        body: JSON.stringify({
          food_id: parseInt(food_id, 10),
          food_name,
          description,
          price: parseFloat(price),
          is_available,
        }),
      });
      setFoodForm({
        food_id: "",
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
      food_id: item.food_id.toString(),
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
      await apiFetch(`/admin/food-items/${food_id}`, {
        method: "DELETE",
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

  return (
    <div className="flex max-w-7xl mx-auto min-h-screen p-8 space-x-8">
      <nav className="w-48 flex flex-col space-y-4 border-r border-gray-300 pr-4">
        <div className="mb-4">
          <Image
            src="/Chateraiselogo.png"
            alt="Chateraise Logo"
            width={200}
            height={70}
            priority
          />
        </div>
        <Link
          href="/admin/dashboard"
          className={`px-3 py-2 rounded transition transform ${
            pathname === "/admin/dashboard"
              ? "bg-[#6D0000] text-white"
              : "hover:bg-[#7a0000] hover:text-white hover:scale-105"
          }`}
        >
          Orders
        </Link>
        <Link
          href="/admin/food"
          className={`px-3 py-2 rounded transition transform ${
            pathname === "/admin/food"
              ? "bg-[#6D0000] text-white"
              : "hover:bg-[#7a0000] hover:text-white hover:scale-105"
          }`}
        >
          Manage Products
        </Link>
        <Link
          href="/admin/branch"
          className={`px-3 py-2 rounded transition transform ${
            pathname === "/admin/branch"
              ? "bg-[#6D0000] text-white"
              : "hover:bg-[#7a0000] hover:text-white hover:scale-105"
          }`}
        >
          Manage Branch Stores
        </Link>
        <Link
          href="/admin/recap"
          className={`px-3 py-2 rounded transition transform ${
            pathname === "/admin/recap"
              ? "bg-[#6D0000] text-white"
              : "hover:bg-[#7a0000] hover:text-white hover:scale-105"
          }`}
        >
          Recap
        </Link>
      </nav>
      <main className="flex-1 p-0 space-y-12">
        <h2 className="text-3xl font-bold mb-4">Manage Food Items</h2>
        <form onSubmit={handleFoodFormSubmit} className="mb-6 space-y-4 max-w-md">
          <div>
            <label htmlFor="food_id" className="block font-medium mb-1">
              Food ID
            </label>
            <input
              type="number"
              id="food_id"
              name="food_id"
              placeholder="Enter Food ID"
              value={foodForm.food_id}
              onChange={handleFoodFormChange}
              className="w-full border border-[#6D0000] rounded px-3 py-2 transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#6D0000]"
              required
            />
          </div>
          <div>
            <label htmlFor="food_name" className="block font-medium mb-1">
              Product Name
            </label>
            <input
              type="text"
              id="food_name"
              name="food_name"
              placeholder="Enter Product Name"
              value={foodForm.food_name}
              onChange={handleFoodFormChange}
              className="w-full border border-[#6D0000] rounded px-3 py-2 transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#6D0000]"
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
              placeholder="Add a Description"
              value={foodForm.description}
              onChange={handleFoodFormChange}
              className="w-full border border-[#6D0000] rounded px-3 py-2 transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#6D0000]"
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
              placeholder="Enter The Price (Rp)"
              value={foodForm.price}
              onChange={handleFoodFormChange}
              className="w-full border border-[#6D0000] rounded px-3 py-2 transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#6D0000]"
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
              className="accent-[#6D0000] transition transform hover:scale-110 active:translate-y-0.5 cursor-pointer"
            />
            <label htmlFor="is_available" className="text-[#6D0000] font-semibold">Available</label>
          </div>
          <button
            type="submit"
            className="bg-[#6D0000] text-white px-4 py-2 rounded transition transform hover:scale-105 hover:bg-[#7a0000] active:translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#6D0000]"
          >
            {foodForm.editingId ? "Update Food Item" : "Add Food Item"}
          </button>
          {foodForm.editingId && (
            <button
              type="button"
              onClick={() =>
                setFoodForm({
                  food_id: "",
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
          <thead className="bg-[#6D0000] text-white">
            <tr>
              <th className="border border-[#6D0000] p-2">Food ID</th>
              <th className="border border-[#6D0000] p-2">Food Name</th>
              <th className="border border-[#6D0000] p-2">Description</th>
              <th className="border border-[#6D0000] p-2">Price</th>
              <th className="border border-[#6D0000] p-2">Available</th>
              <th className="border border-[#6D0000] p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {foodItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-4">
                  No food items found.
                </td>
              </tr>
            ) : (
              foodItems.map((item, index) => (
                <tr key={item.food_id || index}>
                  <td className="border border-gray-300 p-2">{item.food_id}</td>
                  <td className="border border-gray-300 p-2">{item.food_name}</td>
                  <td className="border border-gray-300 p-2">{item.description}</td>
                  <td className="border border-gray-300 p-2">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.price)}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {item.is_available ? "Yes" : "No"}
                  </td>
                  <td className="border border-gray-300 p-2 space-x-2">
                    <button
                      onClick={() => handleEditFood(item)}
                      className="bg-yellow-400 px-2 py-1 rounded transition transform hover:bg-yellow-500 hover:scale-105 active:translate-y-0.5"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteFood(item.food_id)}
                      className="bg-red-600 text-white px-2 py-1 rounded transition transform hover:bg-red-700 hover:scale-105 active:translate-y-0.5"
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
}
