"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const navItems = [
    { href: "/admin/dashboard", label: "Orders" },
    { href: "/admin/food", label: "Manage Products" },
    { href: "/admin/branch", label: "Manage Branch Stores" },
    { href: "/admin/recap", label: "Recap" },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex md:w-56 lg:w-64 flex-col border-r bg-background h-full">
        {/* Logo at the very top */}
        <div className="p-4 border-b">
          <Image
            src="/Chateraiselogo.png"
            alt="Chateraise Logo"
            width={180}
            height={180}
            className="object-contain w-full max-w-[180px] mx-auto"
          />
        </div>

        {/* Navigation items */}
        <div className="flex flex-col space-y-2 flex-grow p-4">
          {navItems.map((item) => (
            <Button
              key={item.href}
              asChild
              variant={pathname === item.href ? "default" : "ghost"}
              className={`justify-start ${pathname === item.href ? "bg-primary" : "hover:bg-accent"}`}
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </div>

        {/* Logout button */}
        <div className="p-4 border-t">
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full"
          >
            Logout
          </Button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed top-0 w-full bg-background border-b z-50">
        <div className="flex items-center justify-between p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 ml-2">
              {navItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link
                    href={item.href}
                    className={`w-full ${pathname === item.href ? "bg-accent" : ""}`}
                  >
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile logo - centered */}
          <Image
            src="/Chateraiselogo.png"
            alt="Chateraise Logo"
            width={180}
            height={32}
            className="object-contain h-8"
          />

          {/* Spacer for balance */}
          <div className="w-10"></div>
        </div>
      </div>
    </>
  );
}
