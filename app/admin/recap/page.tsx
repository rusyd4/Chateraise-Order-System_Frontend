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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CalendarIcon,
  FileSpreadsheet,
  RefreshCw,
  Store,
  Filter,
  BarChart3,
  AlertCircle,
  PieChart,
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

// Existing imports
import apiFetch from "../../../lib/api";
// Removed Navbar import as it's now handled by the layout

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

  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  const [appliedDateRange, setAppliedDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
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
    const storeNames = Array.from(
      new Set(filteredOrders.map((order) => order.branch_name))
    );

    // Create a map from food_name to food_id for quick lookup
    const foodNameToIdMap: Record<string, number> = {};
    foodItems.forEach((food) => {
      foodNameToIdMap[food.food_name] = food.food_id;
    });

    // Map of item name to map of store name to quantity and food_id
    const itemStoreMap: Record<
      string,
      { storeQuantities: Record<string, number>; food_id: number }
    > = {};

    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!itemStoreMap[item.food_name]) {
          itemStoreMap[item.food_name] = {
            storeQuantities: {},
            food_id: foodNameToIdMap[item.food_name] || 0,
          };
        }
        if (!itemStoreMap[item.food_name].storeQuantities[order.branch_name]) {
          itemStoreMap[item.food_name].storeQuantities[order.branch_name] = 0;
        }
        itemStoreMap[item.food_name].storeQuantities[order.branch_name] +=
          item.quantity;
      });
    });

    // Calculate total per item
    const items = Object.keys(itemStoreMap).map((itemName) => {
      const { storeQuantities, food_id } = itemStoreMap[itemName];
      const total = Object.values(storeQuantities).reduce(
        (acc, val) => acc + val,
        0
      );
      return { itemName, storeQuantities, total, food_id };
    });

    // Sort items by food_id ascending (a-z)
    items.sort((a, b) => a.food_id - b.food_id);

    return { storeNames, items };
  }

  function exportToExcel() {
    setIsExporting(true);

    try {
      const { storeNames, items } = aggregateData(orders);

      // Create date range subtitle for export
      let dateRangeText = "";
      if (appliedDateRange.from && appliedDateRange.to) {
        dateRangeText = `${format(
          appliedDateRange.from,
          "MMM d, yyyy"
        )} to ${format(appliedDateRange.to, "MMM d, yyyy")}`;
      }

      // Prepare data for worksheet
      const wsData = [];

      // Add title and date range
      wsData.push(["Orders Recap"]);
      if (dateRangeText) {
        wsData.push([dateRangeText]);
        wsData.push([]); // Empty row for spacing
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
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "6D0000" } },
        };
      }

      // Export to file
      XLSX.writeFile(
        wb,
        `recap_orders_${format(new Date(), "yyyy-MM-dd")}.xlsx`
      );
    } catch (err) {
      setError(
        `Export failed: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setIsExporting(false);
    }
  }

  const { storeNames, items } = aggregateData(orders);

  const showTable =
    !loading && !error && appliedDateRange.from && appliedDateRange.to;
  const hasData = items.length > 0;

  // Get totals for summary stats
  const totalOrderCount = filterOrdersByDateRange(orders).length;
  const totalItemQuantity = items.reduce((acc, item) => acc + item.total, 0);

  return (
    <div className="space-y-6 md:space-y-8">
        <div className="bg-gradient-to-r from-[#a52422] to-[#6D0000] rounded-xl px-6 py-5 shadow-md mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Orders Recap</h1>
              <p className="text-sm text-white mt-1">Filter orders by date</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={refreshData}
              disabled={isRefreshing}
              title="Refresh Data"
              className="rounded-full border-gray-200 text-gray-500 hover:text-[#6D0000] hover:border-[#6D0000]/30 hover:bg-[#6D0000]/5
              transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <RefreshCw
                className={`h-4 w-4 transition-transform duration-300 hover:rotate-180 ${isRefreshing ? "animate-spin" : ""
                  }`}
              />
            </Button>
          </div>
        </div>

        {error && (
          <Alert
            variant="destructive"
            className="mb-6 animate-pulse border-0 shadow-md"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="border-0 shadow-md rounded-xl bg-white transition-all duration-300 hover:shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="px-6 py-4 bg-gradient-to-r from-[#a52422] to-[#6D0000] text-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-white/90" />
                  <h2 className="text-lg font-semibold text-white">
                    Date Range Selection
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-500 mb-4">
                Select a date range to filter orders and view the recap data
              </p>

              <div className="flex flex-col gap-4">
                {/* First row: Date picker and action buttons */}
                <div className="flex flex-row items-center gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="cursor-pointer w-64 justify-start text-left font-normal border-gray-400 hover:border-[#6D0000] hover:bg-[#6D0000]/5 transition-all duration-300 hover:shadow-md rounded-full"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-gray-400 transition-transform duration-300 group-hover:scale-110" />
                        {dateRange.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "LLL dd, y")} -{" "}
                              {format(dateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(dateRange.from, "LLL dd, y")
                          )
                        ) : (
                          "Select date range"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 rounded-lg shadow-lg border-gray-100"
                      align="start"
                    >
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
                        className="rounded-md border shadow-md"
                      />
                    </PopoverContent>
                  </Popover>

                  <Button
                    onClick={() => setAppliedDateRange(dateRange)}
                    disabled={!dateRange.from || !dateRange.to}
                    className="w-24 bg-[#6D0000] hover:bg-[#800000] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 rounded-full"
                  >
                    Apply
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setDateRange({ from: undefined, to: undefined });
                      setAppliedDateRange({ from: undefined, to: undefined });
                    }}
                    className="cursor-pointer w-24 border-gray-200 hover:border-[#6D0000] hover:bg-[#6D0000]/5 transition-all duration-300 hover:shadow-md rounded-full"
                  >
                    Reset
                  </Button>
                </div>

                {/* Second row: Quick selection and export buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    className={`cursor-pointer w-auto bg-white text-[#6D0000] border border-[#6D0000] hover:bg-[#6D0000] hover:text-white rounded-full transition-all duration-200 hover:shadow-md ${appliedDateRange.from &&
                      appliedDateRange.to &&
                      (() => {
                        const now = new Date();
                        const last7From = new Date();
                        last7From.setDate(now.getDate() - 7);
                        // Normalize dates for comparison
                        const appliedFrom = new Date(appliedDateRange.from);
                        const appliedTo = new Date(appliedDateRange.to);
                        appliedFrom.setHours(0, 0, 0, 0);
                        appliedTo.setHours(23, 59, 59, 999);
                        last7From.setHours(0, 0, 0, 0);
                        now.setHours(23, 59, 59, 999);
                        if (
                          appliedFrom.getTime() === last7From.getTime() &&
                          appliedTo.getTime() === now.getTime()
                        ) {
                          return "bg-[#6D0000] text-white";
                        }
                        return "bg-white text-[#6D0000] hover:bg-[#6D0000] hover:text-white";
                      })()
                      }`}
                    onClick={() => {
                      const to = new Date();
                      const from = new Date();
                      from.setDate(from.getDate() - 7);
                      setDateRange({ from, to });
                      setAppliedDateRange({ from, to });
                    }}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Last 7 Days
                  </Button>


                  <Button
                    className={`cursor-pointer w-auto bg-white text-[#6D0000] border border-[#6D0000] hover:bg-[#6D0000] hover:text-white rounded-full transition-all duration-200 hover:shadow-md ${appliedDateRange.from &&
                      appliedDateRange.to &&
                      (() => {
                        const now = new Date();
                        const last30From = new Date();
                        last30From.setDate(now.getDate() - 30);
                        // Normalize dates for comparison
                        const appliedFrom = new Date(appliedDateRange.from);
                        const appliedTo = new Date(appliedDateRange.to);
                        appliedFrom.setHours(0, 0, 0, 0);
                        appliedTo.setHours(23, 59, 59, 999);
                        last30From.setHours(0, 0, 0, 0);
                        now.setHours(23, 59, 59, 999);
                        if (
                          appliedFrom.getTime() === last30From.getTime() &&
                          appliedTo.getTime() === now.getTime()
                        ) {
                          return "bg-[#6D0000] text-white";
                        }
                        return "bg-white text-[#6D0000] hover:bg-[#6D0000] hover:text-white";
                      })()
                      }`}
                    onClick={() => {
                      const to = new Date();
                      const from = new Date();
                      from.setDate(from.getDate() - 30);
                      setDateRange({ from, to });
                      setAppliedDateRange({ from, to });
                    }}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Last 30 Days
                  </Button>

                  <Button
                    variant="outline"
                    className="cursor-pointer w-auto ml-auto gap-2 border-green-600 text-green-600 hover:text-green-800 hover:border-green-800 hover:bg-green-50 transition-all duration-300 hover:shadow-md rounded-full"
                    onClick={exportToExcel}
                    disabled={!hasData || isExporting}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    {isExporting ? "Exporting..." : "Export to Excel"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards - Animated */}
        <AnimatePresence>
          {showTable && hasData && (
            <motion.div
              initial={{ opacity: 0, y: -50 }} // dari atas
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }} // keluar ke bawah
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"
            >
              <Card className="border-0 shadow-md rounded-xl bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group overflow-hidden">
                <div className="h-1 bg-[#6D0000]" />
                <CardContent className="">
                  <div className="flex items-center justify-between">
                    <div className="rounded-full bg-[#6D0000]/10 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                      <BarChart3 className="h-6 w-6 text-[#6D0000]" />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-3xl font-bold text-[#6D0000] transition-all duration-300 group-hover:scale-105">
                        {totalOrderCount}
                      </span>
                      <span className="text-xs text-gray-500">orders</span>
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Total Orders
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    In selected period
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md rounded-xl bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group overflow-hidden">
                <div className="h-1 bg-blue-500" />
                <CardContent className="">
                  <div className="flex items-center justify-between">
                    <div className="rounded-full bg-blue-50 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                      <PieChart className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-3xl font-bold text-[#6D0000] transition-all duration-300 group-hover:scale-105">
                        {totalItemQuantity}
                      </span>
                      <span className="text-xs text-gray-500">items</span>
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Total Items
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Across all branches
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md rounded-xl bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group overflow-hidden">
                <div className="h-1 bg-amber-500" />
                <CardContent className="">
                  <div className="flex items-center justify-between">
                    <div className="rounded-full bg-amber-50 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                      <Store className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-3xl font-bold text-[#6D0000] transition-all duration-300 group-hover:scale-105">
                        {storeNames.length}
                      </span>
                      <span className="text-xs text-gray-500">branches</span>
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Active Branches
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    With orders in period
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <Card className="border-0 shadow-md rounded-xl bg-white overflow-hidden">
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence>
            {showTable ? (
              hasData ? (
                <motion.div
                  initial={{ opacity: 0, y: -50 }} // dari atas
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }} // keluar ke bawah
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <Card className="border-0 shadow-md rounded-xl bg-white overflow-hidden">
                    <CardContent className="p-0">
                      <div className="px-6 py-4 bg-gradient-to-r from-[#a52422] to-[#6D0000] text-white rounded-t-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-white/90" />
                            <h2 className="text-lg font-semibold text-white">
                              Orders Recap
                            </h2>
                          </div>
                          <Badge
                            variant="secondary"
                            className="px-3 py-1 bg-white/20 text-white border-white/30 transition-all duration-300 hover:scale-105"
                          >
                            {items.length} Products
                          </Badge>
                        </div>
                      </div>

                      <ScrollArea className="h-[calc(100vh-400px)] w-full">
                        <div className="p-0">
                          <Table>
                            <TableCaption className="mt-4 mb-2 text-gray-500">
                              Showing {items.length} food items across{" "}
                              {storeNames.length} branches
                            </TableCaption>
                            <TableHeader className="bg-gray-50">
                              <TableRow>
                                <TableHead className="w-24">Food ID</TableHead>
                                <TableHead>Item Name</TableHead>
                                <TableHead className="text-right w-28">
                                  Total
                                </TableHead>
                                {storeNames.map((store) => (
                                  <TableHead
                                    key={store}
                                    className="text-right whitespace-nowrap"
                                  >
                                    {store}
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {items.map(
                                ({
                                  itemName,
                                  storeQuantities,
                                  total,
                                  food_id,
                                }) => (
                                  <TableRow
                                    key={`${food_id}-${itemName}`}
                                    className="hover:bg-gray-50 transition-colors duration-200 group cursor-default"
                                  >
                                    <TableCell className="font-mono text-gray-600">
                                      {food_id}
                                    </TableCell>
                                    <TableCell className="font-medium text-gray-900 group-hover:text-[#6D0000] transition-colors duration-200">
                                      {itemName}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Badge
                                        variant="outline"
                                        className="font-semibold bg-[#6D0000]/5 text-[#6D0000] border-[#6D0000]/20 hover:bg-[#6D0000]/10 transition-colors duration-200"
                                      >
                                        {total}
                                      </Badge>
                                    </TableCell>
                                    {storeNames.map((store) => (
                                      <TableCell
                                        key={`${food_id}-${store}`}
                                        className="text-right"
                                      >
                                        {storeQuantities[store] ? (
                                          <span className="font-medium text-gray-700">
                                            {storeQuantities[store]}
                                          </span>
                                        ) : (
                                          <span className="text-gray-400">
                                            -
                                          </span>
                                        )}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                )
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: -50 }} // dari atas
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }} // keluar ke bawah
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <Card className="border-0 shadow-md rounded-xl bg-white overflow-hidden">
                    <CardContent className="p-0">
                      <div className="px-6 py-4 bg-[#6D0000] text-white">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-white/90" />
                          <h2 className="text-lg font-semibold text-white">
                            No Data Found
                          </h2>
                        </div>
                      </div>

                      <div className="p-6 flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                          <BarChart3 className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-lg font-medium text-gray-900 mb-2">
                          No orders found for the selected period
                        </p>
                        <p className="text-sm text-gray-500 mb-6 max-w-md text-center">
                          Try selecting a different date range or check if there
                          are any orders in the system.
                        </p>
                        <Button
                          variant="outline"
                          onClick={() =>
                            setAppliedDateRange({
                              from: undefined,
                              to: undefined,
                            })
                          }
                          className="border-[#6D0000]/20 text-[#6D0000] hover:bg-[#6D0000]/5 hover:border-[#6D0000] transition-all duration-200"
                        >
                          Reset Date Filter
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            ) : (
              !appliedDateRange.from && !appliedDateRange.to && <div></div>
            )}
          </AnimatePresence>
        )}
    </div>
  );
}
