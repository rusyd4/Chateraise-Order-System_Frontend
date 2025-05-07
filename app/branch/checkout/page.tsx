"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import apiFetch from "../../../lib/api";
import { toast } from "sonner";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, ShoppingBag } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import BranchNavbar from "../../components/BranchNavbar";
import { Skeleton } from "@/components/ui/skeleton";

interface CartItem {
  food_id: number;
  food_name: string;
  description?: string;
  price: number | string;
  quantity: number;
}

interface BranchProfile {
  full_name: string;
  branch_address?: string;
  email?: string;
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [branchProfile, setBranchProfile] = useState<BranchProfile | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }
    fetchBranchProfile();
  }, []);

  async function fetchBranchProfile() {
    try {
      setIsLoading(true);
      const data = await apiFetch("/branch/profile");
      setBranchProfile(data);
    } catch (err: unknown) {
      console.error(err);
      toast("Failed to fetch branch profile");
    } finally {
      setIsLoading(false);
    }
  }

  function calculateTotal() {
    return cart.reduce((acc, item) => {
      const price = typeof item.price === "number" ? item.price : parseFloat(item.price);
      return acc + price * item.quantity;
    }, 0);
  }

  function formatRupiah(amount: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  }

  async function createOrder() {
    try {
      setIsSubmitting(true);
      const date = new Date();
      date.setDate(date.getDate() + 2);
      const delivery_date = date.toISOString();
      const items = cart.map(({ food_id, quantity }) => ({ food_id, quantity }));
      const data = await apiFetch("/branch/orders", {
        method: "POST",
        body: JSON.stringify({ delivery_date, items }),
      });
      console.log("Order created:", data);
      setShowOrderDetails(true);
      toast("Your order has been confirmed and will be delivered in 2 days.");
    } catch (err: unknown) {
      console.error(err);
      toast("Failed to create order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleConfirmOrder() {
    setShowConfirmDialog(true);
  }

  function handlePrint() {
    if (printRef.current) {
      window.print();
    }
  }

  function goToStore() {
    router.push("/branch/store");
  }

  if (isLoading) {
    return (
      <div>
        <BranchNavbar />
        <div className="p-8 max-w-7xl mx-auto">
          <Skeleton className="h-12 w-48 mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div>
        <BranchNavbar />
        <div className="p-8 max-w-7xl mx-auto">
          <Card className="p-8 text-center">
            <CardContent className="pt-6 flex flex-col items-center">
              <ShoppingBag size={64} className="text-gray-400 mb-4" />
              <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
              <p className="text-gray-500 mb-6">Add items to your cart to proceed with checkout</p>
              <Button 
                onClick={goToStore} 
                variant="default" 
                className="cursor-pointer bg-red-900 hover:bg-red-800"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Return to Store
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <BranchNavbar />
      <div className="p-8 max-w-7xl mx-auto">
        {!showOrderDetails ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Checkout</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.map((item) => (
                    <TableRow key={item.food_id}>
                      <TableCell className="font-medium">{item.food_name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {typeof item.price === "number"
                          ? formatRupiah(item.price * item.quantity)
                          : formatRupiah(parseFloat(item.price) * item.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="flex justify-end mt-6">
                <div className="bg-gray-50 p-4 rounded-lg w-64">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatRupiah(calculateTotal())}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={goToStore}
                className="cursor-pointer"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Continue Shopping
              </Button>
              <Button 
                onClick={handleConfirmOrder} 
                className="cursor-pointer bg-red-900 hover:bg-red-800" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Confirm Order"}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="print:shadow-none">
            <div ref={printRef}>
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-2xl text-center">Order Confirmation</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between">
                    <span className="font-medium">Branch Name:</span>
                    <span>{branchProfile?.full_name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Address:</span>
                    <span>{branchProfile?.branch_address || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Date:</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Delivery Date:</span>
                    <span>{
                      new Date(new Date().setDate(new Date().getDate() + 2)).toLocaleDateString()
                    }</span>
                  </div>
                </div>

                <Separator className="my-6" />
                
                <h2 className="text-xl font-semibold mb-4">Order Items</h2>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item.food_id}>
                        <TableCell className="font-medium">{item.food_name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          {typeof item.price === "number"
                            ? formatRupiah(item.price * item.quantity)
                            : formatRupiah(parseFloat(item.price) * item.quantity)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="flex justify-end mt-6">
                  <div className="bg-gray-50 p-4 rounded-lg w-64">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>{formatRupiah(calculateTotal())}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-900 rounded-lg p-4 mt-8 text-sm">
                  <p className="text-center">
                    Thank you for your order! Your items will be delivered on{" "}
                    <span className="font-semibold">
                      {new Date(new Date().setDate(new Date().getDate() + 2)).toLocaleDateString()}
                    </span>
                  </p>
                </div>
              </CardContent>
            </div>
            <CardFooter className="flex justify-between mt-4 print:hidden">
              <Button 
                variant="outline" 
                onClick={goToStore}
                className="cursor-pointer"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Return to Store
              </Button>
              <Button 
                onClick={handlePrint} 
                className="cursor-pointer bg-red-900 hover:bg-red-800"
              >
                <Printer className="mr-2 h-4 w-4" /> Print / Save PDF
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Your Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to place this order? The total amount is {formatRupiah(calculateTotal())}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={createOrder}
              className="bg-red-900 hover:bg-red-800 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Confirm Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}