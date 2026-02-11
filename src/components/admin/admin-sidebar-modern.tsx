"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    Package,
    ShoppingCart,
    Settings,
    Tag,
    FileText,
    ChevronLeft,
    Menu,
    Award,
    AlertTriangle,
    BarChart3,
    FileQuestion,
    Mail,
    Scale,
    Zap,
    Truck,
    LogOut,
    Image as LucideImage,
    Search
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Define strict groups
type MenuGroup = {
    title?: string;
    items: {
        title: string;
        href: string;
        icon: any;
    }[];
};

const menuGroups: MenuGroup[] = [
    {
        title: "Genel",
        items: [
            { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
            { title: "Raporlar", href: "/admin/reports", icon: BarChart3 },
        ],
    },
    {
        title: "Katalog",
        items: [
            { title: "Ürünler", href: "/admin/products", icon: Package },
            { title: "Kategoriler", href: "/admin/categories", icon: Tag },
            { title: "Markalar", href: "/admin/brands", icon: Award },
            { title: "Sliderlar", href: "/admin/sliders", icon: LucideImage },
        ],
    },
    {
        title: "Satış & Müşteri",
        items: [
            { title: "Siparişler", href: "/admin/orders", icon: ShoppingCart },
            { title: "Müşteriler", href: "/admin/customers", icon: Users },
            { title: "Teklifler", href: "/admin/quotes", icon: FileQuestion },
            { title: "Mesajlar", href: "/admin/messages", icon: Mail },
            { title: "Stok Uyarı", href: "/admin/stock-alerts", icon: AlertTriangle },
        ],
    },
    {
        title: "Entegrasyon",
        items: [
            { title: "Trendyol", href: "/admin/integrations/trendyol", icon: Zap },
            { title: "N11", href: "/admin/integrations/n11", icon: Zap },
            { title: "Hepsiburada", href: "/admin/integrations/hepsiburada", icon: Zap },
            { title: "Toplu İşlemler", href: "/admin/bulk-updates", icon: Zap },
        ],
    },
    {
        title: "Yapılandırma",
        items: [
            { title: "Ayarlar", href: "/admin/settings", icon: Settings },
            { title: "Kargo Firmaları", href: "/admin/cargo-companies", icon: Truck },
            { title: "İskonto Grupları", href: "/admin/discount-groups", icon: FileText },
            { title: "Politikalar", href: "/admin/policies", icon: Scale },
        ],
    },
];

export function AdminSidebarModern({ settings }: { settings?: any }) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const logoUrl = settings?.logoUrl;
    const siteName = settings?.siteName || "B2B";

    // Filter menu items based on search
    const filteredGroups = searchQuery
        ? menuGroups.map(group => ({
            ...group,
            items: group.items.filter(item =>
                item.title.toLowerCase().includes(searchQuery.toLowerCase())
            )
        })).filter(group => group.items.length > 0)
        : menuGroups;

    return (
        <>
            {/* Mobile overlay */}
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-gray-900/60 lg:hidden backdrop-blur-sm transition-opacity duration-300",
                    mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setMobileOpen(false)}
            />

            {/* Sidebar Container */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 print:hidden",
                    // Glassmorphism Styles
                    "bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-800/50 shadow-2xl lg:shadow-none",
                    collapsed ? "w-[80px]" : "w-72",
                    mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                {/* Logo Area */}
                <div className={cn(
                    "relative flex flex-col items-center justify-center px-4 transition-all duration-300 shrink-0",
                    collapsed ? "h-20" : "h-32 py-6"
                )}>
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/10 pointer-events-none" />

                    {!collapsed && (
                        <Link href="/admin" className="relative z-10 flex flex-col items-center gap-3 w-full group" onClick={() => setMobileOpen(false)}>
                            <div className="w-full h-12 relative flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                                {logoUrl ? (
                                    <Image
                                        src={logoUrl}
                                        alt={siteName}
                                        fill
                                        className="object-contain drop-shadow-sm"
                                        priority
                                    />
                                ) : (
                                    <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                                        <span className="text-white font-black text-lg tracking-tight">{siteName.substring(0, 3).toUpperCase()}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col items-center text-center w-full">
                                <span className="font-bold text-gray-900 dark:text-white text-sm tracking-tight">{siteName}</span>
                                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full mt-1">
                                    Admin Panel
                                </span>
                            </div>
                        </Link>
                    )}

                    {/* Collapsed Logo */}
                    {collapsed && (
                        <div className="relative z-10 w-12 h-12 mx-auto bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden group hover:ring-2 hover:ring-blue-500/50 transition-all">
                            {logoUrl ? (
                                <Image
                                    src={logoUrl}
                                    alt={siteName}
                                    fill
                                    className="object-contain p-1.5"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center">
                                    <span className="text-white font-black text-xs">{siteName.substring(0, 3).toUpperCase()}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Collapse Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCollapsed(!collapsed)}
                        className={cn(
                            "absolute top-3 right-3 hidden lg:flex h-7 w-7 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 z-20 transition-all",
                            collapsed && "top-auto bottom-4 right-1/2 translate-x-1/2 bg-gray-100 dark:bg-gray-800 text-gray-500 shadow-sm"
                        )}
                    >
                        <ChevronLeft
                            className={cn(
                                "h-4 w-4 transition-transform duration-300",
                                collapsed && "rotate-180"
                            )}
                        />
                    </Button>

                    {/* Mobile Close Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMobileOpen(false)}
                        className="absolute right-2 top-2 lg:hidden text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                </div>

                {/* Quick Search - Only when expanded */}
                {!collapsed && (
                    <div className="px-4 mb-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Menüde ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9 text-sm bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-800 transition-all rounded-xl"
                            />
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-6 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 custom-scrollbar">
                    {filteredGroups.map((group, groupIndex) => (
                        <div key={groupIndex} className="animate-in fade-in duration-500" style={{ animationDelay: `${groupIndex * 50}ms` }}>
                            {!collapsed && group.title && (
                                <h3 className="px-4 mb-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                    {group.title}
                                </h3>
                            )}
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const isActive =
                                        pathname === item.href ||
                                        (item.href !== "/admin" && pathname.startsWith(item.href));

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMobileOpen(false)}
                                            title={collapsed ? item.title : undefined}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2.5 mx-1 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                                                isActive
                                                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25 ring-1 ring-blue-400/20"
                                                    : "text-gray-600 hover:text-blue-600 hover:bg-blue-50/80 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/10"
                                            )}
                                        >
                                            {/* Hover Glow Effect */}
                                            {!isActive && (
                                                <div className="absolute inset-0 bg-blue-100/50 dark:bg-blue-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                            )}

                                            <item.icon
                                                className={cn(
                                                    "h-[18px] w-[18px] flex-shrink-0 transition-transform duration-300 relative z-10",
                                                    isActive ? "text-white" : "text-gray-400 group-hover:text-blue-600 dark:text-gray-500 dark:group-hover:text-blue-400",
                                                    !collapsed && "group-hover:scale-110"
                                                )}
                                            />
                                            {!collapsed && (
                                                <span className={cn(
                                                    "truncate relative z-10 transition-transform duration-300",
                                                    !isActive && "group-hover:translate-x-1"
                                                )}>
                                                    {item.title}
                                                </span>
                                            )}

                                            {/* Active Indicator for Collapsed Mode */}
                                            {isActive && collapsed && (
                                                <div className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-l-full bg-white/30" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Footer User Profile / Logout */}
                <div className="p-3 mt-auto shrink-0 relative z-20">
                    <div className={cn(
                        "rounded-xl bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-100 dark:border-gray-700 p-1",
                        collapsed ? "p-1" : "p-3"
                    )}>
                        <Link
                            href="/"
                            className={cn(
                                "flex items-center gap-3 rounded-lg transition-all hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm",
                                collapsed ? "justify-center p-2" : "px-2 py-1.5"
                            )}
                        >
                            <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                                <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </div>
                            {!collapsed && (
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">Çıkış Yap</span>
                                    <span className="text-[10px] text-gray-500 truncate">Mağazaya Dön</span>
                                </div>
                            )}
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Mobile menu button */}
            <Button
                variant="outline"
                size="icon"
                className="lg:hidden fixed top-4 left-4 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm border-gray-200 dark:border-gray-800 h-10 w-10 rounded-xl"
                onClick={() => setMobileOpen(true)}
            >
                <Menu className="h-5 w-5" />
            </Button>
        </>
    );
}

