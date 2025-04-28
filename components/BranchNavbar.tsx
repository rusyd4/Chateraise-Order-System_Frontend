"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function BranchNavbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [orderHistoryHover, setOrderHistoryHover] = useState(false);
  const [storeHover, setStoreHover] = useState(false);

  function goToStore() {
    router.push("/branch/store");
  }

  function goToOrderHistory() {
    router.push("/branch/order_history");
  }

  return (
    <nav className="bg-[#6D0000] text-white p-4 flex items-center justify-between max-w-7xl mx-auto rounded-b-2xl">
      <div className="cursor-pointer" onClick={() => router.push("/")}>
        <img src="/image-removebg-preview.png" alt="Logo" className="h-12" />
      </div>
      <div className="space-x-4">
        <button
          className={
            "px-3 py-2 rounded transition-transform duration-200 transform focus:outline-none focus:ring-2 focus:ring-[#6D0000] focus:ring-offset-2 " +
            (pathname === "/branch/store"
              ? "bg-white text-[#6D0000] shadow-md scale-105"
              : "hover:bg-white hover:text-[#6D0000] hover:scale-105")
          }
          onClick={goToStore}
          onMouseEnter={() => setStoreHover(true)}
          onMouseLeave={() => setStoreHover(false)}
        >
          <span className="inline-flex items-center space-x-2">
            <span>Store</span>
            <img
              src={pathname === "/branch/store" || storeHover ? "/Shopping_Bag_02_red.svg" : "/Shopping_Bag_02_white.svg"}
              alt="Store Icon"
              className="h-5 w-5"
            />
          </span>
        </button>
        <button
          className={
            "px-3 py-2 rounded transition-transform duration-200 transform focus:outline-none focus:ring-2 focus:ring-[#6D0000] focus:ring-offset-2 " +
            (pathname === "/branch/order_history"
              ? "bg-white text-[#6D0000] shadow-md scale-105"
              : "hover:bg-white hover:text-[#6D0000] hover:scale-105")
          }
          onClick={goToOrderHistory}
          onMouseEnter={() => setOrderHistoryHover(true)}
          onMouseLeave={() => setOrderHistoryHover(false)}
        >
          <span className="inline-flex items-center space-x-2">
            <span>Order History</span>
            <img
              src={pathname === "/branch/order_history" || orderHistoryHover ? "/OrderHistory_Red.svg" : "/OrderHistory_White.svg"}
              alt="Order History Icon"
              className="h-5 w-5"
            />
          </span>
        </button>
      </div>
    </nav>
  );
}
