"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    Package,
    ShoppingCart,
    Settings,
    Tag,
    Image,
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
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
            { title: "Sliderlar", href: "/admin/sliders", icon: Image },
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

export function AdminSidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            {/* Mobile overlay */}
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-gray-900/50 lg:hidden backdrop-blur-sm transition-opacity",
                    mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setMobileOpen(false)}
            />

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transition-all duration-300 print:hidden shadow-xl lg:shadow-none",
                    collapsed ? "w-[70px]" : "w-64",
                    mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                {/* Logo Area */}
                <div className="flex h-16 items-center justify-between px-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 backdrop-blur-xl">
                    {!collapsed && (
                        <Link href="/admin" className="flex items-center gap-2.5 overflow-hidden" onClick={() => setMobileOpen(false)}>
                            <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <span className="text-white font-black text-sm tracking-tight">B2B</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-gray-900 dark:text-white leading-none text-base">Admin</span>
                                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mt-0.5">Panel</span>
                            </div>
                        </Link>
                    )}

                    {/* Collapsed Logo Alternative */}
                    {collapsed && (
                        <div className="w-10 h-10 mx-auto bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <span className="text-white font-black text-xs">B2B</span>
                        </div>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCollapsed(!collapsed)}
                        className="ml-auto hidden lg:flex h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
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
                        className="ml-auto lg:hidden"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-6 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                    {menuGroups.map((group, groupIndex) => (
                        <div key={groupIndex}>
                            {!collapsed && group.title && (
                                <h3 className="px-3 mb-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                    {group.title}
                                </h3>
                            )}
                            <div className="space-y-0.5">
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
                                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                                                isActive
                                                    ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 shadow-sm"
                                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-200"
                                            )}
                                        >
                                            <item.icon
                                                className={cn(
                                                    "h-[18px] w-[18px] flex-shrink-0 transition-colors",
                                                    isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300"
                                                )}
                                            />
                                            {!collapsed && (
                                                <span className="truncate">{item.title}</span>
                                            )}

                                            {/* Active Indicator Strip */}
                                            {isActive && !collapsed && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-blue-600 dark:bg-blue-500 opacity-0 lg:opacity-100" />
                                                // Hidden on mobile or handled by background
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                    <Link
                        href="/"
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-all"
                        )}
                    >
                        <LogOut className="h-[18px] w-[18px] text-gray-400 group-hover:text-gray-600" />
                        {!collapsed && <span>Siteye Dön</span>}
                    </Link>
                </div>
            </aside>

            {/* Mobile menu button */}
            <Button
                variant="outline"
                size="icon"
                className="lg:hidden fixed top-4 left-4 z-30 bg-white/80 backdrop-blur shadow-sm border-gray-200"
                onClick={() => setMobileOpen(true)}
            >
                <Menu className="h-5 w-5" />
            </Button>
        </>
    );
}
