"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { 
  Calendar, 
  Clock, 
  Package, 
  ArrowLeft, 
  CheckCircle,
  XCircle,
  AlertCircle,
  ShoppingCart
} from "lucide-react";
import { toast } from "sonner";

import apiFetch from "../../../../lib/api";
import BranchNavbar from "../../../components/BranchNavbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import { Skeleton } from "../../../../components/ui/skeleton";
import { Alert, AlertDescription } from "../../../../components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../../../components/ui/alert-dialog";

interface OrderItem {
  food_name: string;
  quantity: number;
  price: number;
}

interface Order {
  order_id: number;
  delivery_date: string;
  order_date: string;
  order_status: string;
  items: OrderItem[];
}

const getStatusConfig = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return {
        variant: 'secondary' as const,
        icon: Clock,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
      };
    case 'in-progress':
      return {
        variant: 'default' as const,
        icon: Package,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
      };
    case 'finished':
      return {
        variant: 'default' as const,
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
      };
    default:
      return {
        variant: 'outline' as const,
        icon: AlertCircle,
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
      };
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return format(new Date(dateString), "dd MMMM yyyy 'pukul' HH:mm", { locale: id });
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

export default function OrderDetailPage() {
  const params = useParams();
  const order_id = params?.order_id;
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [finishLoading, setFinishLoading] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);

  useEffect(() => {
    if (!order_id) return;

    async function fetchOrder() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch(`/branch/orders/${order_id}`);
        setOrder(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Terjadi kesalahan yang tidak diketahui");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [order_id]);

  const handleFinishOrder = async () => {
    if (!order_id) return;
    
    setFinishLoading(true);
    try {
      const response = await apiFetch(`/branch/orders/${order_id}/status/finished`, {
        method: "PUT",
      });
      
      if (response.msg === "Order status updated to Finished") {
        // Update order status in state
        setOrder((prev) => prev ? { ...prev, order_status: "Finished" } : prev);
        setShowFinishDialog(false);
        
        toast.success("Pesanan berhasil diselesaikan!", {
          description: "Status pesanan telah diubah menjadi selesai.",
        });
        
        // Redirect after a short delay to show the success toast
        setTimeout(() => {
          router.push("/branch/store");
        }, 2000);
      } else {
        toast.error("Gagal menyelesaikan pesanan", {
          description: response.msg || "Terjadi kesalahan saat memproses pesanan.",
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error("Gagal menyelesaikan pesanan", {
          description: err.message,
        });
      } else {
        toast.error("Gagal menyelesaikan pesanan", {
          description: "Terjadi kesalahan yang tidak diketahui.",
        });
      }
    } finally {
      setFinishLoading(false);
    }
  };

  const totalAmount = order?.items.reduce((total, item) => total + (item.price * item.quantity), 0) || 0;
  const statusConfig = order ? getStatusConfig(order.order_status) : null;

  if (loading) {
    return (
      <>
        <BranchNavbar />
        <LoadingSkeleton />
      </>
    );
  }

  if (error) {
    return (
      <>
        <BranchNavbar />
        <div className="p-6 max-w-6xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="text-base">
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <BranchNavbar />
        <div className="p-6 max-w-6xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-base">
              Detail pesanan tidak ditemukan.
            </AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  return (
    <>
      <BranchNavbar />
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Detail Pesanan</h1>
              <p className="text-gray-600">Informasi lengkap pesanan #{order.order_id}</p>
            </div>
          </div>
          
          {statusConfig && (
            <Badge variant={statusConfig.variant} className={`${statusConfig.bgColor} ${statusConfig.color} px-3 py-1`}>
              <statusConfig.icon className="mr-1 h-4 w-4" />
              {order.order_status}
            </Badge>
          )}
        </div>

        {/* Order Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Informasi Pesanan
            </CardTitle>
            <CardDescription>
              Detail informasi pesanan dan tanggal pengiriman
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">ID Pesanan</p>
                <p className="text-lg font-semibold">#{order.order_id}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500 flex items-center">
                  <Calendar className="mr-1 h-4 w-4" />
                  Tanggal Pesanan
                </p>
                <p className="text-sm">{formatDate(order.order_date)}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500 flex items-center">
                  <Clock className="mr-1 h-4 w-4" />
                  Tanggal Pengiriman
                </p>
                <p className="text-sm">{formatDate(order.delivery_date)}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Status</p>
                {statusConfig && (
                  <Badge variant={statusConfig.variant} className={`${statusConfig.bgColor} ${statusConfig.color}`}>
                    <statusConfig.icon className="mr-1 h-4 w-4" />
                    {order.order_status}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Items Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Item Pesanan
            </CardTitle>
            <CardDescription>
              Daftar item yang dipesan beserta detail harga
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Nama Makanan</TableHead>
                    <TableHead className="text-center font-semibold">Jumlah</TableHead>
                    <TableHead className="text-center font-semibold">Harga Satuan</TableHead>
                    <TableHead className="text-center font-semibold">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item, index) => (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{item.food_name}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="px-2 py-1">
                          {item.quantity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {formatCurrency(item.price)}
                      </TableCell>
                      <TableCell className="text-center font-mono font-semibold">
                        {formatCurrency(item.price * item.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2 bg-gray-50">
                    <TableCell colSpan={3} className="font-semibold text-right">
                      Total Keseluruhan:
                    </TableCell>
                    <TableCell className="text-center font-mono font-bold text-lg">
                      {formatCurrency(totalAmount)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        {order.order_status === "In-progress" && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                <div>
                  <h3 className="text-lg font-semibold">Selesaikan Pesanan</h3>
                  <p className="text-sm text-gray-600">
                    Tandai pesanan ini sebagai selesai setelah pengiriman berhasil
                  </p>
                </div>
                
                <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="lg" className="min-w-[150px]">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Selesaikan Pesanan
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center">
                        <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                        Konfirmasi Penyelesaian Pesanan
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-3">
                        <p>
                          Apakah Anda yakin ingin menandai pesanan <strong>#{order.order_id}</strong> sebagai selesai?
                        </p>
                        <div className="bg-gray-50 p-3 rounded-md space-y-1">
                          <p className="text-sm"><strong>Total Item:</strong> {order.items.length} item</p>
                          <p className="text-sm"><strong>Total Harga:</strong> {formatCurrency(totalAmount)}</p>
                          <p className="text-sm"><strong>Tanggal Pengiriman:</strong> {formatDate(order.delivery_date)}</p>
                        </div>
                        <p className="text-sm text-red-600">
                          <strong>Perhatian:</strong> Tindakan ini tidak dapat dibatalkan setelah dikonfirmasi.
                        </p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={finishLoading}>
                        Batal
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleFinishOrder}
                        disabled={finishLoading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {finishLoading ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Memproses...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Ya, Selesaikan
                          </>
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
