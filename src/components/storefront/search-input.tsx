"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

export function SearchInput() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [value, setValue] = useState(searchParams.get("search") || "");
    const [isPending, startTransition] = useTransition();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();

        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set("search", value);
        } else {
            params.delete("search");
        }

        startTransition(() => {
            router.push(`/products?${params.toString()}`);
        });
    };

    return (
        <form onSubmit={handleSearch} className="relative w-full">
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus-within:border-[#009AD0] focus-within:ring-2 focus-within:ring-[#009AD0]/20 transition-all overflow-hidden">
                <div className="pl-4 text-gray-400">
                    {isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Search className="h-5 w-5" />
                    )}
                </div>
                <Input
                    type="search"
                    placeholder="Ürün adı, marka veya kategori ara..."
                    className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm py-3 px-3"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />
                <Button
                    type="submit"
                    size="sm"
                    className="m-1 rounded-lg px-6"
                    disabled={isPending}
                >
                    Ara
                </Button>
            </div>
        </form>
    );
}

