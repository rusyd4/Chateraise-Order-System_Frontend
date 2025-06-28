"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import apiFetch from "../../../lib/api";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  Printer, 
  ShoppingBag, 
  ShoppingCart,
  Package,
  MapPin,
  Calendar,
  CheckCircle,
  CreditCard,
  Building2,
  Clock
} from "lucide-react";
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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(amount);
};

const formatDate = (date: Date) => {
  return format(date, "dd MMMM yyyy", { locale: id });
};

const LoadingSkeleton = () => (
  <div className="p-6 max-w-6xl mx-auto space-y-6">
    <div className="flex items-center space-x-4">
      <Skeleton className="h-6 w-6" />
      <Skeleton className="h-8 w-48" />
    </div>
    
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex justify-between items-center p-4 border rounded-lg">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);

const EmptyCart = ({ onGoToStore }: { onGoToStore: () => void }) => (
  <div className="p-6 max-w-6xl mx-auto">
    <Button
      variant="ghost"
      onClick={onGoToStore}
      className="mb-6 hover:bg-gray-100"
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      Kembali ke Toko
    </Button>
    
    <Card className="text-center py-16">
      <CardContent className="flex flex-col items-center space-y-6">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
          <ShoppingBag className="w-12 h-12 text-gray-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Keranjang Kosong</h1>
          <p className="text-gray-600 max-w-md">
            Belum ada item di keranjang Anda. Silakan pilih produk dari toko untuk melanjutkan pemesanan.
          </p>
        </div>
        <Button
          onClick={onGoToStore}
          className="bg-[#6D0000] hover:bg-[#8A0000] text-white px-8 py-3"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Toko
        </Button>
      </CardContent>
    </Card>
  </div>
);

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
      toast.error("Gagal memuat profil cabang", {
        description: "Silakan coba lagi atau hubungi administrator.",
      });
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

  async function createOrder() {
    try {
      setIsSubmitting(true);
      const date = new Date();
      date.setDate(date.getDate() + 2);
      const delivery_date = date.toISOString();
      const items = cart.map(({ food_id, quantity }) => ({ food_id, quantity }));
      
      const data = await apiFetch("/branch/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ delivery_date, items }),
      });
      
      console.log("Order created:", data);
      
      // Clear cart after successful order
      localStorage.removeItem("cart");
      setCart([]);
      setShowOrderDetails(true);
      setShowConfirmDialog(false);
      
      toast.success("Pesanan berhasil dikonfirmasi!", {
        description: "Item akan dikirim dalam 2 hari kerja.",
      });
    } catch (err: unknown) {
      console.error(err);
      toast.error("Gagal membuat pesanan", {
        description: "Silakan coba lagi atau hubungi administrator.",
      });
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

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 2);

  if (isLoading) {
    return (
      <>
        <BranchNavbar />
        <LoadingSkeleton />
      </>
    );
  }

  if (cart.length === 0) {
    return (
      <>
        <BranchNavbar />
        <EmptyCart onGoToStore={goToStore} />
      </>
    );
  }

  return (
    <>
      <BranchNavbar />
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {!showOrderDetails ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={goToStore}
                  className="hover:bg-gray-100"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Kembali
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
                  <p className="text-gray-600">Tinjau pesanan Anda sebelum konfirmasi</p>
                </div>
              </div>
              <Badge variant="secondary" className="px-3 py-1">
                <ShoppingCart className="mr-1 h-4 w-4" />
                {cart.length} Item
              </Badge>
            </div>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="mr-2 h-5 w-5" />
                  Item Pesanan
                </CardTitle>
                <CardDescription>
                  Detail item yang akan dipesan beserta jumlah dan harga
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cart.map((item, index) => (
                    <div
                      key={item.food_id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.food_name}</h3>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        )}
                        <div className="flex items-center mt-2 space-x-4">
                          <Badge variant="outline" className="px-2 py-1">
                            {item.quantity} carton
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {formatCurrency(typeof item.price === "number" ? item.price : parseFloat(item.price))} / carton
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">
                          {formatCurrency(
                            (typeof item.price === "number" ? item.price : parseFloat(item.price)) * item.quantity
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-6" />

                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="space-y-3">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Pembayaran</span>
                      <span className="text-[#6D0000]">{formatCurrency(calculateTotal())}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={goToStore}
                  className="px-6"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Lanjut Belanja
                </Button>
                <Button
                  onClick={handleConfirmOrder}
                  className="bg-[#6D0000] hover:bg-[#8A0000] text-white px-8"
                  disabled={isSubmitting}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Memproses..." : "Konfirmasi Pesanan"}
                </Button>
              </CardFooter>
            </Card>

            {/* Delivery Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Informasi Pengiriman
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Cabang Tujuan</p>
                      <p className="text-sm text-gray-600">{branchProfile?.full_name || "N/A"}</p>
                      <p className="text-sm text-gray-600">{branchProfile?.branch_address || "N/A"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Estimasi Pengiriman</p>
                      <p className="text-sm text-gray-600">{formatDate(deliveryDate)}</p>
                      <p className="text-xs text-gray-500">2 hari kerja dari konfirmasi</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          /* Order Confirmation */
          <Card className="print:shadow-none">
            <div ref={printRef}>
              <CardHeader className="border-b pb-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-green-600">Pesanan Berhasil Dikonfirmasi!</CardTitle>
                <CardDescription>Terima kasih atas pesanan Anda. Berikut adalah detail konfirmasi pesanan.</CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6 space-y-6">
                {/* Branch & Delivery Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-gray-600" />
                      <span className="font-medium">Informasi Cabang</span>
                    </div>
                    <div className="ml-6 space-y-1">
                      <p className="text-sm font-medium">{branchProfile?.full_name || "N/A"}</p>
                      <p className="text-sm text-gray-600">{branchProfile?.branch_address || "N/A"}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <span className="font-medium">Tanggal Pengiriman</span>
                    </div>
                    <div className="ml-6 space-y-1">
                      <p className="text-sm font-medium">{formatDate(deliveryDate)}</p>
                      <p className="text-sm text-gray-600">Estimasi 2 hari kerja</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Order Items */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Package className="mr-2 h-5 w-5" />
                    Detail Pesanan
                  </h3>
                  
                  <div className="space-y-3">
                    {cart.map((item, index) => (
                      <div key={item.food_id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{item.food_name}</p>
                          <p className="text-sm text-gray-600">{item.quantity} carton × {formatCurrency(typeof item.price === "number" ? item.price : parseFloat(item.price))}</p>
                        </div>
                        <p className="font-semibold">
                          {formatCurrency((typeof item.price === "number" ? item.price : parseFloat(item.price)) * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Pembayaran</span>
                      <span className="text-[#6D0000]">{formatCurrency(calculateTotal())}</span>
                    </div>
                  </div>
                </div>

                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Pesanan Anda telah dikonfirmasi!</strong> Item akan dikirim ke alamat cabang pada tanggal {formatDate(deliveryDate)}.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </div>
            
            <CardFooter className="flex justify-between mt-6 print:hidden">
              <Button
                variant="outline"
                onClick={goToStore}
                className="px-6"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Toko
              </Button>
              <Button
                onClick={handlePrint}
                className="bg-[#6D0000] hover:bg-[#8A0000] text-white px-6"
              >
                <Printer className="mr-2 h-4 w-4" />
                Cetak / Simpan PDF
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5 text-[#6D0000]" />
              Konfirmasi Pesanan
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Apakah Anda yakin ingin melanjutkan pesanan ini?</p>
              
              <div className="bg-gray-50 p-3 rounded-md space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Item:</span>
                  <span className="font-medium">{cart.length} item ({cart.reduce((total, item) => total + item.quantity, 0)} carton)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Pembayaran:</span>
                  <span className="font-medium text-[#6D0000]">{formatCurrency(calculateTotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Estimasi Pengiriman:</span>
                  <span className="font-medium">{formatDate(deliveryDate)}</span>
                </div>
              </div>
              
              <p className="text-sm text-amber-600">
                <strong>Catatan:</strong> Anda dapat mengubah pesanan hari ini dengan cara memesan ulang pada hari yang sama.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={createOrder}
              className="bg-[#6D0000] hover:bg-[#8A0000] text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Memproses...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Ya, Konfirmasi
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}