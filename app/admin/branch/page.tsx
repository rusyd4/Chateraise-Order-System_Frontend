"use client";
import React, { useEffect, useState } from "react";
import apiFetch from "../../../lib/api";

interface Branch {
  user_id: number;
  full_name: string;
  email: string;
  branch_address?: string;
  created_at: string;
}

export default function AdminBranch() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formFullName, setFormFullName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formBranchAddress, setFormBranchAddress] = useState("");

  const [editingBranchId, setEditingBranchId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  useEffect(() => {
    fetchBranches();
  }, []);

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
      <nav className="w-48 flex flex-col space-y-4 border-r border-gray-300 pr-4">
        <a
          href="/admin/dashboard"
          className="px-3 py-2 rounded hover:bg-gray-200"
        >
          Orders
        </a>
        <a
          href="/admin/food"
          className="px-3 py-2 rounded hover:bg-gray-200"
        >
          Manage Food Items
        </a>
        <a
          href="/admin/branch"
          className="px-3 py-2 rounded bg-blue-600 text-white"
        >
          Manage Branch Stores
        </a>
        <a
          href="/admin/recap"
          className="px-3 py-2 rounded hover:bg-gray-200"
        >
          Recap
        </a>
      </nav>
      <main className="flex-1">
        <section>
          <h2 className="text-3xl font-bold mb-4">Manage Branch Stores</h2>

          <form onSubmit={handleSubmit} className="mb-6 max-w-md space-y-4">
            <div>
              <label htmlFor="fullName" className="block font-medium mb-1">
                Full Name<span className="text-red-600">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                value={formFullName}
                onChange={(e) => setFormFullName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block font-medium mb-1">
                Email<span className="text-red-600">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block font-medium mb-1">
                {editingBranchId ? "New Password (leave blank to keep current)" : "Password"}
                {!editingBranchId && <span className="text-red-600">*</span>}
              </label>
              <input
                id="password"
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                {...(!editingBranchId && { required: true })}
              />
            </div>
            <div>
              <label htmlFor="branchAddress" className="block font-medium mb-1">
                Branch Address
              </label>
              <input
                id="branchAddress"
                type="text"
                value={formBranchAddress}
                onChange={(e) => setFormBranchAddress(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            {formError && <p className="text-red-600">{formError}</p>}
            {formSuccess && <p className="text-green-600">{formSuccess}</p>}
            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
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
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-1 text-left">Full Name</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Email</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Branch Address</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Created At</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map((branch) => (
                    <tr key={branch.user_id} className="odd:bg-white even:bg-gray-50">
                      <td className="border border-gray-300 px-2 py-1">{branch.full_name}</td>
                      <td className="border border-gray-300 px-2 py-1">{branch.email}</td>
                      <td className="border border-gray-300 px-2 py-1">{branch.branch_address || "N/A"}</td>
                      <td className="border border-gray-300 px-2 py-1">{new Date(branch.created_at).toLocaleString()}</td>
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
