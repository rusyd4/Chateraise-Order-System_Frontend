'use client'

import React, { useState } from "react";
import { format } from "date-fns";

// ShadCN UI Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Icons
import {
  Calendar,
  Search,
  Truck,
  ExternalLink,
  AlertCircle,
  X
} from "lucide-react";

interface OrderItem {
  food_id: number;
  food_name: string;
  quantity: number;
}

interface Order {
  order_id: number;
  branch_name: string;
  delivery_date: string;
  order_date: string;
  delivery_time?: string;
  branch_address?: string;
  items: OrderItem[];
  qrCodeImageUrl?: string;
}

interface PendingOrdersModalProps {
  orders: Order[];
  onClose: () => void;
  onViewOrder: (order: Order) => void;
  title?: string;
  isOpen?: boolean;
}

export default function PendingOrdersModal({
  orders,
  onClose,
  onViewOrder,
  title = "Pending Orders",
  isOpen = true
}: PendingOrdersModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  // Filter orders based on search term
  const filteredOrders = orders.filter(order =>
    order.branch_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.order_id.toString().includes(searchTerm) ||
    format(new Date(order.order_date), "dd MMM yyyy").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Function to handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Function to handle view order with error handling
  const handleViewOrder = (order: Order) => {
    try {
      onViewOrder(order);
    } catch (err) {
      setError(`Error viewing order ${order.order_id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="[&>button]:hidden sm:max-w-[800px] max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
            <Badge variant={title.includes("Pending") ? "secondary" : "default"} className="ml-2">
              {filteredOrders.length} Orders
            </Badge>
          </div>
          <DialogDescription>
            View and manage all {title.toLowerCase()}
          </DialogDescription>
        </DialogHeader>

        {/* Search and Filter Bar */}
        <div className="px-6 pb-3">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by branch, order ID, or date..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-8"
              />
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="px-6 pb-3">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <div className="flex justify-between items-center">
                <AlertDescription>{error}</AlertDescription>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setError("")}
                  className="h-6 w-6"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Alert>
          </div>
        )}

        {/* Table Section */}
        <div className="px-6 pb-3">
          {filteredOrders.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {searchTerm
                ? "No matching orders found. Try modifying your search."
                : `No ${title.toLowerCase()} found.`}
            </div>
          ) : (
            <ScrollArea className="h-[380px]">
              {/* Standard Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead>Delivery Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.order_id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">#{order.order_id}</TableCell>
                        <TableCell>{order.branch_name}</TableCell>
                        <TableCell>{format(new Date(order.order_date), "dd MMM yyyy")}</TableCell>
                        <TableCell>{format(new Date(order.delivery_date), "dd MMM yyyy")}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="default"
                            size="sm"
                            className="cursor-pointer bg-[#6D0000] hover:bg-[#7a0000]"
                            onClick={() => handleViewOrder(order)}
                          >
                            View Order
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {filteredOrders.map((order) => (
                  <Card key={order.order_id} className="overflow-hidden">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">
                          Order #{order.order_id}
                        </CardTitle>
                        <Badge variant={title.includes("Pending") ? "secondary" : "default"}>
                          {title.includes("Pending") ? "Pending" : "In Progress"}
                        </Badge>
                      </div>
                      <CardDescription>
                        {order.branch_name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 pb-2 space-y-2">
                      <div className="grid grid-cols-2 gap-y-1 text-sm">
                        <div className="flex items-center text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          Order Date:
                        </div>
                        <div>{format(new Date(order.order_date), "dd MMM yyyy")}</div>

                        <div className="flex items-center text-muted-foreground">
                          <Truck className="h-3.5 w-3.5 mr-1" />
                          Delivery Date:
                        </div>
                        <div>{format(new Date(order.delivery_date), "dd MMM yyyy")}</div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-2 flex justify-end">
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-[#6D0000] hover:bg-[#7a0000]"
                        onClick={() => handleViewOrder(order)}
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                        View Order
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}