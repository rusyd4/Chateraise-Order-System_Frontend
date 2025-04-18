"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";

interface Branch {
  branch_id: number;
  full_name: string;
  email: string;
}

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ManageBranchStores() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [errorBranches, setErrorBranches] = useState("");

  const [branchForm, setBranchForm] = useState({
    full_name: "",
    email: "",
    editingId: null as number | null,
  });

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const pathname = usePathname();

  useEffect(() => {
    fetchBranches();
  }, []);

  async function fetchBranches() {
    setLoadingBranches(true);
    setErrorBranches("");
    try {
      const res = await fetch("http://localhost:5000/admin/branches", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch branches");
      }
      const data = await res.json();
      setBranches(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorBranches(err.message);
      } else {
        setErrorBranches(String(err));
      }
    } finally {
      setLoadingBranches(false);
    }
  }

  function handleBranchFormChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setBranchForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleBranchFormSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const { full_name, email, editingId } = branchForm;
    if (!full_name || !email) {
      alert("Please fill all branch store fields");
      return;
    }
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `http://localhost:5000/admin/branches/${editingId}`
        : "http://localhost:5000/admin/branches";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name,
          email,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to save branch store");
      }
      setBranchForm({
        full_name: "",
        email: "",
        editingId: null,
      });
      fetchBranches();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert(String(err));
      }
    }
  }

  function handleEditBranch(branch: Branch) {
    setBranchForm({
      full_name: branch.full_name,
      email: branch.email,
      editingId: branch.branch_id,
    });
  }

  async function handleDeleteBranch(branch_id: number) {
    if (!confirm("Are you sure you want to delete this branch store?")) return;
    try {
      const res = await fetch(`http://localhost:5000/admin/branches/${branch_id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to delete branch store");
      }
      fetchBranches();
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
      <main className="flex-1 p-8 space-y-12">
        <h2 className="text-3xl font-bold mb-4">Manage Branch Stores</h2>
        <form onSubmit={handleBranchFormSubmit} className="mb-6 space-y-4 max-w-md">
          <div>
            <label htmlFor="full_name" className="block font-medium mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={branchForm.full_name}
              onChange={handleBranchFormChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={branchForm.email}
              onChange={handleBranchFormChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            {branchForm.editingId ? "Update Branch Store" : "Add Branch Store"}
          </button>
          {branchForm.editingId && (
            <button
              type="button"
              onClick={() =>
                setBranchForm({
                  full_name: "",
                  email: "",
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
              <th className="border border-gray-300 p-2">Full Name</th>
              <th className="border border-gray-300 p-2">Email</th>
              <th className="border border-gray-300 p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {branches.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center p-4">
                  No branch stores found.
                </td>
              </tr>
            ) : (
              branches.map((branch, index) => (
                <tr key={branch.branch_id || index}>
                  <td className="border border-gray-300 p-2">{branch.full_name}</td>
                  <td className="border border-gray-300 p-2">{branch.email}</td>
                  <td className="border border-gray-300 p-2 space-x-2">
                    <button
                      onClick={() => handleEditBranch(branch)}
                      className="bg-yellow-400 px-2 py-1 rounded hover:bg-yellow-500"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBranch(branch.branch_id)}
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
}
