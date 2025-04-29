"use client";

import React,{ useEffect, useState, ChangeEvent, FormEvent } from "react";
import { usePathname } from "next/navigation";
import apiFetch from "../../../lib/api";
import Navbar from "../../components/AdminNavbar";
import { Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "../../../components/ui/dialog";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "../../../components/ui/alert-dialog";

import { toast } from "sonner"

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

  const [isModalOpen, setIsModalOpen] = useState(false);

  // New state for alert dialog
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [foodIdToDelete, setFoodIdToDelete] = useState<number | null>(null);

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
      setIsModalOpen(false);
      fetchFoodItems();
      toast.success(foodForm.editingId ? "Food item updated successfully" : "Food item added successfully");
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
    setIsModalOpen(true);
  }

  function handleAddFood() {
    setFoodForm({
      food_id: "",
      food_name: "",
      description: "",
      price: "",
      is_available: true,
      editingId: null,
    });
    setIsModalOpen(true);
  }

  // Updated delete handler to open alert dialog
  function handleDeleteFood(food_id: number) {
    setFoodIdToDelete(food_id);
    setIsAlertOpen(true);
  }

  // Confirm delete function called on alert dialog confirm
  async function confirmDeleteFood() {
    if (foodIdToDelete === null) return;
    try {
      await apiFetch(`/admin/food-items/${foodIdToDelete}`, {
        method: "DELETE",
      });
      fetchFoodItems();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert(String(err));
      }
    } finally {
      setIsAlertOpen(false);
      setFoodIdToDelete(null);
    }
    toast.success("Food item deleted successfully");
  }

  function closeModal() {
    setIsModalOpen(false);
    setFoodForm({
      food_id: "",
      food_name: "",
      description: "",
      price: "",
      is_available: true,
      editingId: null,
    });
  }

  return (
    <div className="flex max-w-7xl mx-auto min-h-screen p-8 space-x-8">
      <Navbar />
      <main className="flex-1 p-0 space-y-12">
        <h2 className="text-3xl font-bold mb-4">Manage Products</h2>
        <button
          onClick={handleAddFood}
          className="mb-6 bg-[#6D0000] text-white px-4 py-2 rounded transition transform hover:scale-105 hover:bg-[#7a0000] active:translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#6D0000]"
        >
          + New Product
        </button>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-md w-full p-6">
            <form onSubmit={handleFoodFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="food_id" className="block font-medium mb-1">
                  Product ID
                </label>
                <input
                  type="text"
                  id="food_id"
                  name="food_id"
                  placeholder="Ex: A5000001"
                  value={foodForm.food_id}
                  onChange={handleFoodFormChange}
                  className="no-spinner w-full border border-[#6D0000] rounded px-3 py-2 transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#6D0000]"
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
                  placeholder="Ex: Coffee Jelly"
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
                  type="text"
                  id="price"
                  name="price"
                  placeholder="Ex: 12000"
                  value={foodForm.price}
                  onChange={handleFoodFormChange}
                  className="no-spinner w-full border border-[#6D0000] rounded px-3 py-2 transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#6D0000]"
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
                {foodForm.editingId ? "Update Food Item" : "Add Product"}
              </button>
              {/*
              {foodForm.editingId && (
                <button
                  type="button"
                  onClick={closeModal}
                  className="ml-4 bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
                >
                  Cancel
                </button>
              )}
              */}
            </form>
          </DialogContent>
        </Dialog>

        {/* Alert Dialog for delete confirmation */}
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this food item? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteFood}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <table className="w-full border border-gray-300 rounded">
          <thead className="bg-[#6D0000] text-white">
            <tr>
            <th className="border border-[#6D0000] p-2 text-left">Product ID</th>
            <th className="border border-[#6D0000] p-2 text-left">Product Name</th>
              <th className="border border-[#6D0000] p-2 text-left">Description</th>
              <th className="border border-[#6D0000] p-2 text-left">Price</th>
              <th className="border border-[#6D0000] p-2 text-left">Available</th>
              <th className="border border-[#6D0000] p-2 text-left">Actions</th>
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
                      className="bg-yellow-400 p-1 rounded transition transform hover:bg-yellow-500 hover:scale-105 active:translate-y-0.5"
                      aria-label="Edit food item"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteFood(item.food_id)}
                      className="bg-red-600 text-white p-1 rounded transition transform hover:bg-red-700 hover:scale-105 active:translate-y-0.5"
                      aria-label="Delete food item"
                      title="Delete"
                    >
                      <Trash2 size={16} />
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
