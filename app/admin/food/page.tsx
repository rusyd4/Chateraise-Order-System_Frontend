"use client";

import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { usePathname } from "next/navigation";
import apiFetch from "../../../lib/api";
import Navbar from "../../components/AdminNavbar";
import { 
  Edit, 
  Trash2, 
  Plus, 
  Pizza, 
  AlertCircle, 
  Search,
  DollarSign,
  FileText,
  Tag,
  CheckCircle,
  XCircle,
  X,
  RefreshCw,
  ChevronRight,
  Store,
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [filteredFoodItems, setFilteredFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Form state
  const [foodForm, setFoodForm] = useState({
    food_id: "",
    food_name: "",
    description: "",
    price: "",
    is_available: true,
    editingId: null as number | null,
  });
  const [formError, setFormError] = useState("");

  // UI state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [foodIdToDelete, setFoodIdToDelete] = useState<number | null>(null);

  const fetchFoodItems = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/admin/food-items");
      setFoodItems(data);
      setFilteredFoodItems(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        toast.error(`Failed to fetch products: ${err.message}`);
      } else {
        setError("An unexpected error occurred");
        toast.error("Failed to fetch products");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchFoodItems();
  }, [fetchFoodItems]);

  // Filter food items when search changes
  useEffect(() => {
    if (foodItems.length > 0) {
      const filtered = foodItems.filter(
        (item) =>
          item.food_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.food_id.toString().includes(searchQuery)
      );
      setFilteredFoodItems(filtered);
      setCurrentPage(1); // Reset to first page on new search
    }
  }, [searchQuery, foodItems]);

  function handleFoodFormChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target;
    let val: string | boolean = value;
    
    if (type === "checkbox" && "checked" in e.target) {
      val = (e.target as HTMLInputElement).checked;
    }
    
    setFoodForm((prev) => ({
      ...prev,
      [name]: val,
    }));
  }

  function handleCheckboxChange(checked: boolean) {
    setFoodForm((prev) => ({
      ...prev,
      is_available: checked,
    }));
  }

  function resetForm() {
    setFoodForm({
      food_id: "",
      food_name: "",
      description: "",
      price: "",
      is_available: true,
      editingId: null,
    });
    setFormError("");
  }

  function validateForm() {
    if (!foodForm.food_id.trim()) {
      setFormError("Product ID is required");
      return false;
    }
    
    if (!foodForm.food_name.trim()) {
      setFormError("Product name is required");
      return false;
    }
    
    if (!foodForm.description.trim()) {
      setFormError("Description is required");
      return false;
    }
    
    if (!foodForm.price.trim()) {
      setFormError("Price is required");
      return false;
    }
    
    const price = parseFloat(foodForm.price);
    if (isNaN(price) || price < 0) {
      setFormError("Price must be a valid positive number");
      return false;
    }
    
    return true;
  }

  async function handleFoodFormSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const { food_id, food_name, description, price, is_available, editingId } = foodForm;
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
      
      resetForm();
      setIsModalOpen(false);
      fetchFoodItems();
      toast.success(editingId ? "Product updated successfully" : "Product added successfully");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setFormError(message);
      toast.error(`Failed: ${message}`);
    }
  }

  function handleAddFood() {
    resetForm();
    setIsModalOpen(true);
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

  function handleDeleteFood(food_id: number) {
    setFoodIdToDelete(food_id);
    setIsAlertOpen(true);
  }

  async function confirmDeleteFood() {
    if (foodIdToDelete === null) return;
    
    try {
      await apiFetch(`/admin/food-items/${foodIdToDelete}`, {
        method: "DELETE",
      });
      
      fetchFoodItems();
      toast.success("Product deleted successfully");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Failed to delete: ${message}`);
    } finally {
      setIsAlertOpen(false);
      setFoodIdToDelete(null);
    }
  }

  // Pagination
  const paginatedFoodItems = filteredFoodItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const totalPages = Math.ceil(filteredFoodItems.length / itemsPerPage);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-red-50/30">
        <Navbar />
        <main className="flex-1 p-6 pt-24 md:pt-6 md:ml-64 space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-xl px-6 py-5 shadow-md mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Product Management
              </h1>
              <p className="text-sm text-gray-500 mt-1">Add, edit, and manage your product catalog</p>
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={fetchFoodItems}
              title="Refresh Data"
              className="cursor-pointer rounded-full border-gray-200 text-gray-500 hover:text-[#6D0000] hover:border-[#6D0000]/30 hover:bg-[#6D0000]/5
              transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <RefreshCw className="h-4 w-4 transition-transform duration-300 hover:rotate-180" />
            </Button>
          </div>
        </div>

        {/* Stats Card */}
        <Card className="border-0 shadow-md rounded-xl bg-white transition-all duration-300 hover:shadow-lg mb-6">
          <CardContent className="">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-[#6D0000]/10 transition-all duration-300 hover:scale-110">
                  <Pizza className="h-6 w-6 text-[#6D0000]" />
                </div>
                <div>
                  <span className="text-sm text-gray-500">Total Products</span>
                  <span className="text-2xl font-semibold text-[#6D0000] ml-2 transition-all duration-300">
                    {loading ? <Skeleton className="inline-block h-6 w-12" /> : foodItems.length}
                  </span>
                </div>
              </div>
              <Button 
                onClick={handleAddFood} 
                size="sm" 
                className="cursor-pointer bg-[#6D0000] hover:bg-[#800000] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 gap-2"
              >
                <Plus size={16} />
                Add Product
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Product Table Card */}
        <Card className="border-0 shadow-md rounded-xl bg-white transition-all duration-300 hover:shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="px-6 py-4 bg-gradient-to-r from-[#6D0000] to-[#8B0000] text-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-white/90" />
                  <h2 className="text-lg font-semibold text-white">Product Catalog</h2>
                </div>
                <Badge variant="secondary" className="px-3 py-1 bg-white/20 text-white border-white/30 transition-all duration-300 hover:scale-105">
                  {filteredFoodItems.length} Products
                </Badge>
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <p className="text-sm text-gray-500">Browse all available products in your catalog</p>
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-[#6D0000] transition-colors duration-200" />
                  <Input
                    type="search"
                    placeholder="Search products..."
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
                    onClick={fetchFoodItems} 
                    className="mt-2 hover:bg-red-50"
                  >
                    Retry
                  </Button>
                </Alert>
              ) : filteredFoodItems.length === 0 ? (
                <div className="text-center py-10 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                    <Pizza className="h-8 w-8 text-gray-400" />
                  </div>
                  {searchQuery ? (
                    <>
                      <p className="text-lg font-medium">No results found</p>
                      <p className="text-gray-500">
                        No products match your search {searchQuery}
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
                      <p className="text-lg font-medium">No products found</p>
                      <p className="text-gray-500">
                        Get started by adding your first product
                      </p>
                      <Button 
                        onClick={handleAddFood}
                        className="mt-2 bg-[#6D0000] hover:bg-[#800000] transition-all duration-300"
                      >
                        Add Your First Product
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
                          <TableHead>Product ID</TableHead>
                          <TableHead>Product Name</TableHead>
                          <TableHead className="hidden md:table-cell">Description</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedFoodItems.map((item) => (
                          <TableRow key={item.food_id} className="hover:bg-gray-50 transition-colors duration-200 group cursor-default">
                            <TableCell className="font-medium">{item.food_id}</TableCell>
                            <TableCell>
                              <div>
                                {item.food_name}
                                <p className="text-sm text-gray-500 md:hidden mt-1 line-clamp-1">
                                  {item.description}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell max-w-xs">
                              <p className="truncate">{item.description}</p>
                            </TableCell>
                            <TableCell>
                              {new Intl.NumberFormat('id-ID', { 
                                style: 'currency', 
                                currency: 'IDR',
                                maximumFractionDigits: 0
                              }).format(item.price)}
                            </TableCell>
                            <TableCell>
                              {item.is_available ? (
                                <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 transition-colors duration-200">
                                  <CheckCircle className="mr-1 h-3 w-3" /> Available
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-red-700 border-red-200 hover:bg-red-50 transition-colors duration-200">
                                  <XCircle className="mr-1 h-3 w-3" /> Unavailable
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity duration-200">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleEditFood(item)}
                                  title="Edit"
                                  className="cursor-pointer border-gray-200 text-gray-600 hover:text-[#6D0000] hover:border-[#6D0000]/30 hover:bg-[#6D0000]/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleDeleteFood(item.food_id)}
                                  title="Delete"
                                  className="cursor-pointer border-gray-200 text-red-600 hover:text-white hover:bg-red-600 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
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
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:text-[#6D0000] transition-colors duration-200"}
                          />
                        </PaginationItem>
                        
                        {[...Array(totalPages)].map((_, i) => {
                          const pageNumber = i + 1;
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
                                  className={pageNumber === currentPage ? "bg-[#6D0000] text-white hover:bg-[#800000] hover:text-white" : "cursor-pointer hover:text-[#6D0000] hover:border-[#6D0000] transition-all duration-200"}
                                >
                                  {pageNumber}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          }
                          
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
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:text-[#6D0000] transition-colors duration-200"}
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

        {/* Add/Edit Product Dialog */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-0 shadow-xl rounded-xl">
            <DialogHeader className="px-6 py-4 bg-[#6D0000] text-white">
              <DialogTitle className="text-xl font-semibold">
                {foodForm.editingId ? "Edit Product" : "Add New Product"}
              </DialogTitle>
              <DialogDescription className="text-white/80">
                {foodForm.editingId
                  ? "Update the product details below"
                  : "Fill in the details to create a new product"}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleFoodFormSubmit} className="grid gap-6 p-6">
              {formError && (
                <Alert variant="destructive" className="animate-pulse">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="food_id" className="flex items-center gap-2 text-sm font-medium">
                    <Tag className="h-4 w-4 text-[#6D0000]" />
                    Product ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="food_id"
                    name="food_id"
                    placeholder="Ex: A5000001"
                    value={foodForm.food_id}
                    onChange={handleFoodFormChange}
                    disabled={!!foodForm.editingId}
                    className={foodForm.editingId ? "bg-gray-100" : "border-gray-200 focus:border-[#6D0000] focus:ring-[#6D0000]/10 transition-all duration-200"}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="food_name" className="flex items-center gap-2 text-sm font-medium">
                    <Pizza className="h-4 w-4 text-[#6D0000]" />
                    Product Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="food_name"
                    name="food_name"
                    placeholder="Ex: Coffee Jelly"
                    value={foodForm.food_name}
                    onChange={handleFoodFormChange}
                    className="border-gray-200 focus:border-[#6D0000] focus:ring-[#6D0000]/10 transition-all duration-200"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description" className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4 text-[#6D0000]" />
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Add a Description"
                    value={foodForm.description}
                    onChange={handleFoodFormChange}
                    rows={3}
                    className="border-gray-200 focus:border-[#6D0000] focus:ring-[#6D0000]/10 transition-all duration-200 resize-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price" className="flex items-center gap-2 text-sm font-medium">
                    <DollarSign className="h-4 w-4 text-[#6D0000]" />
                    Price <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="price"
                    name="price"
                    placeholder="Ex: 12000"
                    value={foodForm.price}
                    onChange={handleFoodFormChange}
                    type="number"
                    min="0"
                    step="1000"
                    className="border-gray-200 focus:border-[#6D0000] focus:ring-[#6D0000]/10 transition-all duration-200"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-md hover:border-[#6D0000]/30 hover:bg-[#6D0000]/5 transition-all duration-200 cursor-pointer">
                    <Checkbox 
                      id="is_available" 
                      checked={foodForm.is_available}
                      onCheckedChange={handleCheckboxChange}
                      className="data-[state=checked]:bg-[#6D0000] data-[state=checked]:border-[#6D0000]"
                    />
                    <Label 
                      htmlFor="is_available" 
                      className="text-sm font-medium leading-none cursor-pointer select-none"
                    >
                      Available for purchase
                    </Label>
                  </div>
                </div>
              </div>
            
              <DialogFooter className="gap-2 mt-2 flex-row justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)}
                  className="cursor-pointer border-gray-200 hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="cursor-pointer bg-[#6D0000] hover:bg-[#800000] transition-all duration-200 hover:shadow-md"
                >
                  {foodForm.editingId ? "Update Product" : "Add Product"}
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
                <AlertDialogTitle className="text-xl font-semibold">Delete Product</AlertDialogTitle>
              </AlertDialogHeader>
            </div>
            
            <div className="p-6">
              <AlertDialogDescription className="text-gray-700 py-4">
                Are you sure you want to delete this product? This action cannot be undone and will
                permanently remove the product from your catalog.
              </AlertDialogDescription>
              
              <AlertDialogFooter className="gap-2 mt-6 flex-row justify-end">
                <AlertDialogCancel className="cursor-pointer border-gray-200 hover:bg-gray-50 transition-all duration-200">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="cursor-pointer bg-red-600 hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow-md"
                  onClick={confirmDeleteFood}
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