"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import apiFetch from "../../../lib/api";
import BranchNavbar from "../../components/BranchNavbar";
import { 
  Card, 
  CardContent, 
  CardFooter,
  CardHeader,
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter,
  SheetTrigger 
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Search, ShoppingCart, Plus, Minus, X, History } from "lucide-react";

interface FoodItem {
  food_id: number;
  food_name: string;
  description: string;
  price: number;
  image_url?: string;
}

interface CartItem extends FoodItem {
  quantity: number;
}

export default function BranchStore() {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const router = useRouter();

  function formatRupiah(price: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(price);
  }

  useEffect(() => {
    fetchFoodItems();
    // Load cart from localStorage if available
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse saved cart");
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  async function fetchFoodItems() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/branch/food-items");
      setFoodItems(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error");
      }
    } finally {
      setLoading(false);
    }
  }

  function addToCart(food: FoodItem) {
    setCart((prev) => {
      const existing = prev.find((item) => item.food_id === food.food_id);
      if (existing) {
        return prev.map((item) =>
          item.food_id === food.food_id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prev, { ...food, quantity: 1 }];
      }
    });
  }

  function removeFromCart(food: FoodItem) {
    setCart((prev) => {
      const existing = prev.find((item) => item.food_id === food.food_id);
      if (existing) {
        if (existing.quantity === 1) {
          return prev.filter((item) => item.food_id !== food.food_id);
        } else {
          return prev.map((item) =>
            item.food_id === food.food_id ? { ...item, quantity: item.quantity - 1 } : item
          );
        }
      }
      return prev;
    });
  }

  function removeItemCompletely(foodId: number) {
    setCart((prev) => prev.filter((item) => item.food_id !== foodId));
  }

  function getQuantity(food_id: number) {
    const item = cart.find((item) => item.food_id === food_id);
    return item ? item.quantity : 0;
  }

  function handleCheckout() {
    localStorage.setItem("cart", JSON.stringify(cart));
    router.push("/branch/checkout");
  }

  function goToOrderHistory() {
    router.push("/branch/order_history");
  }

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const filteredFoodItems = foodItems.filter((food) => {
    const name = food.food_name.toLowerCase();
    const term = searchTerm.toLowerCase();
    return name.includes(term);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <BranchNavbar />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Menu Items</h1>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search menu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-40 bg-white"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            </div>
            
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <Button variant="default" className="bg-[#6D0000] hover:bg-[#7a0000] relative">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  <span>Cart</span>
                  {totalItems > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-white text-[#6D0000] font-bold">
                      {totalItems}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Your Cart</SheetTitle>
                </SheetHeader>
                
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
                    <p className="text-gray-500">Your cart is empty</p>
                  </div>
                ) : (
                  <>
                    <ScrollArea className="h-[calc(100vh-220px)] mt-6">
                      {cart.map((item) => (
                        <div key={item.food_id} className="py-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-medium">{item.food_name}</h3>
                              <p className="text-sm text-gray-500">{formatRupiah(item.price)} each</p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => removeItemCompletely(item.food_id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between mt-2">
                            <p className="font-medium">
                              {formatRupiah(item.price * item.quantity)}
                            </p>
                            <div className="flex items-center space-x-2">
                              <Input 
                                type="number"
                                min="0"
                                value={item.quantity}
                                onChange={(e) => {
                                  const newQuantity = parseInt(e.target.value) || 0;
                                  
                                  if (newQuantity === 0) {
                                    // Remove from cart if quantity is 0
                                    removeItemCompletely(item.food_id);
                                  } else {
                                    // Update quantity directly
                                    setCart(prev => 
                                      prev.map(cartItem => 
                                        cartItem.food_id === item.food_id 
                                          ? { ...cartItem, quantity: newQuantity } 
                                          : cartItem
                                      )
                                    );
                                  }
                                }}
                                className="w-16 h-8 text-center"
                              />
                            </div>
                          </div>
                          <Separator className="mt-4" />
                        </div>
                      ))}
                    </ScrollArea>
                    
                    <SheetFooter className="mt-auto">
                      <div className="w-full space-y-4">
                        <div className="flex justify-between">
                          <span className="font-semibold">Total</span>
                          <span className="font-bold">{formatRupiah(totalPrice)}</span>
                        </div>
                        <Button 
                          className="w-full bg-[#6D0000] hover:bg-[#7a0000]"
                          onClick={() => {
                            handleCheckout();
                            setIsCartOpen(false);
                          }}
                        >
                          Proceed to Checkout
                        </Button>
                      </div>
                    </SheetFooter>
                  </>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-64 rounded-lg"></div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700">
            <p>{error}</p>
            <Button 
              variant="outline" 
              className="mt-2" 
              onClick={fetchFoodItems}
            >
              Try Again
            </Button>
          </div>
        ) : filteredFoodItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No items found matching "{searchTerm}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {filteredFoodItems.map((food) => (
<Card key={food.food_id} className="overflow-hidden transition-all hover:shadow-lg flex flex-col justify-between h-full">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-lg truncate" title={food.food_name}>
                    {food.food_name}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    ID: {food.food_id}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="p-4 pt-2">
                  <p className="font-medium text-lg">{formatRupiah(food.price)}</p>
                  {food.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{food.description}</p>
                  )}
                </CardContent>
                
                <CardFooter className="p-4 pt-0">
                  <div className="flex items-center justify-between w-full gap-2">
                    <Input 
                      type="number"
                      min="0"
                      value={getQuantity(food.food_id)}
                      onChange={(e) => {
                        const newQuantity = parseInt(e.target.value) || 0;
                        const currentQuantity = getQuantity(food.food_id);
                        
                        if (newQuantity === 0) {
                          // Remove from cart if quantity is 0
                          if (currentQuantity > 0) {
                            removeItemCompletely(food.food_id);
                          }
                        } else if (newQuantity > currentQuantity) {
                          // Add items to reach new quantity
                          for (let i = 0; i < newQuantity - currentQuantity; i++) {
                            addToCart(food);
                          }
                        } else if (newQuantity < currentQuantity) {
                          // Remove items to reach new quantity
                          const currentItem = cart.find(item => item.food_id === food.food_id);
                          if (currentItem) {
                            setCart(prev => 
                              prev.map(item => 
                                item.food_id === food.food_id 
                                  ? { ...item, quantity: newQuantity } 
                                  : item
                              )
                            );
                          }
                        }
                      }}
                      className="w-20 text-center"
                    />
                    <Button 
                      variant="default" 
                      className="flex-1 bg-[#6D0000] hover:bg-[#7a0000]"
                      onClick={() => addToCart(food)}
                    >
                      Add to Cart
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}