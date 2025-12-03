"use client";

import Link from "next/link";
import Image from "next/image";
import { Church, Users, Menu, LogOut, ShieldCheck, MoreVertical, Search } from "lucide-react";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { usePageActions } from "@/contexts/PageActionsContext";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useSession, signOut } from "next-auth/react";
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
} from "@/components/ui/alert-dialog";

export default function NavBar() {
  const { title } = usePageTitle();
  const { searchQuery, setSearchQuery, filterButton, addButton, searchPlaceholder, resultsCount, totalCount, activeFilters } =
    usePageActions();
  const [isOpen, setIsOpen] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { data: session } = useSession();

  const showActions = searchPlaceholder !== "";
  const isAdmin = (session?.user as any)?.role === "admin";
  const hasActiveFiltersOrSearch = (searchQuery || resultsCount !== null) && resultsCount !== totalCount;

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-50">
      <div className="mx-auto px-4 lg:p-2 sm:px-6 lg:px-8">
        {/* Desktop Navigation */}
        <div className="hidden lg:flex justify-between items-center gap-4 relative">
          <div className="flex items-center">
            <Link href="/" className="items-center block">
              <Image src="/FL-Logo.webp" alt="Church Directory Logo" width={100} height={120} />
            </Link>
          </div>

          {title && (
            <div
              className={
                title === "First Love Church"
                  ? "absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  : "flex items-center mx-auto gap-3"
              }
            >
              <h1
                className={`text-4xl font-bold whitespace-nowrap ${
                  title === "First Love Church"
                    ? "bg-linear-to-r from-purple-500 via-blue-500 to-cyan-500 bg-clip-text text-transparent text-5xl"
                    : ""
                }`}
              >
                {title}
              </h1>
              {hasActiveFiltersOrSearch && resultsCount !== null && totalCount !== null && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm">
                    {resultsCount} of {totalCount}
                  </Badge>
                  {activeFilters.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap max-w-md">
                      {activeFilters.slice(0, 3).map((filter, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {filter}
                        </Badge>
                      ))}
                      {activeFilters.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{activeFilters.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div
            className={
              title === "First Love Church"
                ? "flex ml-auto justify-end w-fit items-center gap-2"
                : "flex flex-1 ml-auto justify-end w-fit items-center gap-2"
            }
          >
            {showActions && (
              <>
                <div className="relative w-64 hidden lg:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10"
                  />
                </div>
                <div className="hidden lg:flex items-center gap-2">
                  {filterButton}
                  {addButton}
                </div>
              </>
            )}

            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56" align="end">
                <div className="flex flex-col gap-1">
                  <Link
                    href="/churches"
                    onClick={() => setIsPopoverOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors"
                  >
                    <Church className="h-4 w-4" />
                    Campuses
                  </Link>
                  <Link
                    href="/clergy"
                    onClick={() => setIsPopoverOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors"
                  >
                    <Users className="h-4 w-4" />
                    Pastors
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin/users"
                      onClick={() => setIsPopoverOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Admin
                    </Link>
                  )}
                  {session && (
                    <>
                      <div className="h-px bg-border my-1" />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            className="flex items-center gap-2 px-3 py-2 justify-start h-auto font-medium"
                          >
                            <LogOut className="h-4 w-4" />
                            Logout
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                            <AlertDialogDescription>You will be redirected to the login page.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden flex items-center justify-between py-2">
          <Link href="/" className="flex items-center">
            <Image src="/FL-Logo.webp" alt="Church Directory Logo" width={80} height={80} />
          </Link>

          {title && (
            <div className="flex items-center gap-2">
              <h1
                className={`text-xl md:text-3xl font-bold ${
                  title === "First Love Church"
                    ? "bg-linear-to-r from-purple-500 via-blue-500 to-cyan-500 bg-clip-text text-transparent "
                    : "truncate"
                }`}
              >
                {title}
              </h1>
              {hasActiveFiltersOrSearch && resultsCount !== null && totalCount !== null && (
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {resultsCount}/{totalCount}
                  </Badge>
                  {activeFilters.length > 0 && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      {activeFilters.length} {activeFilters.length === 1 ? "filter" : "filters"}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
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
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" className="flex items-center gap-2 px-4 py-3 ml-1.5 justify-start">
                            <LogOut className="h-5 w-5" />
                            Logout
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                            <AlertDialogDescription>You will be redirected to the login page.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                setIsOpen(false);
                                handleLogout();
                              }}
                            >
                              Logout
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
