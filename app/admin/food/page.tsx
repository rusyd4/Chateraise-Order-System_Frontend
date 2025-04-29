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
  XCircle
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
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Product Management
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Add, edit, and manage your product catalog
              </p>
            </div>
          </div>

          <Card className="mb-6">
            <CardContent>
              <div className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pizza size={18} />
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Total Products</span>
                    <span className="text-xl font-semibold ml-2">
                      {loading ? <Skeleton className="inline-block h-6 w-12" /> : foodItems.length}
                    </span>
                  </div>
                </div>
                <Button onClick={handleAddFood} size="sm" className="gap-2">
                  <Plus size={16} />
                  Add Product
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Product Catalog
                </h2>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search products..."
                    className="pl-9 w-full sm:w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

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
                    onClick={fetchFoodItems} 
                    className="mt-2"
                  >
                    Retry
                  </Button>
                </Alert>
              ) : filteredFoodItems.length === 0 ? (
                <div className="text-center py-10 space-y-4">
                  <Pizza className="mx-auto h-12 w-12 text-gray-400" />
                  {searchQuery ? (
                    <>
                      <p className="text-lg font-medium">No results found</p>
                      <p className="text-gray-500 dark:text-gray-400">
                        No products match your search "{searchQuery}"
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
                      <p className="text-lg font-medium">No products found</p>
                      <p className="text-gray-500 dark:text-gray-400">
                        Get started by adding your first product
                      </p>
                      <Button onClick={handleAddFood}>
                        Add Your First Product
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
                          <TableRow key={item.food_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
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
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                  <CheckCircle className="mr-1 h-3 w-3" /> Available
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-red-800 dark:text-red-300">
                                  <XCircle className="mr-1 h-3 w-3" /> Unavailable
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleEditFood(item)}
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => handleDeleteFood(item.food_id)}
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

          {/* Add/Edit Product Dialog */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {foodForm.editingId ? (
                    <>
                      <Edit className="h-5 w-5" />
                      Edit Product
                    </>
                  ) : (
                    <>
                      <Pizza className="h-5 w-5" />
                      Add New Product
                    </>
                  )}
                </DialogTitle>
                <DialogDescription>
                  {foodForm.editingId
                    ? "Update the product details below"
                    : "Fill in the details to create a new product"}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleFoodFormSubmit} className="grid gap-6 py-4">
                {formError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="food_id" className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Product ID <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="food_id"
                      name="food_id"
                      placeholder="Ex: A5000001"
                      value={foodForm.food_id}
                      onChange={handleFoodFormChange}
                      disabled={!!foodForm.editingId}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="food_name" className="flex items-center gap-2">
                      <Pizza className="h-4 w-4" />
                      Product Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="food_name"
                      name="food_name"
                      placeholder="Ex: Coffee Jelly"
                      value={foodForm.food_name}
                      onChange={handleFoodFormChange}
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Add a Description"
                      value={foodForm.description}
                      onChange={handleFoodFormChange}
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="price" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
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
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="is_available" 
                        checked={foodForm.is_available}
                        onCheckedChange={handleCheckboxChange}
                      />
                      <Label 
                        htmlFor="is_available" 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Available for purchase
                      </Label>
                    </div>
                  </div>
                </div>
              </form>
              
              <DialogFooter className="gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" onClick={(e) => {
                  e.preventDefault();
                  const formEvent = new Event('submit', { bubbles: true, cancelable: true }) as unknown as FormEvent<HTMLFormElement>;
                  handleFoodFormSubmit(formEvent);
                }}>
                  {foodForm.editingId ? "Update Product" : "Add Product"}
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
                  Delete Product
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this product? This action cannot be undone and will
                  permanently remove the product from your catalog.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={confirmDeleteFood}
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