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
import { Bell, LogOut, User, FileQuestion, Users, Package, ShoppingCart, Loader2 } from "lucide-react";
import { signOut } from "next-auth/react";
import type { UserRole, UserStatus } from "@prisma/client";
import { useState, useEffect } from "react";
import Link from "next/link";

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
};

export function AdminHeader({ user }: AdminHeaderProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);

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

    const initials = user?.companyName
        ? user.companyName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : user?.email?.slice(0, 2).toUpperCase() || "AD";

    return (
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 sm:px-6 lg:px-8 print:hidden">
            <div className="flex-1 pl-12 lg:pl-0">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Yönetim Paneli
                </h1>
            </div>

            <div className="flex items-center gap-4">
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
                                        href={notification.link}
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
                            onClick={() => signOut({ callbackUrl: "/login" })}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Çıkış Yap
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
