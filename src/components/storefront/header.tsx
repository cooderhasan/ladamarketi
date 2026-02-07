"use client";

import { useState, useRef, useEffect, useMemo } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShoppingCart, User, Menu, LogOut, Package, Settings, LayoutDashboard, X, Phone, Zap, ChevronDown, Home, Car, Truck, Building2, Mail, Info, Cog } from "lucide-react";



import { signOut } from "next-auth/react";
import { useCartStore } from "@/stores/cart-store";
import type { UserRole, UserStatus } from "@prisma/client";
import { SearchInput } from "./search-input";
import { CategoryMenu } from "./category-menu";

interface Category {
    id: string;
    name: string;
    slug: string;
    parentId?: string | null;
    isInHeader?: boolean;
    headerOrder?: number;
    children?: Category[];
}

interface StorefrontHeaderProps {
    user?: {
        id: string;
        email: string;
        role: UserRole;
        status: UserStatus;
        companyName?: string | null;
        discountRate?: number;
    } | null;
    logoUrl?: string;
    siteName?: string;
    categories?: Category[];
    phone?: string;
    facebookUrl?: string;
    instagramUrl?: string;
    twitterUrl?: string;
    linkedinUrl?: string;
}

export function StorefrontHeader({ user, logoUrl, siteName, categories = [], phone, facebookUrl, instagramUrl, twitterUrl, linkedinUrl }: StorefrontHeaderProps) {
    const pathname = usePathname();
    const items = useCartStore((state) => state.items);
    const clearCart = useCartStore((state) => state.clearCart);
    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleMouseEnter = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setIsDropdownOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsDropdownOpen(false);
        }, 300);
    };

    const isAdmin = user?.role === "ADMIN" || user?.role === "OPERATOR";
    const isDealer = user?.role === "DEALER" && user?.status === "APPROVED";

    const categoryTree = useMemo(() => {
        return categories
            .filter(c => c.name !== "Root" && c.name !== "Home")
            .map(c => ({
                ...c,
                children: (c.children || []) as Category[]
            }));
    }, [categories]);

    return (
        <header className="sticky top-0 z-50 w-full bg-white dark:bg-gray-900 shadow-sm">

            {/* Top Row: Logo, Search, User Actions */}
            <div className="border-b dark:border-gray-800">
                <div className="container mx-auto px-4">
                    <div className="flex h-16 items-center justify-between gap-4">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2 shrink-0">
                            {logoUrl ? (
                                <img src={logoUrl} alt={siteName || "Logo"} className="h-10 w-auto object-contain" />
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center transform -rotate-3 shadow-lg">
                                        <span className="text-white font-extrabold text-xl">B</span>
                                    </div>
                                    <div className="flex flex-col leading-none">
                                        <span className="font-black text-2xl text-gray-900 dark:text-white tracking-tight uppercase">
                                            BAGAJ
                                        </span>
                                        <span className="font-bold text-sm text-orange-600 tracking-widest uppercase">
                                            LASTİĞİ
                                        </span>
                                    </div>
                                </div>
                            )}
                        </Link>

                        {/* Search - Center (Desktop) */}
                        <div className="flex-1 max-w-2xl mx-4 hidden md:block">
                            <SearchInput />
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-2 md:gap-4">
                            {/* Call Center (Desktop) */}
                            {phone && (
                                <a
                                    href={`tel:${phone.replace(/\s/g, '')}`}
                                    className="hidden lg:flex items-center gap-2 text-gray-600 hover:text-[#009AD0] transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
                                >
                                    <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
                                        <Phone className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-500 font-medium">Çağrı Merkezi</span>
                                        <span className="text-sm font-bold text-gray-900">{phone}</span>
                                    </div>
                                </a>
                            )}

                            {/* Social Media Icons (Desktop) */}
                            {(facebookUrl || instagramUrl || twitterUrl || linkedinUrl) && (
                                <div className="hidden lg:flex items-center gap-1 border-l pl-4 ml-2">
                                    {facebookUrl && (
                                        <a
                                            href={facebookUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-8 h-8 text-gray-500 hover:text-[#009AD0] hover:bg-[#009AD0]/10 rounded-full flex items-center justify-center transition-colors"
                                            title="Facebook"
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z" />
                                            </svg>
                                        </a>
                                    )}
                                    {instagramUrl && (
                                        <a
                                            href={instagramUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-8 h-8 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-full flex items-center justify-center transition-colors"
                                            title="Instagram"
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                            </svg>
                                        </a>
                                    )}
                                    {twitterUrl && (
                                        <a
                                            href={twitterUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-8 h-8 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors"
                                            title="X (Twitter)"
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                            </svg>
                                        </a>
                                    )}
                                    {linkedinUrl && (
                                        <a
                                            href={linkedinUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-8 h-8 text-gray-500 hover:text-[#009AD0] hover:bg-[#009AD0]/10 rounded-full flex items-center justify-center transition-colors"
                                            title="LinkedIn"
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                            </svg>
                                        </a>
                                    )}
                                </div>
                            )}

                            {/* User Panel */}
                            <div
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                                className="relative"
                            >
                                {!mounted ? (
                                    <button className="flex items-center gap-3 text-gray-700 hover:text-[#009AD0] transition-colors px-3 py-2 rounded-lg hover:bg-gray-100">
                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <div className="hidden sm:flex flex-col items-start">
                                            <span className="text-[10px] text-gray-500">Kullanıcı</span>
                                            <span className="text-sm font-semibold">Giriş Yap</span>
                                        </div>
                                    </button>
                                ) : (
                                    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen} modal={false}>
                                        <DropdownMenuTrigger asChild>
                                            <button className="flex items-center gap-3 text-gray-700 hover:text-[#009AD0] transition-colors px-3 py-2 rounded-lg hover:bg-gray-100 outline-none">
                                                <div className={`w-10 h-10 ${user ? 'bg-[#009AD0]/10' : 'bg-gray-100'} rounded-full flex items-center justify-center`}>
                                                    <User className={`h-5 w-5 ${user ? 'text-[#009AD0]' : ''}`} />
                                                </div>
                                                <div className="hidden sm:flex flex-col items-start">
                                                    <span className="text-[10px] text-gray-500">Kullanıcı</span>
                                                    <span className="text-sm font-semibold">
                                                        {user ? "Hesabım" : "Giriş Yap"}
                                                    </span>
                                                </div>
                                            </button>
                                        </DropdownMenuTrigger>

                                        {!user ? (
                                            <DropdownMenuContent align="end" className="w-[280px] p-4">
                                                <div className="flex flex-col gap-3">
                                                    <Link href="/login" className="w-full">
                                                        <Button variant="default" className="w-full">
                                                            Bayi Girişi
                                                        </Button>
                                                    </Link>
                                                    <Link href="/register" className="w-full">
                                                        <Button variant="outline" className="w-full">
                                                            Bayi Ol
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </DropdownMenuContent>
                                        ) : (
                                            <DropdownMenuContent align="end" className="w-56">
                                                <DropdownMenuLabel>
                                                    <div className="flex flex-col space-y-1">
                                                        <p className="text-sm font-medium">
                                                            {user.companyName || "Hoşgeldiniz"}
                                                        </p>
                                                        <p className="text-xs text-gray-500">{user.email}</p>
                                                    </div>
                                                </DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem asChild>
                                                    <Link href="/account">
                                                        <LayoutDashboard className="mr-2 h-4 w-4" />
                                                        Hesabım
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {isDealer && (
                                                    <>
                                                        <DropdownMenuItem asChild>
                                                            <Link href="/account/orders">
                                                                <Package className="mr-2 h-4 w-4" />
                                                                Siparişlerim
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                    </>
                                                )}
                                                {isAdmin && (
                                                    <>
                                                        <DropdownMenuItem asChild>
                                                            <Link href="/admin">
                                                                <Settings className="mr-2 h-4 w-4" />
                                                                Admin Panel
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                    </>
                                                )}
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => {
                                                        clearCart();
                                                        signOut({ callbackUrl: "/" });
                                                    }}
                                                >
                                                    <LogOut className="mr-2 h-4 w-4" />
                                                    Çıkış Yap
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        )}
                                    </DropdownMenu>
                                )}
                            </div>

                            {/* Cart - Visible for everyone */}
                            <Link href="/cart" className={cn(
                                "flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100 pl-4",
                                user && "border-l"
                            )}>
                                <div className="relative">
                                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                        <ShoppingCart className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white border-2 border-white">
                                        {mounted ? itemCount : 0}
                                    </span>
                                </div>
                                <div className="hidden sm:flex flex-col items-start">
                                    <span className="text-[10px] text-gray-500">Sepetim</span>
                                    <span className="text-sm font-bold text-orange-600">
                                        <CartTotalDisplay />
                                    </span>
                                </div>
                            </Link>

                            {/* Mobile Menu Toggle */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            >
                                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Category Navigation (Desktop) - STRIKING DESIGN */}
            <div
                className="hidden md:block relative overflow-hidden bg-gradient-to-r from-[#0081AF] via-[#009AD0] to-[#0081AF]"
            >
                {/* Glowing Line Effect */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#4FC3F7] to-transparent opacity-50" />
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#4FC3F7] to-transparent opacity-50" />

                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex items-center">


                        <nav className="flex items-center justify-center w-full py-3 gap-2 lg:gap-8">
                            <Link
                                href="/"
                                className="group flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:-translate-y-0.5"
                            >
                                <div className="p-2 rounded-lg bg-white/10 group-hover:bg-white/20 transition-all">
                                    <Home className="h-5 w-5 text-white group-hover:scale-110 transition-all" />
                                </div>
                                <span className="text-xs font-bold text-white group-hover:text-white transition-colors text-center whitespace-nowrap">Ana Sayfa</span>
                            </Link>
                            {categories
                                .filter(c => c.name !== "Home" && c.name !== "Root")
                                .map((category) => (
                                    <Link
                                        key={category.id}
                                        href={`/products?category=${category.slug}`}
                                        className="group flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:-translate-y-0.5"
                                    >
                                        <div className="p-2 rounded-lg bg-white/10 group-hover:bg-white/20 transition-all">
                                            <Cog className="h-5 w-5 text-white group-hover:scale-110 group-hover:rotate-45 transition-all" />
                                        </div>
                                        <span className="text-xs font-bold text-white group-hover:text-white transition-colors text-center whitespace-nowrap line-clamp-1 max-w-[120px]">
                                            {category.name}
                                        </span>
                                    </Link>
                                ))}
                            <Link
                                href="/about"
                                className="group flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:-translate-y-0.5"
                            >
                                <div className="p-2 rounded-lg bg-white/10 group-hover:bg-white/20 transition-all">
                                    <Building2 className="h-5 w-5 text-white group-hover:scale-110 transition-all" />
                                </div>
                                <span className="text-xs font-bold text-white group-hover:text-white transition-colors text-center whitespace-nowrap">Hakkımızda</span>
                            </Link>
                            <Link
                                href="/contact"
                                className="group flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:-translate-y-0.5"
                            >
                                <div className="p-2 rounded-lg bg-white/10 group-hover:bg-white/20 transition-all">
                                    <Phone className="h-5 w-5 text-white group-hover:scale-110 transition-all" />
                                </div>
                                <span className="text-xs font-bold text-white group-hover:text-white transition-colors text-center whitespace-nowrap">İletişim</span>
                            </Link>
                        </nav>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-b dark:border-gray-800 bg-white dark:bg-gray-900">
                    <div className="container mx-auto px-4 py-4 space-y-4">
                        {/* Mobile Search */}
                        <SearchInput />



                        {/* Mobile Quick Actions */}
                        <div className="grid grid-cols-2 gap-2">
                            <Link
                                href="/cart"
                                className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-orange-50 text-orange-700 font-bold text-sm"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <ShoppingCart className="h-4 w-4" />
                                Sepetim ({mounted ? itemCount : 0})
                            </Link>
                            <Link
                                href={user ? "/account" : "/login"}
                                className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-blue-50 text-blue-700 font-bold text-sm"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <User className="h-4 w-4" />
                                {user ? "Hesabım" : "Giriş Yap"}
                            </Link>
                        </div>

                        {/* Mobile Categories */}
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-gray-500 uppercase px-2">Kategoriler</p>
                            <Link
                                href="/products"
                                className="block px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Tüm Ürünler
                            </Link>
                            {categories.map((category) => (
                                <Link
                                    key={category.id}
                                    href={`/products?category=${category.slug}`}
                                    className="block px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {category.name}
                                </Link>
                            ))}
                        </div>

                        {/* Mobile Quick Links */}
                        <div className="border-t pt-4 space-y-1">
                            <Link
                                href="/about"
                                className="block px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Hakkımızda
                            </Link>
                            <Link
                                href="/contact"
                                className="block px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                İletişim
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}

function CartTotalDisplay() {
    const total = useCartStore((state) => state.getSummary().total);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const formattedTotal = new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(total);

    if (!mounted) {
        return (
            <>
                {new Intl.NumberFormat("tr-TR", {
                    style: "currency",
                    currency: "TRY",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                }).format(0)}
            </>
        );
    }

    return <>{formattedTotal}</>;
}
