"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiFetch from "../../../lib/api";
import BranchNavbar from "../../components/BranchNavbar";
import { Calendar } from "@/components/ui/calendar";
import * as XLSX from "xlsx";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { DateRange } from "react-day-picker";
import { format, addDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Download, Calendar as CalendarIcon, X, Check, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { motion, AnimatePresence } from "framer-motion";

interface OrderItem {
  food_name: string;
  quantity: number;
  price: number;
}

interface Order {
  order_id: number;
  delivery_date: string;
  order_date: string;
  order_status: string; // added order_status
  items: OrderItem[];
}

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });

  const router = useRouter();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (appliedDateRange?.from && appliedDateRange?.to) {
      const filtered = orders.filter((order) => {
        const orderDate = new Date(order.order_date);
        return (
          orderDate >= appliedDateRange.from! &&
          orderDate <= appliedDateRange.to!
        );
      });
      setFilteredOrders(filtered);
    } else {
      setFilteredOrders(orders);
    }
  }, [appliedDateRange, orders]);

  async function fetchOrders() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/branch/orders");
      setOrders(data);
      setFilteredOrders(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  }

  // Get unique dates and organize them by date
  const ordersByDate = filteredOrders.reduce((acc, order) => {
    const orderDate = new Date(order.order_date).toISOString().slice(0, 10);
    if (!acc[orderDate]) {
      acc[orderDate] = [];
    }
    acc[orderDate].push(order);
    return acc;
  }, {} as { [date: string]: Order[] });

  // Get unique dates sorted
  const uniqueDates = Object.keys(ordersByDate).sort();

  // Get dominant status for each date
  const getStatusForDate = (date: string) => {
    const ordersOnDate = ordersByDate[date] || [];
    if (ordersOnDate.length === 0) return "none";

    // Count occurrences of each status
    const statusCounts = ordersOnDate.reduce((acc, order) => {
      acc[order.order_status] = (acc[order.order_status] || 0) + 1;
      return acc;
    }, {} as { [status: string]: number });

    // Find status with most occurrences
    let maxCount = 0;
    let dominantStatus = "none";

    for (const [status, count] of Object.entries(statusCounts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantStatus = status;
      }
    }

    return dominantStatus.toLowerCase();
  };

  // Get background color based on status
  const getStatusColorClass = (date: string) => {
    const status = getStatusForDate(date);
    switch (status) {
      case "pending":
        return "bg-orange-100";
      case "in-progress":
        return "bg-blue-100";
      case "finished":
        return "bg-green-100";
      default:
        return "";
    }
  };

  interface FoodAggregate {
    food_name: string;
    price: number;
    totalQty: number;
    qtyByDate: { [date: string]: number };
  }

  const foodMap: { [foodName: string]: FoodAggregate } = {};

  filteredOrders.forEach((order) => {
    const orderDate = new Date(order.order_date).toISOString().slice(0, 10);
    order.items.forEach((item) => {
      if (!foodMap[item.food_name]) {
        foodMap[item.food_name] = {
          food_name: item.food_name,
          price: item.price,
          totalQty: 0,
          qtyByDate: {},
        };
      }
      foodMap[item.food_name].totalQty += item.quantity;
      foodMap[item.food_name].qtyByDate[orderDate] =
        (foodMap[item.food_name].qtyByDate[orderDate] || 0) + item.quantity;
    });
  });

  const foodAggregates = Object.values(foodMap).sort((a, b) => a.food_name.localeCompare(b.food_name));

  function exportToExcel() {
    const wsData = [];

    // Header rows
    wsData.push(["", "", "Order Date", ...uniqueDates]);
    wsData.push([
      "",
      "",
      "",
      ...uniqueDates.map((date) =>
        new Date(date).toLocaleDateString(undefined, {
          day: "2-digit",
          month: "short",
        })
      ),
    ]);
    wsData.push([
      "",
      "",
      "Delivery Date",
      ...uniqueDates.map((date) => {
        const orderDate = new Date(date);
        orderDate.setDate(orderDate.getDate() + 2);
        return orderDate.toLocaleDateString(undefined, {
          day: "2-digit",
          month: "short",
        });
      }),
    ]);
    wsData.push(["Food Items", "Price", "Total Quantity", ...uniqueDates]);

    // Data rows
    foodAggregates.forEach((food) => {
      const row = [
        food.food_name,
        new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
        }).format(food.price),
        food.totalQty,
        ...uniqueDates.map((date) => food.qtyByDate[date] || 0),
      ];
      wsData.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Order History");
    XLSX.writeFile(wb, "order_history.xlsx");
  }

  const isLast7DaysSelected =
    appliedDateRange?.from !== undefined &&
    appliedDateRange?.to !== undefined &&
    (() => {
      const now = new Date();
      const last7From = new Date();
      last7From.setDate(now.getDate() - 7);
      // Normalize dates for comparison
      const appliedFrom = new Date(appliedDateRange.from!);
      const appliedTo = new Date(appliedDateRange.to!);
      appliedFrom.setHours(0, 0, 0, 0);
      appliedTo.setHours(23, 59, 59, 999);
      last7From.setHours(0, 0, 0, 0);
      now.setHours(23, 59, 59, 999);
      return (
        appliedFrom.getTime() === last7From.getTime() &&
        appliedTo.getTime() === now.getTime()
      );
    })();

  const isLast30DaysSelected =
    appliedDateRange?.from !== undefined &&
    appliedDateRange?.to !== undefined &&
    (() => {
      const now = new Date();
      const last30From = new Date();
      last30From.setDate(now.getDate() - 30);
      // Normalize dates for comparison
      const appliedFrom = new Date(appliedDateRange.from!);
      const appliedTo = new Date(appliedDateRange.to!);
      appliedFrom.setHours(0, 0, 0, 0);
      appliedTo.setHours(23, 59, 59, 999);
      last30From.setHours(0, 0, 0, 0);
      now.setHours(23, 59, 59, 999);
      return (
        appliedFrom.getTime() === last30From.getTime() &&
        appliedTo.getTime() === now.getTime()
      );
    })();

  return (
    <>
      <BranchNavbar />
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Order History</h1>
            <p className="text-sm text-muted-foreground">
              View and manage your order history
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="cursor-pointer w-full sm:w-auto">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            <div className="flex gap-2 items-center">
              <Button
                onClick={() => setAppliedDateRange(dateRange)}
                variant="default"
                size="sm"
                className="cursor-pointer bg-[#6D0000] gap-1"
              >
                <Check className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Apply
                </span>
              </Button>
              <Button
                onClick={() => {
                  setDateRange({ from: undefined, to: undefined });
                  setAppliedDateRange({ from: undefined, to: undefined });
                }}
                variant="outline"
                size="sm"
                className="cursor-pointer gap-1"
              >
                <X className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Reset
                </span>
              </Button>

              <Button
                className={`cursor-pointer w-auto rounded-full border border-[#6D0000] text-[#6D0000] hover:bg-[#6D0000] hover:text-white transition-all duration-200 hover:shadow-md ${isLast7DaysSelected
                    ? "bg-[#6D0000] text-white"
                    : "bg-white text-[#6D0000]"
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
                className={`cursor-pointer w-auto rounded-full border border-[#6D0000] text-[#6D0000] hover:bg-[#6D0000] hover:text-white transition-all duration-200 hover:shadow-md ${isLast30DaysSelected
                    ? "bg-[#6D0000] text-white"
                    : "bg-white text-[#6D0000]"
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
                onClick={exportToExcel}
                variant="outline"
                size="sm"
                disabled={!appliedDateRange?.from || !appliedDateRange?.to}
                className={`cursor-pointer w-auto ml-auto gap-2 border-green-600 text-green-600 transition-all duration-300 rounded-full
                  ${!appliedDateRange?.from || !appliedDateRange?.to
                    ? "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-green-600 hover:border-green-600 hover:shadow-none"
                    : "hover:text-green-800 hover:border-green-800 hover:bg-green-50 hover:shadow-md"
                  }
                `}
              >
                <Download className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Export to Excel
                </span>
              </Button>
            </div>
          </div>
        </div>

        {/* Status Legend */}
        <div className="flex items-center gap-4 mt-4 bg-gray-50 p-3 rounded-lg border shadow-sm">
          <div className="flex items-center gap-1">
            <Info size={16} className="text-slate-500" />
            <span className="text-sm font-medium">Status Legend:</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-orange-100 border border-orange-200"></div>
              <span className="text-xs">Pending</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-blue-100 border border-blue-200"></div>
              <span className="text-xs">In-progress</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-green-100 border border-green-200"></div>
              <span className="text-xs">Finished</span>
            </div>
          </div>
        </div>

        {!appliedDateRange?.from || !appliedDateRange?.to ? (
          <p className="text-center text-sm text-muted-foreground mt-8">
            Please select a date range to display the table.
          </p>
        ) : (
          <>
            <Badge variant="secondary" className="text-sm font-normal">
              Showing orders from {format(appliedDateRange.from, "MMM d, yyyy")} to{" "}
              {format(appliedDateRange.to, "MMM d, yyyy")}
            </Badge>

            <AnimatePresence>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : error ? (
                <Card className="bg-destructive/10 border-destructive">
                  <CardHeader>
                    <CardTitle>Error loading orders</CardTitle>
                    <CardDescription>{error}</CardDescription>
                  </CardHeader>
                </Card>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: -50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead colSpan={3}></TableHead>
                              <TableHead
                                colSpan={uniqueDates.length}
                                className="text-center border"
                              >
                                Order Date
                              </TableHead>
                            </TableRow>
                            <TableRow>
                              <TableHead colSpan={3}></TableHead>
                              {uniqueDates.map((date) => (
                                <TableHead
                                  key={date}
                                  className={`text-center border ${getStatusColorClass(date)}`}
                                >
                                  {new Date(date).toLocaleDateString(undefined, {
                                    day: "2-digit",
                                    month: "short",
                                  })}
                                </TableHead>
                              ))}
                            </TableRow>
                            <TableRow>
                              <TableHead colSpan={3}></TableHead>
                              <TableHead
                                colSpan={uniqueDates.length}
                                className="text-center border"
                              >
                                Delivery Date
                              </TableHead>
                            </TableRow>
                            <TableRow>
                              <TableHead className="border">Food Items</TableHead>
                              <TableHead className="border">Price</TableHead>
                              <TableHead className="border">Total Quantity</TableHead>
                              {uniqueDates.map((date) => {
                                const deliveryDate = addDays(new Date(date), 2);
                                return (
                                  <TableHead
                                    key={"qty-" + date}
                                    className={`border ${getStatusColorClass(date)}`}
                                  >
                                    {deliveryDate.toLocaleDateString(undefined, {
                                      day: "2-digit",
                                      month: "short",
                                    })}
                                  </TableHead>
                                );
                              })}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {foodAggregates.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={3 + uniqueDates.length}
                                  className="text-center py-4"
                                >
                                  No orders found for the selected date range.
                                </TableCell>
                              </TableRow>
                            ) : (
                              foodAggregates.map((food) => (
                                <TableRow
                                  key={food.food_name}
                                  className="hover:bg-muted/50"
                                >
                                  <TableCell className="border">
                                    {food.food_name}
                                  </TableCell>
                                  <TableCell className="border">
                                    {new Intl.NumberFormat("id-ID", {
                                      style: "currency",
                                      currency: "IDR",
                                    }).format(food.price)}
                                  </TableCell>
                                  <TableCell className="border">
                                    {food.totalQty}
                                  </TableCell>
                                  {uniqueDates.map((date) => (
                                    <TableCell
                                      key={date}
                                      className={`border ${getStatusColorClass(date)}`}
                                    >
                                      {food.qtyByDate[date] || 0}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </>
  );
}