import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { Toaster } from "@/components/ui/sonner";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    console.log("LAYOUT_DEBUG: Session User:", session?.user?.email, "Role:", session?.user?.role);

    // Auth check is handled by Middleware. Redundant check here causes loops if auth() behaves differently than middleware.
    // if (!session?.user) {
    //    redirect("/admin/login");
    // }

    if (session?.user && session.user.role !== "ADMIN" && session.user.role !== "OPERATOR") {
        redirect("/");
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 print:bg-white">
            <AdminSidebar />
            <div className="lg:pl-64 print:pl-0">
                <AdminHeader user={session?.user as any} />
                <main className="py-6 px-4 sm:px-6 lg:px-8 print:p-0 print:m-0 print:w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}
