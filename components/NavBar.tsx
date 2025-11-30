"use client";

import Link from "next/link";
import Image from "next/image";
import { Church, Users, Search, Menu, X, LogOut, ShieldCheck } from "lucide-react";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { usePageActions } from "@/contexts/PageActionsContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useSession, signOut } from "next-auth/react";

export default function NavBar() {
  const { title } = usePageTitle();
  const { searchQuery, setSearchQuery, filterButton, addButton, searchPlaceholder } = usePageActions();
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();

  const showActions = searchPlaceholder !== "";
  const isAdmin = (session?.user as any)?.role === "admin";

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-50">
      <div className="mx-auto px-4 lg:p-2 sm:px-6 lg:px-8">
        {/* Desktop Navigation */}
        <div className="hidden lg:flex justify-between items-center gap-4">
          <div className="flex items-center">
            <Link href="/" className="items-center space-x-2 block">
              <Image src="/FL-Logo.webp" alt="Church Directory Logo" width={120} height={120} />
            </Link>
          </div>

          {showActions && (
            <div className="  flex-1">
              <div className=" max-w-[300px] gap-2 flex items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10"
                  />
                </div>
                {filterButton}
                {addButton}
              </div>
            </div>
          )}

          {title && (
            <div className="flex items-center mx-auto">
              <h1 className="text-4xl font-bold">{title}</h1>
            </div>
          )}

          <div className="flex flex-1 ml-auto justify-end w-fit items-center space-x-2">
            <Link
              href="/churches"
              className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors m-0"
            >
              <Church className="h-4 w-4" />
              Campuses
            </Link>
            <Link
              href="/clergy"
              className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors m-0"
            >
              <Users className="h-4 w-4" />
              Pastors
            </Link>
            {isAdmin && (
              <Link
                href="/admin/users"
                className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors m-0"
              >
                <ShieldCheck className="h-4 w-4" />
                Admin
              </Link>
            )}
            {session && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-1"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden flex items-center justify-between py-2">
          <Link href="/" className="flex items-center">
            <Image src="/FL-Logo.webp" alt="Church Directory Logo" width={80} height={80} />
          </Link>

          {title && <h1 className="text-xl font-bold truncate mx-2">{title}</h1>}

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-auto">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] p-4">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-6">
                {/* Navigation Links */}
                <div className="flex flex-col gap-2">
                  <Link
                    href="/churches"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium hover:bg-muted transition-colors m-0"
                  >
                    <Church className="h-5 w-5" />
                    Campuses
                  </Link>
                  <Link
                    href="/clergy"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium hover:bg-muted transition-colors m-0"
                  >
                    <Users className="h-5 w-5" />
                    Pastors
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin/users"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium hover:bg-muted transition-colors m-0"
                    >
                      <ShieldCheck className="h-5 w-5" />
                      Admin
                    </Link>
                  )}
                  {session && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsOpen(false);
                        signOut({ callbackUrl: "/login" });
                      }}
                      className="flex items-center gap-2 px-4 py-3 ml-1.5 justify-start"
                    >
                      <LogOut className="h-5 w-5" />
                      Logout
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Mobile Search Bar (when actions are present) */}
        {showActions && (
          <div className="lg:hidden pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <div className="flex gap-2 mt-4 md:mt-2 justify-center md:justify-start ">
              {filterButton}
              {addButton}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
