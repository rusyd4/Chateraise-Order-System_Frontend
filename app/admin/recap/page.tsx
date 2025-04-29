"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import * as XLSX from "xlsx";

// Shadcn UI components
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarIcon, FileSpreadsheet, RefreshCw } from "lucide-react";
import { format } from "date-fns";

// Existing imports
import apiFetch from "../../../lib/api";
import Navbar from "../../components/AdminNavbar";

interface OrderItem {
  food_id: number;
  food_name: string;
  quantity: number;
  price?: number;
}

interface Order {
  order_id: number;
  branch_name: string;
  delivery_date: string;
  order_date: string;
  items: OrderItem[];
}

interface FoodItem {
  food_id: number;
  food_name: string;
}

export default function AdminRecap() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ 
    from: undefined, 
    to: undefined 
  });
  
  const [appliedDateRange, setAppliedDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ 
    from: undefined, 
    to: undefined 
  });

  const pathname = usePathname();

  useEffect(() => {
    fetchOrders();
    fetchFoodItems();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    setError("");
    try {
      const data: Order[] = await apiFetch("/admin/orders");
      setOrders(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(`Failed to load orders: ${err.message}`);
      } else {
        setError(`Failed to load orders: ${String(err)}`);
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchFoodItems() {
    try {
      const data: FoodItem[] = await apiFetch("/admin/food-items");
      setFoodItems(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(`Failed to load food items: ${err.message}`);
      } else {
        setError(`Failed to load food items: ${String(err)}`);
      }
    }
  }

  async function refreshData() {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchOrders(), fetchFoodItems()]);
    } finally {
      setIsRefreshing(false);
    }
  }

  // Filter orders based on selected date range
  function filterOrdersByDateRange(orders: Order[]): Order[] {
    if (!appliedDateRange.from || !appliedDateRange.to) {
      return orders;
    }
    const fromDate = new Date(appliedDateRange.from);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(appliedDateRange.to);
    toDate.setHours(23, 59, 59, 999);

    return orders.filter((order) => {
      const orderDate = new Date(order.delivery_date);
      return orderDate >= fromDate && orderDate <= toDate;
    });
  }

  // Aggregate data: item names on left, store names on top, quantities in cells, plus total per item
  function aggregateData(orders: Order[]) {
    const filteredOrders = filterOrdersByDateRange(orders);

    // Get unique store names
    const storeNames = Array.from(new Set(filteredOrders.map((order) => order.branch_name)));

    // Create a map from food_name to food_id for quick lookup
    const foodNameToIdMap: Record<string, number> = {};
    foodItems.forEach((food) => {
      foodNameToIdMap[food.food_name] = food.food_id;
    });

    // Map of item name to map of store name to quantity and food_id
    const itemStoreMap: Record<string, { storeQuantities: Record<string, number>; food_id: number }> = {};

    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!itemStoreMap[item.food_name]) {
          itemStoreMap[item.food_name] = { storeQuantities: {}, food_id: foodNameToIdMap[item.food_name] || 0 };
        }
        if (!itemStoreMap[item.food_name].storeQuantities[order.branch_name]) {
          itemStoreMap[item.food_name].storeQuantities[order.branch_name] = 0;
        }
        itemStoreMap[item.food_name].storeQuantities[order.branch_name] += item.quantity;
      });
    });

    // Calculate total per item
    const items = Object.keys(itemStoreMap).map((itemName) => {
      const { storeQuantities, food_id } = itemStoreMap[itemName];
      const total = Object.values(storeQuantities).reduce((acc, val) => acc + val, 0);
      return { itemName, storeQuantities, total, food_id };
    });

    // Sort items by total (descending)
    items.sort((a, b) => b.total - a.total);

    return { storeNames, items };
  }

  function exportToExcel() {
    setIsExporting(true);
    
    try {
      const { storeNames, items } = aggregateData(orders);
      
      // Create date range subtitle for export
      let dateRangeText = "";
      if (appliedDateRange.from && appliedDateRange.to) {
        dateRangeText = `${format(appliedDateRange.from, "MMM d, yyyy")} to ${format(appliedDateRange.to, "MMM d, yyyy")}`;
      }
      
      // Prepare data for worksheet
      const wsData = [];

      // Add title and date range
      wsData.push(["Orders Recap"]);
      if (dateRangeText) {
        wsData.push([dateRangeText]);
        wsData.push([]);  // Empty row for spacing
      }
      
      // Header row
      const headerRow = ["Food ID", "Item Name", "Total", ...storeNames];
      wsData.push(headerRow);

      // Data rows
      items.forEach(({ itemName, storeQuantities, total, food_id }) => {
        const row = [
          food_id,
          itemName,
          total,
          ...storeNames.map((store) => storeQuantities[store] || 0),
        ];
        wsData.push(row);
      });

      // Create worksheet and workbook
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Recap");

      // Apply some styling to the header
      const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_address = XLSX.utils.encode_cell({ r: 3, c: C }); // Header is on row 4 (0-indexed)
        if (!ws[cell_address]) continue;
        ws[cell_address].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "6D0000" } },
          font: { color: { rgb: "FFFFFF" } }
        };
      }

      // Export to file
      XLSX.writeFile(wb, `recap_orders_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    } catch (err) {
      setError(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsExporting(false);
    }
  }

  const { storeNames, items } = aggregateData(orders);

  const showTable = !loading && !error && appliedDateRange.from && appliedDateRange.to;
  const hasData = items.length > 0;

  return (
    <div className="flex flex-col md:flex-row max-w-full min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="flex-1 p-4 md:p-8 space-y-6 overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Orders Recap</h1>
            {appliedDateRange.from && appliedDateRange.to && (
              <p className="text-slate-500 mt-1">
                {format(appliedDateRange.from, "MMMM d, yyyy")} - {format(appliedDateRange.to, "MMMM d, yyyy")}
              </p>
            )}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshData} 
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Date Range Selection</CardTitle>
            <CardDescription>Select a date range to filter orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      "Select date range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => {
                      if (range && "from" in range) {
                        setDateRange({ from: range.from, to: range.to });
                      }
                    }}
                    numberOfMonths={2}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <div className="flex flex-row gap-2 w-full sm:w-auto">
                <Button 
                  onClick={() => setAppliedDateRange(dateRange)}
                  disabled={!dateRange.from || !dateRange.to}
                  className="flex-1 sm:flex-none"
                >
                  Apply
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setDateRange({ from: undefined, to: undefined });
                    setAppliedDateRange({ from: undefined, to: undefined });
                  }}
                  className="flex-1 sm:flex-none"
                >
                  Reset
                </Button>
              </div>
              
              <Button 
                variant="secondary"
                className="gap-2 w-full sm:w-auto ml-auto"
                onClick={exportToExcel} 
                disabled={!hasData || isExporting}
              >
                <FileSpreadsheet className="h-4 w-4" />
                {isExporting ? "Exporting..." : "Export to Excel"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </CardContent>
          </Card>
        ) : showTable ? (
          hasData ? (
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-320px)] w-full">
                  <Table>
                    <TableCaption>
                      Showing {items.length} food items across {storeNames.length} branches
                    </TableCaption>
                    <TableHeader>
                      <TableRow className="bg-slate-100">
                        <TableHead className="w-24">Food ID</TableHead>
                        <TableHead>Item Name</TableHead>
                        <TableHead className="text-right w-28">Total</TableHead>
                        {storeNames.map((store) => (
                          <TableHead key={store} className="text-right whitespace-nowrap">
                            {store}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map(({ itemName, storeQuantities, total, food_id }) => (
                        <TableRow key={`${food_id}-${itemName}`} className="hover:bg-slate-50">
                          <TableCell className="font-mono">{food_id}</TableCell>
                          <TableCell className="font-medium">{itemName}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary" className="font-semibold">
                              {total}
                            </Badge>
                          </TableCell>
                          {storeNames.map((store) => (
                            <TableCell key={`${food_id}-${store}`} className="text-right">
                              {storeQuantities[store] ? storeQuantities[store] : "-"}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 flex flex-col items-center justify-center h-64">
                <p className="text-slate-500 text-center">No orders found for the selected period.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setAppliedDateRange({ from: undefined, to: undefined })}
                >
                  Reset Date Filter
                </Button>
              </CardContent>
            </Card>
          )
        ) : (
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center h-64">
              <p className="text-slate-500 text-center">Please select a date range to view order data.</p>
              <CalendarIcon className="h-16 w-16 text-slate-300 mt-4" />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}