"use client";

import { useState, useRef, useEffect, useMemo } from "react";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
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
import { ShoppingCart, ShoppingBag, User, Menu, LogOut, Package, Settings, LayoutDashboard, X, Phone, Zap, ChevronDown, Home, Car, Truck, Building2, Mail, Info, Plus, Minus, ChevronRight } from "lucide-react";



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
    sidebarCategories?: Category[];
}

/** Telefonu okunaklı göster: 05345194472 / 5388168400 -> 0534 519 44 72 / 0538 816 84 00 */
function displayPhone(digits: string) {
    const d = digits.length === 10 ? "0" + digits : digits;
    if (d.length === 11 && d.startsWith("0")) return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9)}`;
    return digits;
}

export function StorefrontHeader({ user, logoUrl, siteName, categories = [], sidebarCategories = [], phone, facebookUrl, instagramUrl, twitterUrl, linkedinUrl }: StorefrontHeaderProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const items = useCartStore((state) => state.items);
    const clearCart = useCartStore((state) => state.clearCart);
    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
    // "0534 519 44 72 - 538 816 84 00" -> ["05345194472", "05388168400"]
    const phoneNumbers = (phone || "")
        .split(/\s[-/|,]\s|\s*[/|,]\s*/)
        .map((p) => p.replace(/\D/g, ""))
        .filter((p) => p.length >= 10)
        .map((p) => (p.length === 10 ? "0" + p : p));
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Auto-close mobile menu on navigation
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname, searchParams]);
    const [mounted, setMounted] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Akıllı sabit header (Bardakçı Bike ile aynı): aşağı kaydırırken gizlenir (ürünlere yer açılır),
    // yukarı kaydırınca hemen geri gelir. Sayfanın en üstünde her zaman görünür.
    const [headerHidden, setHeaderHidden] = useState(false);
    useEffect(() => {
        // requestAnimationFrame'e bağlı değil: arka plandaki sekmede rAF durunca header takılı kalmasın
        let lastY = window.scrollY;
        const onScroll = () => {
            const y = window.scrollY;
            if (y < 160) setHeaderHidden(false);
            else if (y > lastY + 8) setHeaderHidden(true);
            else if (y < lastY - 8) setHeaderHidden(false);
            if (Math.abs(y - lastY) > 8 || y < 160) lastY = y;
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Sayfadaki yapışan paneller (ana sayfa kategori menüsü, sepet/ödeme özeti) header'ı izlesin: header görünürken
    // altına, gizliyken ekranın üstüne yapışır (--sticky-top). Önceden sabit 128px'te kalıyordu; header gizlenince
    // üstte boşluk oluşuyordu
    const headerRef = useRef<HTMLElement>(null);
    const headerShown = !(headerHidden && !isMobileMenuOpen && !isDropdownOpen);
    useEffect(() => {
        const el = headerRef.current;
        if (!el) return;
        const update = () => {
            document.documentElement.style.setProperty("--sticky-top", headerShown ? `${el.offsetHeight + 16}px` : "16px");
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, [headerShown]);

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

    // Use sidebar categories for mobile menu (all 11 categories with subcategories)
    const mobileCategoryTree = useMemo(() => {
        const source = sidebarCategories.length > 0 ? sidebarCategories : categories;
        return source
            .filter(c => c.name !== "Root" && c.name !== "Home")
            .map(c => ({
                ...c,
                children: (c.children || []) as Category[]
            }));
    }, [sidebarCategories, categories]);

    return (
        <header
            ref={headerRef}
            className={cn(
                "sticky top-0 z-50 w-full bg-white/95 supports-[backdrop-filter]:bg-white/80 dark:bg-gray-900/95 supports-[backdrop-filter]:dark:bg-gray-900/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 dark:border-gray-800/50 transition-transform duration-300",
                // Mobil menü veya hesap menüsü açıkken gizlenmez
                headerHidden && !isMobileMenuOpen && !isDropdownOpen ? "-translate-y-full" : "translate-y-0"
            )}
        >

            {/* Top Row: Logo, Search, User Actions */}
            <div className="border-b dark:border-gray-800/50">
                <div className="container mx-auto px-4">
                    <div className="flex h-16 lg:h-20 items-center justify-between gap-2 lg:gap-6">
                        {/* Left: Logo + Phone */}
                        <div className="flex items-center gap-4 shrink-0">
                            {/* Logo */}
                            <Link href="/" className="flex items-center gap-2 group">
                                {logoUrl ? (
                                    <div className="relative h-10 md:h-14 w-auto aspect-[3/1] transition-transform duration-300 group-hover:scale-105">
                                        <Image
                                            src={logoUrl}
                                            alt={siteName || "Logo"}
                                            fill
                                            className="object-contain"
                                            sizes="(max-width: 768px) 120px, 160px"
                                            priority
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 transition-transform duration-300 group-hover:scale-105">
                                        <div className="w-10 h-10 md:w-14 md:h-14 bg-[#009AD0] rounded-xl flex items-center justify-center transform -rotate-3 shadow-lg group-hover:rotate-0 transition-transform">
                                            <span className="text-white font-extrabold text-xl md:text-3xl">L</span>
                                        </div>
                                        <div className="flex flex-col leading-none">
                                            <span className="font-black text-xl md:text-3xl text-gray-900 dark:text-white tracking-tight uppercase">
                                                LADA
                                            </span>
                                            <span className="font-bold text-[10px] md:text-base text-[#009AD0] tracking-widest uppercase">
                                                MARKETİ
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </Link>

                            {/* Çağrı merkezi (masaüstü): çalışma saati + büyük numara. Ayarlarda iki numara var
                                ("0534 519 44 72 - 538 816 84 00"): ilki büyük, ikincisi altında küçük; her biri ayrı aranabilir.
                                Önceden tek bağlantıydı ve iki numara birleşip "tel:05345194472-5388168400" oluyordu */}
                            {phoneNumbers.length > 0 && (
                                <div className="hidden lg:flex items-center gap-3 ml-2 xl:ml-4 shrink-0">
                                    <a
                                        href={`tel:${phoneNumbers[0]}`}
                                        aria-label={`Ara: ${displayPhone(phoneNumbers[0])}`}
                                        className="w-11 h-11 bg-green-500 rounded-full flex items-center justify-center shrink-0 shadow-md shadow-green-500/25 transition-transform duration-200 hover:scale-105"
                                    >
                                        <Phone className="h-5 w-5 text-white" />
                                    </a>
                                    <div className="flex flex-col leading-tight">
                                        <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Pzt–Cmt 08:00–20:00</span>
                                        <a href={`tel:${phoneNumbers[0]}`} className="text-[17px] font-extrabold tracking-tight text-[#00739C] dark:text-white whitespace-nowrap hover:underline">
                                            {displayPhone(phoneNumbers[0])}
                                        </a>
                                        {phoneNumbers[1] && (
                                            <a href={`tel:${phoneNumbers[1]}`} className="text-[14px] font-bold tracking-tight text-gray-700 dark:text-gray-300 whitespace-nowrap hover:text-[#00739C] hover:underline">
                                                {displayPhone(phoneNumbers[1])}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Center: Search Bar */}
                        <div className="flex-1 min-w-0 max-w-2xl mx-auto hidden md:block px-2 lg:px-4">
                            <SearchInput />
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-1 md:gap-2 lg:gap-3 shrink-0">

                            {/* User Panel */}
                            <div
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                                className="relative"
                            >
                                {!mounted ? (
                                    <button aria-label="Giriş Yap" className="flex items-center gap-1 md:gap-2.5 text-gray-700 hover:text-[#00739C] transition-colors px-1.5 md:px-3 py-1.5 md:py-2 rounded-lg hover:bg-gray-100">
                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                            <User className="h-5 w-5" strokeWidth={1.6} />
                                        </div>
                                        <span className="hidden sm:inline text-sm font-semibold">Giriş Yap</span>
                                    </button>
                                ) : (
                                    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen} modal={false}>
                                        <DropdownMenuTrigger asChild>
                                            <button aria-label={user ? "Hesabım" : "Giriş Yap"} className="flex items-center gap-1 md:gap-2.5 text-gray-700 hover:text-[#00739C] transition-colors px-1.5 md:px-3 py-1.5 md:py-2 rounded-lg hover:bg-gray-100 outline-none">
                                                <div className={`w-10 h-10 ${user ? 'bg-[#009AD0]/10' : 'bg-gray-100'} rounded-full flex items-center justify-center`}>
                                                    <User className={`h-5 w-5 ${user ? 'text-[#00739C]' : ''}`} strokeWidth={1.6} />
                                                </div>
                                                <span className="hidden sm:inline text-sm font-semibold">
                                                    {user ? "Hesabım" : "Giriş Yap"}
                                                </span>
                                            </button>
                                        </DropdownMenuTrigger>

                                        {!user ? (
                                            <DropdownMenuContent align="end" className="w-[280px] p-4">
                                                <div className="flex flex-col gap-3">
                                                    <Link href="/login" className="w-full">
                                                        <Button variant="default" className="w-full">
                                                            Giriş Yap
                                                        </Button>
                                                    </Link>
                                                    <Link href="/register" className="w-full">
                                                        <Button variant="outline" className="w-full">
                                                            Üye Ol
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
                                                        const { logout } = useCartStore.getState();
                                                        logout();
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

                            {/* Sepet: ince çizgili çanta ikonu (turuncu dolu daire yerine); boşken "0" balonu ve "₺0" yerine sadece "Sepetim" */}
                            <Link href="/cart" aria-label="Alışveriş Sepetim" className="group/cart flex items-center gap-1 md:gap-2.5 text-gray-700 hover:text-[#00739C] transition-colors px-1.5 md:px-3 py-1.5 md:py-2 rounded-lg hover:bg-gray-100">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 group-hover/cart:bg-[#009AD0]/10 flex items-center justify-center transition-colors">
                                        <ShoppingBag className="h-[21px] w-[21px] text-[#00739C]" strokeWidth={1.6} />
                                    </div>
                                    {mounted && itemCount > 0 && (
                                        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 flex items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white border-2 border-white">
                                            {itemCount > 99 ? "99+" : itemCount}
                                        </span>
                                    )}
                                </div>
                                {mounted && itemCount > 0 ? (
                                    <span className="hidden sm:inline text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                        <CartTotalDisplay />
                                    </span>
                                ) : (
                                    <span className="hidden sm:inline text-sm font-semibold whitespace-nowrap">Sepetim</span>
                                )}
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

                {/* Mobile Search Row - ALWAYS VISIBLE */}
                <div className="md:hidden border-t dark:border-gray-800/50 bg-white/50 dark:bg-gray-900/50 py-3 px-4 animate-in slide-in-from-top-1 duration-300">
                    <SearchInput />
                </div>
            </div>

            {/* Kategori menüsü (masaüstü): tek satır, ikon yazının solunda. Önceden ikon yazının üstündeydi (~64px, header
                toplamı ~145px) ve her kategoride aynı dişli ikonu vardı; artık ~44px, kategoriler sadece yazı. Bulunulan sayfa
                ve üzerine gelinen öğe altı beyaz çizgiyle belli olur */}
            {/* Zemin bir ton koyu: açık mavi (#009AD0) üzerinde beyaz yazı soluk görünüyordu (kontrast ~3:1, şimdi ~4.5:1) */}
            <div className="hidden md:block relative bg-[#0088BB] bg-gradient-to-r from-[#0077A6] via-[#0088BB] to-[#0077A6]">
                <div className="container mx-auto px-4">
                    <nav aria-label="Ana menü" className="flex flex-wrap items-center justify-center gap-x-1 lg:gap-x-3">
                        <Link href="/" className={navItemClass(pathname === "/")}>
                            <Home className="h-4 w-4" />
                            Ana Sayfa
                        </Link>
                        {categories
                            .filter(c => c.name !== "Home" && c.name !== "Root")
                            .map((category) => (
                                <Link
                                    key={category.id}
                                    href={`/category/${category.slug}`}
                                    className={navItemClass(pathname === `/category/${category.slug}`)}
                                >
                                    {category.name}
                                </Link>
                            ))}
                        <Link href="/about" className={navItemClass(pathname === "/about")}>
                            <Building2 className="h-4 w-4" />
                            Hakkımızda
                        </Link>
                        <Link href="/contact" className={navItemClass(pathname === "/contact")}>
                            <Phone className="h-4 w-4" />
                            İletişim
                        </Link>
                    </nav>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-b dark:border-gray-800/50 bg-white dark:bg-gray-900 supports-[backdrop-filter]:bg-white/95 supports-[backdrop-filter]:dark:bg-gray-900/95 backdrop-blur-xl animate-in slide-in-from-top-2 duration-200 max-h-[80vh] overflow-y-auto">
                    <div className="container mx-auto px-4 py-4 space-y-4">
                        {/* Mobile Quick Actions */}
                        <div className="grid grid-cols-2 gap-2">
                            <Link
                                href="/cart"
                                className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-orange-50 text-orange-700 font-bold text-sm"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <ShoppingCart className="h-4 w-4" />
                                {/* Boşken "(0)" yazmasın */}
                                Sepetim{mounted && itemCount > 0 ? ` (${itemCount})` : ""}
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

                        {/* Mobile Categories - Expandable Sidebar Style */}
                        <div className="space-y-1.5">
                            <p className="text-xs font-semibold text-gray-500 uppercase px-2 mb-2">Kategoriler</p>
                            <Link
                                href="/products"
                                className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-[#009AD0] hover:bg-blue-50 rounded-lg"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-[#009AD0]" />
                                Tüm Ürünler
                            </Link>
                            {mobileCategoryTree.map((category) => {
                                const hasChildren = category.children && category.children.length > 0;
                                return (
                                    <MobileCategoryItem
                                        key={category.id}
                                        category={category}
                                        hasChildren={hasChildren}
                                        onClose={() => setIsMobileMenuOpen(false)}
                                    />
                                );
                            })}
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

// Üst menü öğesi: beyaz yazı, altında ortadan açılan ince beyaz çizgi (bulunulan sayfada hep açık)
function navItemClass(active: boolean) {
    return cn(
        // Yazılar tam beyaz ve kalın (önceden %85 opak ve yarı kalındı, soluk görünüyordu); hafif gölge okunurluğu artırır
        "relative flex items-center gap-1.5 px-3 h-11 text-[13.5px] font-bold text-white whitespace-nowrap rounded-lg transition-colors [text-shadow:0_1px_1px_rgba(0,0,0,0.18)] hover:bg-white/10",
        "after:absolute after:left-3 after:right-3 after:bottom-1.5 after:h-0.5 after:rounded-full after:bg-white after:transition-transform after:duration-200",
        active ? "after:scale-x-100" : "after:scale-x-0 hover:after:scale-x-100"
    );
}

function MobileCategoryItem({ category, hasChildren, onClose }: { category: Category; hasChildren: boolean; onClose: () => void }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={cn(
            "rounded-lg border border-gray-100 dark:border-gray-800 transition-all duration-200",
            isOpen && "shadow-sm ring-1 ring-blue-500/20"
        )}>
            <div className="flex items-center">
                <Link
                    href={`/category/${category.slug}`}
                    className="flex-1 flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-[#009AD0] transition-colors"
                    onClick={onClose}
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                    {category.name}
                </Link>
                {hasChildren && (
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-2.5 mr-1 rounded-lg text-gray-400 hover:text-[#009AD0] hover:bg-blue-50 transition-all"
                    >
                        {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </button>
                )}
            </div>
            {isOpen && hasChildren && (
                <div className="px-4 pb-2 space-y-0.5 border-t border-gray-50 dark:border-gray-800/50">
                    {category.children!.map((child) => (
                        <Link
                            key={child.id}
                            href={`/category/${child.slug}`}
                            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-500 hover:text-[#009AD0] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            onClick={onClose}
                        >
                            <ChevronRight className="w-3 h-3 text-gray-300" />
                            {child.name}
                        </Link>
                    ))}
                </div>
            )}
        </div>
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
