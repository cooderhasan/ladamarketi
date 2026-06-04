"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, LogOut, User, FileQuestion, Users, Package, ShoppingCart, Loader2, Menu, Landmark, RotateCcw, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { useCartStore } from "@/stores/cart-store";
import type { UserRole, UserStatus } from "@prisma/client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface AdminHeaderProps {
    user?: {
        id: string;
        email: string;
        role: UserRole;
        status: UserStatus;
        companyName?: string | null;
    } | null;
}

interface Notification {
    id: string;
    title: string;
    description: string;
    link: string;
    type: string;
    count: number;
}

const notificationIcons: Record<string, React.ReactNode> = {
    quote: <FileQuestion className="h-4 w-4 text-blue-600" />,
    user: <Users className="h-4 w-4 text-purple-600" />,
    stock: <Package className="h-4 w-4 text-orange-600" />,
    order: <ShoppingCart className="h-4 w-4 text-green-600" />,
    "bank-transfer": <Landmark className="h-4 w-4 text-amber-600" />,
    return: <RotateCcw className="h-4 w-4 text-red-600" />,
};

export function AdminHeader({ user }: AdminHeaderProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const prevCounts = useRef<{ orders: number; transfers: number; returns: number }>({ orders: 0, transfers: 0, returns: 0 });
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        const isClosed = localStorage.getItem("admin-havale-banner-closed");
        // Expiration date: 2 days from now (June 6th, 2026 at 20:00 UTC+3)
        const expireTime = new Date("2026-06-06T20:00:00+03:00").getTime();
        const isExpired = Date.now() > expireTime;

        if (!isClosed && !isExpired) {
            setShowBanner(true);
        }
    }, []);

    useEffect(() => {
        async function fetchNotifications() {
            try {
                const res = await fetch("/api/admin/notifications");
                if (res.ok) {
                    const data = await res.json();
                    setNotifications(data.notifications || []);
                    setTotalCount(data.totalCount || 0);
                }
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchNotifications();
        // Her 60 saniyede bir güncelle
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    // Sesli bildirim kontrolü
    useEffect(() => {
        if (loading) return;

        const orderNotification = notifications.find(n => n.id === "orders");
        const transferNotification = notifications.find(n => n.id === "bank-transfers");
        const returnNotification = notifications.find(n => n.id === "returns");

        const currentOrderCount = orderNotification?.count || 0;
        const currentTransferCount = transferNotification?.count || 0;
        const currentReturnCount = returnNotification?.count || 0;

        // Sayı arttıysa ses çal
        if (
            (currentOrderCount > prevCounts.current.orders) ||
            (currentTransferCount > prevCounts.current.transfers) ||
            (currentReturnCount > prevCounts.current.returns)
        ) {
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
            audio.play().catch(e => console.log("Ses çalma hatası (Tarayıcı izni gerekiyor olabilir):", e));
        }

        // Mevcut sayıları referans olarak kaydet
        prevCounts.current = {
            orders: currentOrderCount,
            transfers: currentTransferCount,
            returns: currentReturnCount,
        };
    }, [notifications, loading]);

    const initials = user?.companyName
        ? user.companyName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : user?.email?.slice(0, 2).toUpperCase() || "AD";

    return (
        <>
            {showBanner && (
                <div className="bg-gradient-to-r from-blue-600 to-[#009AD0] text-white py-2.5 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 text-xs sm:text-sm font-medium animate-in slide-in-from-top duration-300 print:hidden shrink-0">
                    <div className="flex items-center gap-2">
                        <Badge className="bg-white text-blue-700 font-extrabold text-[10px] uppercase hover:bg-white shrink-0">
                            Yeni Özellik
                        </Badge>
                        <span className="leading-normal">
                            <strong>Havale İndirimi Özelliği Yayında!</strong> Standart müşteriler için havale indirim oranını belirlemek üzere sol menüden <strong>Site Ayarları &gt; Ödeme Bilgileri</strong> sekmesine gidin.
                        </span>
                    </div>
                    <button
                        onClick={() => {
                            localStorage.setItem("admin-havale-banner-closed", "true");
                            setShowBanner(false);
                        }}
                        className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded transition-colors shrink-0"
                        title="Kapat"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
            <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-gray-100 dark:border-gray-800 bg-white/50 backdrop-blur-xl dark:bg-gray-900/50 px-4 sm:px-6 lg:px-8 print:hidden">
            <div className="flex-1 flex items-center gap-2 lg:pl-0">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="lg:hidden shrink-0" 
                    onClick={() => window.dispatchEvent(new Event('toggle-admin-sidebar'))}
                >
                    <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                </Button>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    Yönetim Paneli
                </h1>
            </div>

            <div className="flex items-center gap-4">
                {/* Hızlı Bildirim Rozetleri */}
                <div className="hidden sm:flex items-center gap-2">
                    {notifications.find(n => n.id === "orders") && (
                        <Link href="/admin/orders">
                            <Badge className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 gap-2 animate-pulse cursor-pointer border-none shadow-lg">
                                <ShoppingCart className="h-3.5 w-3.5" />
                                <span className="font-bold">{notifications.find(n => n.id === "orders")?.count} Yeni Sipariş</span>
                            </Badge>
                        </Link>
                    )}
                    {notifications.find(n => n.id === "bank-transfers") && (
                        <Link href="/admin/bank-transfers">
                            <Badge className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 gap-2 cursor-pointer border-none shadow-lg">
                                <Landmark className="h-3.5 w-3.5" />
                                <span className="font-bold">{notifications.find(n => n.id === "bank-transfers")?.count} Yeni Havale</span>
                            </Badge>
                        </Link>
                    )}
                    {notifications.find(n => n.id === "returns") && (
                        <Link href="/admin/returns">
                            <Badge className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 gap-2 cursor-pointer border-none shadow-lg">
                                <RotateCcw className="h-3.5 w-3.5" />
                                <span className="font-bold">{notifications.find(n => n.id === "returns")?.count} İade Talebi</span>
                            </Badge>
                        </Link>
                    )}
                </div>

                {/* Notifications */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5" />
                            {totalCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                                    {totalCount > 9 ? "9+" : totalCount}
                                </span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-80" align="end">
                        <DropdownMenuLabel>Bildirimler</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {loading ? (
                            <div className="py-6 flex justify-center">
                                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="py-6 text-center text-gray-500 text-sm">
                                Yeni bildirim yok
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <DropdownMenuItem key={notification.id} asChild>
                                    <Link
                                        href={notification.id === "orders" ? "/admin/orders" : notification.link}
                                        className="flex items-start gap-3 p-3 cursor-pointer"
                                    >
                                        <div className="mt-0.5">
                                            {notificationIcons[notification.type] || <Bell className="h-4 w-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm">{notification.title}</p>
                                            <p className="text-xs text-gray-500">{notification.description}</p>
                                        </div>
                                        <div className="bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">
                                            {notification.count}
                                        </div>
                                    </Link>
                                </DropdownMenuItem>
                            ))
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* User menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="relative h-9 w-9 rounded-full"
                        >
                            <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-blue-600 text-white">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    {user?.companyName || "Admin"}
                                </p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user?.email || "admin@b2b.com"}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            Profil
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => {
                                const { logout } = useCartStore.getState();
                                logout();
                                signOut({ callbackUrl: "/login" });
                            }}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Çıkış Yap
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    </>
);
}
