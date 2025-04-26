"use client";
import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import apiFetch from "../../../lib/api";
import Navbar from "../Navbar";

interface Branch {
  user_id: number;
  full_name: string;
  email: string;
  branch_address?: string;
  delivery_time?: string;
  created_at: string;
}

export default function AdminBranch() {
  const router = useRouter();
  const pathname = usePathname();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formFullName, setFormFullName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formBranchAddress, setFormBranchAddress] = useState("");
  const [formDeliveryTime, setFormDeliveryTime] = useState("");

  const [editingBranchId, setEditingBranchId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchBranches();
  }, [router]);

  async function fetchBranches() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/admin/branches");
      setBranches(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormFullName("");
    setFormEmail("");
    setFormPassword("");
    setFormBranchAddress("");
    setFormDeliveryTime("");
    setEditingBranchId(null);
    setFormError("");
    setFormSuccess("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!formFullName || !formEmail || !formBranchAddress || (!editingBranchId && !formPassword)) {
      setFormError("Please fill in all required fields.");
      return;
    }

    if (editingBranchId) {
      // Update branch
      try {
        const body: any = {
          full_name: formFullName,
          email: formEmail,
          branch_address: formBranchAddress,
          delivery_time: formDeliveryTime,
        };
        if (formPassword) {
          // Hash password on backend, so send password as is
          body.password_hash = formPassword;
        } else {
          body.password_hash = null;
        }

        const updatedBranch = await apiFetch(`/admin/branches/${editingBranchId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        setBranches((prev) =>
          prev.map((b) => (b.user_id === editingBranchId ? { ...b, ...updatedBranch } : b))
        );
        setFormSuccess("Branch updated successfully.");
        resetForm();
      } catch (err: unknown) {
        if (err instanceof Error) {
          setFormError(err.message);
        } else {
          setFormError(String(err));
        }
      }
    } else {
      // Create new branch (register)
      try {
        await apiFetch("/auth/register", {
          method: "POST",
          body: JSON.stringify({
            full_name: formFullName,
            email: formEmail,
            password: formPassword,
            role: "branch_store",
            branch_address: formBranchAddress,
            delivery_time: formDeliveryTime,
          }),
        });
        setFormSuccess("Branch created successfully.");
        resetForm();
        fetchBranches();
      } catch (err: unknown) {
        if (err instanceof Error) {
          setFormError(err.message);
        } else {
          setFormError(String(err));
        }
      }
    }
  }

  function handleEdit(branch: Branch) {
    setEditingBranchId(branch.user_id);
    setFormFullName(branch.full_name);
    setFormEmail(branch.email);
    setFormPassword("");
    setFormBranchAddress(branch.branch_address || "");
    setFormDeliveryTime(branch.delivery_time || "");
    setFormError("");
    setFormSuccess("");
  }

  async function handleDelete(branchId: number) {
    if (!confirm("Are you sure you want to delete this branch?")) return;
    try {
      await apiFetch(`/admin/branches/${branchId}`, {
        method: "DELETE",
      });
      setBranches((prev) => prev.filter((b) => b.user_id !== branchId));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="flex max-w-7xl mx-auto min-h-screen p-8 space-x-8">
      <Navbar />
      <main className="flex-1 p-0 space-y-12">
        <section>
          <h2 className="text-3xl font-bold mb-4">Manage Branch Stores</h2>

          <form onSubmit={handleSubmit} className="mb-6 w-full space-y-4">
            <div className="grid gap-4 min-w-0" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="w-full min-w-0">
                <label htmlFor="branchName" className="block font-medium mb-1">
                  Branch Name<span className="text-red-600">*</span>
                </label>
                <input
                  id="branchName"
                  type="text"
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="Enter branch name"
                  className="w-full min-w-0 border border-[#6D0000] rounded px-3 py-2 transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#6D0000]"
                  required
                />
              </div>
              <div className="w-full min-w-0">
                <label htmlFor="email" className="block font-medium mb-1">
                  Email<span className="text-red-600">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full min-w-0 border border-[#6D0000] rounded px-3 py-2 transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#6D0000]"
                  required
                />
              </div>
              <div className="w-full min-w-0">
                <label htmlFor="password" className="block font-medium mb-1">
                  {editingBranchId ? "New Password (leave blank to keep current)" : "Password"}
                  {!editingBranchId && <span className="text-red-600">*</span>}
                </label>
                <input
                  id="password"
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={editingBranchId ? "Enter new password (optional)" : "Enter password"}
                  className="w-full min-w-0 border border-[#6D0000] rounded px-3 py-2 transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#6D0000]"
                  {...(!editingBranchId && { required: true })}
                />
              </div>
              <div className="w-full min-w-0">
                <label htmlFor="branchAddress" className="block font-medium mb-1">
                  Branch Address
                </label>
                <input
                  id="branchAddress"
                  type="text"
                  value={formBranchAddress}
                  onChange={(e) => setFormBranchAddress(e.target.value)}
                  placeholder="Enter branch address"
                  className="w-full min-w-0 border border-[#6D0000] rounded px-3 py-2 transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#6D0000]"
                />
              </div>
              <div className="w-full min-w-0">
                <label htmlFor="deliveryTime" className="block font-medium mb-1">
                  Delivery Time
                </label>
                <input
                  id="deliveryTime"
                  type="text"
                  value={formDeliveryTime}
                  onChange={(e) => setFormDeliveryTime(e.target.value)}
                  placeholder="Enter delivery time"
                  className="w-full min-w-0 border border-[#6D0000] rounded px-3 py-2 transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#6D0000]"
                />
              </div>
            </div>
            {formError && <p className="text-red-600">{formError}</p>}
            {formSuccess && <p className="text-green-600">{formSuccess}</p>}
            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-[#6D0000] text-white px-4 py-2 rounded transition transform hover:scale-105 hover:bg-[#7a0000]"
              >
                {editingBranchId ? "Update Branch" : "Add Branch"}
              </button>
              {editingBranchId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div>
            <h3 className="text-2xl font-semibold mb-4">Branch Stores List</h3>
            {loading ? (
              <p>Loading branches...</p>
            ) : error ? (
              <p className="text-red-600">{error}</p>
            ) : branches.length === 0 ? (
              <p>No branches found.</p>
            ) : (
              <table className="w-full border border-gray-300 rounded">
                <thead className="bg-[#6D0000] text-white">
                  <tr>
                    <th className="border border-[#6D0000] px-2 py-1 text-left">Branch Name</th>
                    <th className="border border-[#6D0000] px-2 py-1 text-left">Email</th>
                    <th className="border border-[#6D0000] px-2 py-1 text-left">Branch Address</th>
                    <th className="border border-[#6D0000] px-2 py-1 text-left">Delivery Time</th>
                    <th className="border border-[#6D0000] px-2 py-1 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map((branch) => (
                    <tr key={branch.user_id} className="odd:bg-white even:bg-gray-50">
                      <td className="border border-gray-300 px-2 py-1">{branch.full_name}</td>
                      <td className="border border-gray-300 px-2 py-1">{branch.email}</td>
                      <td className="border border-gray-300 px-2 py-1">{branch.branch_address || "N/A"}</td>
                      <td className="border border-gray-300 px-2 py-1">{branch.delivery_time || "N/A"}</td>
                      <td className="border border-gray-300 px-2 py-1 space-x-2">
                        <button
                          onClick={() => handleEdit(branch)}
                          className="bg-yellow-400 text-white px-2 py-1 rounded hover:bg-yellow-500 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(branch.user_id)}
                          className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}