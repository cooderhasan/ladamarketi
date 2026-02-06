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
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const menuItems = [
    {
        title: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
    },
    {
        title: "Müşteriler",
        href: "/admin/customers",
        icon: Users,
    },
    {
        title: "Ürünler",
        href: "/admin/products",
        icon: Package,
    },
    {
        title: "Kategoriler",
        href: "/admin/categories",
        icon: Tag,
    },
    {
        title: "Markalar",
        href: "/admin/brands",
        icon: Award,
    },
    {
        title: "Siparişler",
        href: "/admin/orders",
        icon: ShoppingCart,
    },
    {
        title: "Teklifler",
        href: "/admin/quotes",
        icon: FileQuestion,
    },
    {
        title: "Stok Uyarıları",
        href: "/admin/stock-alerts",
        icon: AlertTriangle,
    },
    {
        title: "Raporlar",
        href: "/admin/reports",
        icon: BarChart3,
    },
    {
        title: "Slider Yönetimi",
        href: "/admin/sliders",
        icon: Image,
    },
    {
        title: "İskonto Grupları",
        href: "/admin/discount-groups",
        icon: FileText,
    },
    {
        title: "Mesajlar",
        href: "/admin/messages",
        icon: Mail,
    },
    {
        title: "Politikalar",
        href: "/admin/policies",
        icon: Scale,
    },
    {
        title: "Ayarlar",
        href: "/admin/settings",
        icon: Settings,
    },
    {
        title: "Toplu İşlemler",
        href: "/admin/bulk-updates",
        icon: Zap,
    },
    {
        title: "Trendyol Entegrasyon",
        href: "/admin/integrations/trendyol",
        icon: Zap,
    },
    {
        title: "N11 Entegrasyon",
        href: "/admin/integrations/n11",
        icon: Zap,
    },
    {
        title: "Hepsiburada Entegrasyon",
        href: "/admin/integrations/hepsiburada",
        icon: Zap,
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
                    "fixed inset-0 z-40 bg-gray-900/50 lg:hidden",
                    mobileOpen ? "block" : "hidden"
                )}
                onClick={() => setMobileOpen(false)}
            />

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 print:hidden",
                    collapsed ? "w-16" : "w-64",
                    mobileOpen ? "flex" : "hidden lg:flex"
                )}
            >
                {/* Logo */}
                <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
                    {!collapsed && (
                        <Link href="/admin" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">B2B</span>
                            </div>
                            <span className="font-semibold text-gray-900 dark:text-white">
                                Admin Panel
                            </span>
                        </Link>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCollapsed(!collapsed)}
                        className="ml-auto hidden lg:flex"
                    >
                        <ChevronLeft
                            className={cn(
                                "h-4 w-4 transition-transform",
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
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {menuItems.map((item) => {
                        const isActive =
                            pathname === item.href ||
                            (item.href !== "/admin" && pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                )}
                            >
                                <item.icon className="h-5 w-5 flex-shrink-0" />
                                {!collapsed && <span>{item.title}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <Link
                        href="/"
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                        )}
                    >
                        <ChevronLeft className="h-5 w-5" />
                        {!collapsed && <span>Siteye Dön</span>}
                    </Link>
                </div>
            </aside>

            {/* Mobile menu button */}
            <Button
                variant="outline"
                size="icon"
                className="lg:hidden fixed top-4 left-4 z-50 print:hidden"
                onClick={() => setMobileOpen(true)}
            >
                <Menu className="h-5 w-5" />
            </Button>
        </>
    );
}
