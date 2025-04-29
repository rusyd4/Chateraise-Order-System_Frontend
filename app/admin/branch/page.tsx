"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiFetch from "../../../lib/api";
import AdminNavbar from "../../components/AdminNavbar";
import { 
  Edit, 
  Trash2, 
  Plus, 
  Store, 
  AlertCircle, 
  Search, 
  RotateCcw, 
  Mail, 
  Clock, 
  MapPin,
  User,
  Lock
} from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [formFullName, setFormFullName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formBranchAddress, setFormBranchAddress] = useState("");
  const [formDeliveryTime, setFormDeliveryTime] = useState("");
  const [editingBranchId, setEditingBranchId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");

  // UI state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [branchIdToDelete, setBranchIdToDelete] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchBranches();
  }, [router]);

  // Filter branches when search changes
  useEffect(() => {
    if (branches.length > 0) {
      const filtered = branches.filter(
        (branch) =>
          branch.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          branch.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (branch.branch_address && branch.branch_address.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredBranches(filtered);
      setCurrentPage(1); // Reset to first page on new search
    }
  }, [searchQuery, branches]);

  // Data fetching with error handling
  async function fetchBranches() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/admin/branches");
      setBranches(data);
      setFilteredBranches(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        toast.error(`Failed to fetch branches: ${err.message}`);
      } else {
        setError("An unexpected error occurred");
        toast.error("Failed to fetch branches");
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
  }

  function openAddModal() {
    resetForm();
    setIsModalOpen(true);
  }

  // Form validation
  function validateForm() {
    if (!formFullName.trim()) {
      setFormError("Branch name is required");
      return false;
    }
    
    if (!formEmail.trim()) {
      setFormError("Email address is required");
      return false;
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formEmail)) {
      setFormError("Please enter a valid email address");
      return false;
    }
    
    if (!editingBranchId && !formPassword) {
      setFormError("Password is required for new branches");
      return false;
    }
    
    if (!formBranchAddress.trim()) {
      setFormError("Branch address is required");
      return false;
    }
    
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!validateForm()) {
      return;
    }

    try {
      if (editingBranchId) {
        // Update branch
        const body: any = {
          full_name: formFullName,
          email: formEmail,
          branch_address: formBranchAddress,
          delivery_time: formDeliveryTime,
        };
        if (formPassword) {
          body.password_hash = formPassword;
        }

        const updatedBranch = await apiFetch(`/admin/branches/${editingBranchId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        
        setBranches((prev) =>
          prev.map((b) => (b.user_id === editingBranchId ? { ...b, ...updatedBranch } : b))
        );
        
        toast.success("Branch updated successfully");
        resetForm();
        setIsModalOpen(false);
      } else {
        // Create new branch
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
        
        toast.success("Branch created successfully");
        resetForm();
        fetchBranches();
        setIsModalOpen(false);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setFormError(message);
      toast.error(`Failed: ${message}`);
    }
  }

  function handleEdit(branch: Branch) {
    setEditingBranchId(branch.user_id);
    setFormFullName(branch.full_name);
    setFormEmail(branch.email);
    setFormPassword("");
    setFormBranchAddress(branch.branch_address || "");
    setFormDeliveryTime(branch.delivery_time || "");
    setIsModalOpen(true);
  }

  function handleDelete(branchId: number) {
    setBranchIdToDelete(branchId);
    setIsAlertOpen(true);
  }

  async function confirmDelete() {
    if (branchIdToDelete === null) return;
    
    try {
      await apiFetch(`/admin/branches/${branchIdToDelete}`, {
        method: "DELETE",
      });
      
      setBranches((prev) => prev.filter((b) => b.user_id !== branchIdToDelete));
      setFilteredBranches((prev) => prev.filter((b) => b.user_id !== branchIdToDelete));
      
      toast.success("Branch deleted successfully");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Failed to delete: ${message}`);
    } finally {
      setIsAlertOpen(false);
      setBranchIdToDelete(null);
    }
  }

  // Pagination
  const paginatedBranches = filteredBranches.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const totalPages = Math.ceil(filteredBranches.length / itemsPerPage);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Date formatter
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminNavbar />
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Branch Management
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Add, edit, and manage your branch locations
              </p>
            </div>
          </div>

          <Card className="mb-6">
            <CardContent className="">
              <div className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store size={18} />
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Total Branches</span>
                    <span className="text-xl font-semibold ml-2">
                      {loading ? <Skeleton className="inline-block h-6 w-12" /> : branches.length}
                    </span>
                  </div>
                </div>
                <Button onClick={openAddModal} size="sm" className="gap-2">
                  <Plus size={16} />
                  Add Branch
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle>Branch Stores</CardTitle>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search branches..."
                    className="pl-9 w-full sm:w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : error ? (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchBranches} 
                    className="mt-2"
                  >
                    Retry
                  </Button>
                </Alert>
              ) : filteredBranches.length === 0 ? (
                <div className="text-center py-10 space-y-4">
                  <Store className="mx-auto h-12 w-12 text-gray-400" />
                  {searchQuery ? (
                    <>
                      <p className="text-lg font-medium">No results found</p>
                      <p className="text-gray-500 dark:text-gray-400">
                        No branches match your search "{searchQuery}"
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => setSearchQuery("")}
                      >
                        Clear Search
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-medium">No branches found</p>
                      <p className="text-gray-500 dark:text-gray-400">
                        Get started by adding your first branch
                      </p>
                      <Button onClick={openAddModal}>
                        Add Your First Branch
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-100 dark:bg-gray-800">
                        <TableRow>
                          <TableHead>Branch Name</TableHead>
                          <TableHead className="hidden md:table-cell">Email</TableHead>
                          <TableHead className="hidden md:table-cell">Address</TableHead>
                          <TableHead className="hidden lg:table-cell">Delivery Time</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedBranches.map((branch) => (
                          <TableRow key={branch.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <span>{branch.full_name}</span>
                                <span className="text-sm text-gray-500 md:hidden mt-1">
                                  {branch.email}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <span className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                {branch.email}
                              </span>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {branch.branch_address ? (
                                <span className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-gray-400" />
                                  {branch.branch_address}
                                </span>
                              ) : (
                                <Badge variant="outline" className="text-gray-500">
                                  Not specified
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {branch.delivery_time ? (
                                <span className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-gray-400" />
                                  {branch.delivery_time}
                                </span>
                              ) : (
                                <Badge variant="outline" className="text-gray-500">
                                  Not specified
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleEdit(branch)}
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => handleDelete(branch.user_id)}
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {totalPages > 1 && (
                    <Pagination className="mt-6">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))} 
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                        
                        {[...Array(totalPages)].map((_, i) => {
                          const pageNumber = i + 1;
                          // Show current page, first, last, and nearby pages
                          if (
                            pageNumber === 1 ||
                            pageNumber === totalPages ||
                            (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                          ) {
                            return (
                              <PaginationItem key={pageNumber}>
                                <PaginationLink
                                  isActive={pageNumber === currentPage}
                                  onClick={() => handlePageChange(pageNumber)}
                                >
                                  {pageNumber}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          }
                          
                          // Show ellipsis for gaps
                          if (
                            (pageNumber === 2 && currentPage > 3) ||
                            (pageNumber === totalPages - 1 && currentPage < totalPages - 2)
                          ) {
                            return (
                              <PaginationItem key={pageNumber}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          
                          return null;
                        })}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Add/Edit Branch Dialog */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {editingBranchId ? (
                    <>
                      <Edit className="h-5 w-5" />
                      Edit Branch
                    </>
                  ) : (
                    <>
                      <Store className="h-5 w-5" />
                      Add New Branch
                    </>
                  )}
                </DialogTitle>
                <DialogDescription>
                  {editingBranchId
                    ? "Update the branch details below"
                    : "Fill in the details to create a new branch"}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="grid gap-6 py-4">
                {formError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="branchName" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Branch Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="branchName"
                      value={formFullName}
                      onChange={(e) => setFormFullName(e.target.value)}
                      placeholder="Chateraise Senayan"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="senayan@chateraise.id"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      {editingBranchId ? "New Password" : "Password"}
                      {!editingBranchId && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder={editingBranchId ? "Leave blank to keep current" : "Enter password"}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="branchAddress" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Branch Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="branchAddress"
                      value={formBranchAddress}
                      onChange={(e) => setFormBranchAddress(e.target.value)}
                      placeholder="Enter branch address"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="deliveryTime" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Delivery Time
                    </Label>
                    <Input
                      id="deliveryTime"
                      value={formDeliveryTime}
                      onChange={(e) => setFormDeliveryTime(e.target.value)}
                      placeholder="8am - 10am"
                    />
                  </div>
                </div>
              </form>
              
              <DialogFooter className="gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" onClick={handleSubmit}>
                  {editingBranchId ? "Update Branch" : "Add Branch"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Delete Branch
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the branch and remove all
                  associated data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={confirmDelete}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
    </div>
  );
}