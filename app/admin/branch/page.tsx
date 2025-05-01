"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiFetch from "../../../lib/api";
import Navbar from "../../components/AdminNavbar";
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
  Lock,
  RefreshCw,
  ChevronRight,
  X,
  BarChart3
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
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-red-50/30">
      <div className="w-64 h-screen fixed left-0 bg-[#6D0000] shadow-lg">
        <Navbar />
      </div>
      
      <main className="flex-1 p-6 ml-64 space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-xl px-6 py-5 shadow-md mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Branch Management
              </h1>
              <p className="text-sm text-gray-500 mt-1">Add, edit, and manage your branch locations</p>
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={fetchBranches}
              title="Refresh Data"
              className="rounded-full border-gray-200 text-gray-500 hover:text-[#6D0000] hover:border-[#6D0000]/30 hover:bg-[#6D0000]/5
              transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <RefreshCw className="h-4 w-4 transition-transform duration-300 hover:rotate-180" />
            </Button>
          </div>
        </div>

        {/* Stats Card */}
        <Card className="border-0 shadow-md rounded-xl bg-white transition-all duration-300 hover:shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-[#6D0000]/10 transition-all duration-300 hover:scale-110">
                  <Store className="h-6 w-6 text-[#6D0000]" />
                </div>
                <div>
                  <span className="text-sm text-gray-500">Total Branches</span>
                  <span className="text-2xl font-semibold text-[#6D0000] ml-2 transition-all duration-300">
                    {loading ? <Skeleton className="inline-block h-6 w-12" /> : branches.length}
                  </span>
                </div>
              </div>
              <Button 
                onClick={openAddModal} 
                size="sm" 
                className="bg-[#6D0000] hover:bg-[#800000] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 gap-2"
              >
                <Plus size={16} />
                Add Branch
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Branch Table Card */}
        <Card className="border-0 shadow-md rounded-xl bg-white transition-all duration-300 hover:shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="px-6 py-4 bg-[#6D0000] text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-white/90" />
                  <h2 className="text-lg font-semibold text-white">Branch Stores</h2>
                </div>
                <Badge variant="secondary" className="px-3 py-1 bg-white/20 text-white border-white/30 transition-all duration-300 hover:scale-105">
                  {filteredBranches.length} Branches
                </Badge>
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <p className="text-sm text-gray-500">Browse all branch locations in your network</p>
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-[#6D0000] transition-colors duration-200" />
                  <Input
                    type="search"
                    placeholder="Search branches..."
                    className="pl-9 w-full sm:w-64 border-gray-200 focus:border-[#6D0000] focus:ring-[#6D0000]/10 transition-all duration-200 pr-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#6D0000] transition-colors duration-200"
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : error ? (
                <Alert variant="destructive" className="mb-4 animate-pulse">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchBranches} 
                    className="mt-2 hover:bg-red-50"
                  >
                    Retry
                  </Button>
                </Alert>
              ) : filteredBranches.length === 0 ? (
                <div className="text-center py-10 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                    <Store className="h-8 w-8 text-gray-400" />
                  </div>
                  {searchQuery ? (
                    <>
                      <p className="text-lg font-medium">No results found</p>
                      <p className="text-gray-500">
                        No branches match your search "{searchQuery}"
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => setSearchQuery("")}
                        className="mt-2 border-[#6D0000]/20 text-[#6D0000] hover:bg-[#6D0000]/5 transition-all duration-300"
                      >
                        Clear Search
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-medium">No branches found</p>
                      <p className="text-gray-500">
                        Get started by adding your first branch
                      </p>
                      <Button 
                        onClick={openAddModal}
                        className="mt-2 bg-[#6D0000] hover:bg-[#800000] transition-all duration-300"
                      >
                        Add Your First Branch
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <div className="rounded-md border overflow-hidden shadow-sm">
                    <Table>
                      <TableHeader className="bg-gray-50">
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
                          <TableRow key={branch.user_id} className="hover:bg-gray-50 transition-colors duration-200 group cursor-default">
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <span className="text-gray-900 group-hover:text-[#6D0000] transition-colors duration-200">{branch.full_name}</span>
                                <span className="text-xs text-gray-500 md:hidden mt-1">
                                  {branch.email}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <span className="flex items-center gap-2 text-gray-600">
                                <Mail className="h-4 w-4 text-gray-400 group-hover:text-[#6D0000]/60 transition-colors duration-200" />
                                {branch.email}
                              </span>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {branch.branch_address ? (
                                <span className="flex items-center gap-2 text-gray-600">
                                  <MapPin className="h-4 w-4 text-gray-400 group-hover:text-[#6D0000]/60 transition-colors duration-200" />
                                  {branch.branch_address}
                                </span>
                              ) : (
                                <Badge variant="outline" className="text-gray-500 border-gray-200">
                                  Not specified
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {branch.delivery_time ? (
                                <span className="flex items-center gap-2 text-gray-600">
                                  <Clock className="h-4 w-4 text-gray-400 group-hover:text-[#6D0000]/60 transition-colors duration-200" />
                                  {branch.delivery_time}
                                </span>
                              ) : (
                                <Badge variant="outline" className="text-gray-500 border-gray-200">
                                  Not specified
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity duration-200">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleEdit(branch)}
                                  title="Edit"
                                  className="border-gray-200 text-gray-600 hover:text-[#6D0000] hover:border-[#6D0000]/30 hover:bg-[#6D0000]/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleDelete(branch.user_id)}
                                  title="Delete"
                                  className="border-gray-200 text-red-600 hover:text-white hover:bg-red-600 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
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
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "hover:text-[#6D0000] transition-colors duration-200"}
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
                                  className={pageNumber === currentPage ? "bg-[#6D0000] text-white hover:bg-[#800000]" : "hover:text-[#6D0000] hover:border-[#6D0000] transition-all duration-200"}
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
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "hover:text-[#6D0000] transition-colors duration-200"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add/Edit Branch Dialog */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-0 shadow-xl rounded-xl">
            <DialogHeader className="px-6 py-4 bg-[#6D0000] text-white">
              <DialogTitle className="text-xl font-semibold">
                {editingBranchId ? "Edit Branch" : "Add New Branch"}
              </DialogTitle>
              <DialogDescription className="text-white/80">
                {editingBranchId
                  ? "Update the branch details below"
                  : "Fill in the details to create a new branch"}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="grid gap-6 p-6">
              {formError && (
                <Alert variant="destructive" className="animate-pulse">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="branchName" className="flex items-center gap-2 text-sm font-medium">
                    <User className="h-4 w-4 text-[#6D0000]" />
                    Branch Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="branchName"
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    placeholder="Chateraise Senayan"
                    className="border-gray-200 focus:border-[#6D0000] focus:ring-[#6D0000]/10 transition-all duration-200"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                    <Mail className="h-4 w-4 text-[#6D0000]" />
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="senayan@chateraise.id"
                    className="border-gray-200 focus:border-[#6D0000] focus:ring-[#6D0000]/10 transition-all duration-200"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
                    <Lock className="h-4 w-4 text-[#6D0000]" />
                    {editingBranchId ? "New Password" : "Password"}
                    {!editingBranchId && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={editingBranchId ? "Leave blank to keep current" : "Enter password"}
                    className="border-gray-200 focus:border-[#6D0000] focus:ring-[#6D0000]/10 transition-all duration-200"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="branchAddress" className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4 text-[#6D0000]" />
                    Branch Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="branchAddress"
                    value={formBranchAddress}
                    onChange={(e) => setFormBranchAddress(e.target.value)}
                    placeholder="Enter branch address"
                    className="border-gray-200 focus:border-[#6D0000] focus:ring-[#6D0000]/10 transition-all duration-200"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="deliveryTime" className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="h-4 w-4 text-[#6D0000]" />
                    Delivery Time
                  </Label>
                  <Input
                    id="deliveryTime"
                    value={formDeliveryTime}
                    onChange={(e) => setFormDeliveryTime(e.target.value)}
                    placeholder="8am - 10am"
                    className="border-gray-200 focus:border-[#6D0000] focus:ring-[#6D0000]/10 transition-all duration-200"
                  />
                </div>
              </div>
            
              <DialogFooter className="gap-2 mt-2 flex-row justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)}
                  className="border-gray-200 hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-[#6D0000] hover:bg-[#800000] transition-all duration-200 hover:shadow-md"
                >
                  {editingBranchId ? "Update Branch" : "Add Branch"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent className="border-0 shadow-xl rounded-xl overflow-hidden p-0">
            <div className="bg-red-600 px-6 py-4 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-semibold">Delete Branch</AlertDialogTitle>
              </AlertDialogHeader>
            </div>
            
            <div className="p-6">
              <AlertDialogDescription className="text-gray-700 py-4">
                This action cannot be undone. This will permanently delete the branch and remove all
                associated data from our servers.
              </AlertDialogDescription>
              
              <AlertDialogFooter className="gap-2 mt-6 flex-row justify-end">
                <AlertDialogCancel className="border-gray-200 hover:bg-gray-50 transition-all duration-200">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow-md"
                  onClick={confirmDelete}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}