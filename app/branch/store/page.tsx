"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import apiFetch, { API_BASE_URL } from "../../../lib/api";
import BranchNavbar from "../../components/BranchNavbar";
import { 
  Card, 
  CardHeader,
  CardTitle, 
  CardDescription,
  CardContent
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
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  X, 
  ArrowRight,
  ChevronUp,
  MenuIcon,
  ShoppingBag
} from "lucide-react";

interface FoodItem {
  food_id: number;
  food_name: string;
  description: string;
  price: number;
  food_image?: string | null;
}

interface CartItem extends FoodItem {
  quantity: number;
}

const SearchBar = ({ 
  className = "",
  searchTerm,
  setSearchTerm 
}: {
  className?: string;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={`relative ${className}`}>
      <Input
        ref={inputRef}
        type="text"
        placeholder="Search product..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10 pr-3 py-2 w-full bg-white/90 backdrop-blur-sm border-none rounded-full shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-accent"
        aria-label="Search for menu items"
      />
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary h-4 w-4" />
      {searchTerm && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 rounded-full"
          onClick={() => {
            setSearchTerm("");
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};

export default function BranchStore() {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const router = useRouter();

  // Theme Colors - Defining them here for easy access
  const colors = {
    primary: "#8B1E3F",        // Deep burgundy
    secondary: "#5E1224",      // Darker burgundy
    accent: "#DB4C40",         // Bright rust/coral accent
    background: "#F9F1F2",     // Pale pink background
    card: "#FFFFFF",           // White card background
    text: "#2D1A20",           // Very dark burgundy text
    lightText: "#6D5A5F",      // Medium burgundy-gray text
    success: "#5F9E64",        // Muted green success
    highlight: "#FCF0ED",      // Light coral highlight
    gold: "#C89F65"            // Gold accent for premium feel
  };

  function formatRupiah(price: number): string {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    }).format(price);
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
    
    // Check screen size
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };
    
    // Listen for scroll events
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    
    // Initial check
    checkScreenSize();
    
    // Add event listeners
    window.addEventListener('resize', checkScreenSize);
    window.addEventListener('scroll', handleScroll);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', checkScreenSize);
      window.removeEventListener('scroll', handleScroll);
    };
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
      console.log("Fetched food items:", data);
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

  const addToCart = useCallback((food: FoodItem) => {
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
  }, []);

  const removeFromCart = useCallback((food: FoodItem) => {
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
  }, []);

  const removeItemCompletely = useCallback((foodId: number) => {
    setCart((prev) => prev.filter((item) => item.food_id !== foodId));
  }, []);

  const getQuantity = useCallback((food_id: number) => {
    const item = cart.find((item) => item.food_id === food_id);
    return item ? item.quantity : 0;
  }, [cart]);

  function handleCheckout() {
    localStorage.setItem("cart", JSON.stringify(cart));
    router.push("/branch/checkout");
  }

  const totalItems = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);
  const totalPrice = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);

  const filteredFoodItems = useMemo(() => foodItems.filter((food) => {
    const name = food.food_name.toLowerCase();
    const term = searchTerm.toLowerCase();
    const idStr = food.food_id.toString();
    return name.includes(term) || idStr.includes(term);
  }), [foodItems, searchTerm]);

  // Function to scroll back to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  // Cart component that works for both mobile and desktop
  const CartComponent = ({ isMobile = false }) => (
    <div className="w-full h-full flex flex-col">
      <SheetHeader className="mb-4">
        <SheetTitle className="text-2xl font-bold" style={{ color: colors.primary }}>
          Your Cart
        </SheetTitle>
      </SheetHeader>
      
      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full py-12">
          <div className="p-6 rounded-full mb-4" style={{ background: colors.highlight }}>
            <ShoppingBag className="h-12 w-12" style={{ color: colors.primary }} />
          </div>
          <p style={{ color: colors.primary }} className="text-lg text-center">
            Your cart is empty
          </p>
          <p className="text-sm mt-2 text-center" style={{ color: colors.lightText }}>
            Add some delicious items to get started
          </p>
          <SheetClose asChild>
            <Button 
              className="mt-6 cursor-pointer"
              style={{ 
                background: colors.primary,
                color: 'white',
              }}
            >
              Browse Menu
            </Button>
          </SheetClose>
        </div>
      ) : (
        <>
          <ScrollArea className={`${isMobile ? 'h-[50vh]' : 'h-[calc(100vh-220px)]'} mt-2 mx-2 px-1`}>
            {cart.map((item) => (
              <div 
                key={item.food_id} 
                className="py-3 px-3 mb-3 rounded-lg"
                style={{ 
                  background: colors.card,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 mr-2">
                    <h3 className="font-medium line-clamp-1" style={{ color: colors.text }}>
                      {item.food_name}
                    </h3>
                    <p className="text-xs" style={{ color: colors.lightText }}>
                      {formatRupiah(item.price)} each
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-7 w-7 rounded-full hover:bg-red-50"
                    style={{ color: colors.lightText }}
                    onClick={() => removeItemCompletely(item.food_id)}
                    aria-label="Remove item"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <p className="font-bold text-sm" style={{ color: colors.primary }}>
                    {formatRupiah(item.price * item.quantity)}
                  </p>
                  <div className="flex items-center space-x-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 rounded-full hover:bg-red-50"
                      style={{ 
                        borderColor: colors.primary, 
                        color: colors.primary
                      }}
                      onClick={() => removeFromCart(item)}
                      disabled={item.quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center font-medium text-sm" style={{ color: colors.text }}>
                      {item.quantity}
                    </span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 rounded-full hover:bg-red-50"
                      style={{ 
                        borderColor: colors.primary, 
                        color: colors.primary
                      }}
                      onClick={() => addToCart(item)}
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </ScrollArea>
          
          <div className="mt-auto pt-4 px-2 w-full space-y-3">
            <div className="flex justify-between p-3 rounded-lg" style={{ 
              background: colors.highlight
            }}>
              <span className="font-semibold" style={{ color: colors.primary }}>Total</span>
              <span className="font-bold" style={{ color: colors.primary }}>
                {formatRupiah(totalPrice)}
              </span>
            </div>
            <Button 
              className="cursor-pointer w-full flex items-center justify-center gap-2 h-10 rounded-full text-base font-medium transition-all duration-300 shadow-md hover:shadow-lg"
              style={{ 
                background: `linear-gradient(135deg, ${colors.accent}, ${colors.primary})`,
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)'
              }}
              onClick={() => {
                handleCheckout();
                setIsCartOpen(false);
              }}
            >
              <span>Checkout</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: colors.background }}>
      {/* Header - Sticks to top with shadow effect */}
      <div 
        className={`bg-gradient-to-r from-[#a52422] to-[#6D0000] sticky top-0 z-50 transition-shadow duration-300 ${scrollPosition > 10 ? 'shadow-lg' : ''}`} 
      >
        <BranchNavbar />
        
        {/* Search bar and cart icon - side by side on both mobile and desktop */}
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center gap-3">
            <SearchBar 
              key="main-search-bar"
              className="flex-grow max-w-[280px]" 
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
            
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="default" 
                  className="cursor-pointer relative rounded-full px-3 py-3 shadow-md transition-all duration-300"
                  style={{
                    background: colors.accent,
                    color: 'white',
                  }}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {totalItems > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-white text-black text-xs h-5 w-5 flex items-center justify-center p-0 rounded-full">
                      {totalItems}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-md border-l-0 p-4" style={{ 
                background: colors.background,
                boxShadow: `-5px 0 15px rgba(139,30,63,0.1)`
              }}>
                <CartComponent />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      
      {/* Main content area */}
      <main className="flex-grow container mx-auto px-4 py-6">
        {loading ? (
          // Responsive loading skeleton
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 animate-pulse">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="bg-white h-48 sm:h-56 md:h-60 rounded-lg shadow"></div>
                <div className="h-4 bg-white rounded w-3/4"></div>
                <div className="h-3 bg-white rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          // Error state with retry button
          <div className="bg-red-50 p-4 sm:p-6 rounded-lg border border-red-200 text-red-600 shadow-md max-w-lg mx-auto">
            <p className="font-medium text-center mb-4">{error}</p>
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                className="border-red-400 text-red-500 hover:bg-red-100" 
                onClick={fetchFoodItems}
              >
                Try Again
              </Button>
            </div>
          </div>
        ) : filteredFoodItems.length === 0 ? (
          // No search results state
          <div className="text-center py-12">
            <div className="bg-white p-6 rounded-lg inline-block shadow-md">
              <Search className="h-12 w-12 mx-auto mb-3" style={{ color: colors.primary }} />
              <p className="text-base" style={{ color: colors.primary }}>
                No items found matching {searchTerm}
              </p>
              <Button 
                variant="ghost"
                className="mt-3"
                style={{ color: colors.accent }}
                onClick={() => setSearchTerm("")}
              >
                Clear Search
              </Button>
            </div>
          </div>
        ) : (
          // Food items grid - responsive columns based on screen size
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {filteredFoodItems.map((food) => (
              <Card 
                key={food.food_id} 
                className="overflow-hidden transition-all duration-300 shadow hover:shadow-md group flex flex-col rounded-xl border-0 p-0" 
                style={{ 
                  background: colors.card,
                  borderColor: 'rgba(139, 30, 63, 0.1)'
                }}
              >
                {/* Image section - taller height, fills the top of the card with no gaps */}
                <div className="relative w-full h-40 sm:h-48 md:h-52 lg:h-56 overflow-hidden rounded-t-xl">
                  {/* Badge showing quantity if in cart */}
                  {getQuantity(food.food_id) > 0 && (
                    <Badge 
                      className="absolute top-2 right-2 z-10 h-5 px-1.5 flex items-center justify-center text-xs font-bold"
                      style={{ background: colors.accent, color: 'white' }}
                    >
                      {getQuantity(food.food_id)}
                    </Badge>
                  )}
                  
                  {food.food_image ? (
                    <img 
                      src={`${API_BASE_URL}/uploads/food_images/${food.food_image}`} 
                      alt={food.food_name} 
                      className="w-full h-full object-cover block"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"
                      style={{ 
                        background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.secondary})`,
                      }}>
                      <span className="text-white text-2xl sm:text-3xl font-bold">{food.food_name.charAt(0)}</span>
                    </div>
                  )}
                </div>

                {/* Card content - product details */}
                <div className="flex flex-col flex-grow p-3">
                  <CardTitle className="text-sm sm:text-base line-clamp-2 mb-1" style={{ color: colors.text }} title={food.food_name}>
                    {food.food_name}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mb-2" style={{ color: colors.lightText }}>
                    ID: {food.food_id}
                  </p>
                  <p className="font-bold py-1 px-2.5 rounded-full text-xs inline-block mb-3 self-start"
                    style={{ 
                      background: colors.highlight,
                      color: colors.primary
                    }}>
                    {formatRupiah(food.price)}
                  </p>
                
                  {/* Card actions - positioned at bottom */}
                  <div className="mt-auto">
                    {getQuantity(food.food_id) === 0 ? (
                      // Add to cart button when item is not in cart
                      <Button 
                        variant="default" 
                        className="cursor-pointer w-full py-1.5 text-sm rounded-full shadow group-hover:shadow-md transition-all duration-300"
                        style={{ 
                          background: `linear-gradient(135deg, ${colors.accent}, ${colors.primary})`,
                          color: 'white',
                        }}
                        onClick={() => addToCart(food)}
                      >
                        Add to Cart
                      </Button>
                    ) : (
                      // Quantity controls when item is in cart
                      <div className="flex items-center justify-between w-full gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="cursor-pointer h-7 w-7 rounded-full"
                          style={{ 
                            borderColor: colors.primary, 
                            color: colors.primary
                          }}
                          onClick={() => removeFromCart(food)}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <Input
                          type="text"
                          min={1}
                          className="flex-grow text-center text-sm font-medium py-1"
                          style={{ color: colors.primary, paddingTop: '0.25rem', paddingBottom: '0.25rem' }}
                          value={getQuantity(food.food_id)}
                          onChange={(e) => {
                            const value = parseInt(e.target.value, 10);
                            if (!isNaN(value) && value > 0) {
                              setCart((prev) =>
                                prev.map((item) =>
                                  item.food_id === food.food_id ? { ...item, quantity: value } : item
                                )
                              );
                            }
                          }}
                        />
                        
                        <Button
                          size="icon"
                          variant="outline"
                          className="cursor-pointer h-7 w-7 rounded-full"
                          style={{ 
                            borderColor: colors.primary, 
                            color: colors.primary
                          }}
                          onClick={() => addToCart(food)}
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
      
      {/* "Back to top" button - appears when scrolled down */}
      {scrollPosition > 300 && (
        <Button
          className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full shadow-lg hover:shadow-xl"
          style={{
            background: colors.primary,
            color: 'white'
          }}
          onClick={scrollToTop}
          aria-label="Back to top"
        >
          <ChevronUp className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}