"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { X, Plus, Pencil, Trash2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { createCategory, updateCategory, deleteCategory, toggleCategoryStatus } from "@/app/admin/(protected)/categories/actions";

interface Category {
    id: string;
    name: string;
    slug: string;
    order: number;
    isActive: boolean;
    createdAt: Date;
    parentId?: string | null;
    imageUrl?: string | null;
    isFeatured: boolean;
    trendyolCategoryId?: number | null;
    n11CategoryId?: number | null;
    hbCategoryId?: string | null;
    parent?: {
        name: string;
    } | null;
    _count: {
        products: number;
    };
}

interface CategoriesTableProps {
    categories: Category[];
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/ğ/g, "g")
        .replace(/ü/g, "u")
        .replace(/ş/g, "s")
        .replace(/ı/g, "i")
        .replace(/ö/g, "o")
        .replace(/ç/g, "c")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function CategoriesTable({ categories }: CategoriesTableProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [editCategory, setEditCategory] = useState<Category | null>(null);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [order, setOrder] = useState(0);
    const [parentId, setParentId] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState("");
    const [isFeatured, setIsFeatured] = useState(false);
    const [trendyolCategoryId, setTrendyolCategoryId] = useState<number | undefined>(undefined);
    const [n11CategoryId, setN11CategoryId] = useState<number | undefined>(undefined);
    const [hbCategoryId, setHbCategoryId] = useState<string | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Filter categories based on search
    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.parent?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination logic
    const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedCategories = filteredCategories.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to first page on search
    };

    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploading(true);
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");

            const data = await res.json();
            setImageUrl(data.url);
            toast.success("Resim yüklendi");
        } catch {
            toast.error("Resim yüklenirken hata oluştu");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (editCategory) {
                await updateCategory(editCategory.id, { name, slug, order, parentId, imageUrl, isFeatured, trendyolCategoryId, n11CategoryId, hbCategoryId });
                toast.success("Kategori güncellendi.");
            } else {
                await createCategory({ name, slug, order, parentId, imageUrl, isFeatured, trendyolCategoryId, n11CategoryId, hbCategoryId });
                toast.success("Kategori oluşturuldu.");
            }
            setIsOpen(false);
            resetForm();
        } catch {
            toast.error("Bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bu kategoriyi silmek istediğinize emin misiniz?")) return;

        try {
            await deleteCategory(id);
            toast.success("Kategori silindi.");
        } catch {
            toast.error("Bir hata oluştu.");
        }
    };

    const handleToggleStatus = async (id: string, isActive: boolean) => {
        try {
            await toggleCategoryStatus(id, isActive);
            toast.success(isActive ? "Kategori aktifleştirildi." : "Kategori pasifleştirildi.");
        } catch {
            toast.error("Bir hata oluştu.");
        }
    };


    const resetForm = () => {
        setName("");
        setSlug("");
        setOrder(0);
        setParentId(null);
        setImageUrl("");
        setIsFeatured(false);
        setTrendyolCategoryId(undefined);
        setN11CategoryId(undefined);
        setHbCategoryId(undefined);
        setEditCategory(null);
    };

    const openEditDialog = (category: Category) => {
        setEditCategory(category);
        setName(category.name);
        setSlug(category.slug);
        setOrder(category.order);
        setParentId(category.parentId || null);
        setImageUrl(category.imageUrl || "");
        setIsFeatured(category.isFeatured);
        setTrendyolCategoryId(category.trendyolCategoryId ?? undefined);
        setN11CategoryId(category.n11CategoryId ?? undefined);
        setHbCategoryId(category.hbCategoryId ?? undefined);
        setIsOpen(true);
    };

    const openNewDialog = () => {
        resetForm();
        setIsOpen(true);
    };

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <div className="relative w-full sm:w-72">
                    <Input
                        placeholder="Kategori Ara..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="pl-8"
                    />
                    {/* Search Icon can be added here if imported */}
                </div>

                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openNewDialog}>
                            <Plus className="h-4 w-4 mr-2" />
                            Yeni Kategori
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editCategory ? "Kategori Düzenle" : "Yeni Kategori"}
                            </DialogTitle>
                            <DialogDescription>
                                Kategori bilgilerini girin
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Kategori Adı</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => {
                                            setName(e.target.value);
                                            if (!editCategory) {
                                                setSlug(slugify(e.target.value));
                                            }
                                        }}
                                        placeholder="Örn: Temizlik Ürünleri"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="slug">URL Slug</Label>
                                    <Input
                                        id="slug"
                                        value={slug}
                                        onChange={(e) => setSlug(e.target.value)}
                                        placeholder="temizlik-urunleri"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="trendyolCategoryId" className="text-orange-600">Trendyol Kategori ID</Label>
                                    <Input
                                        id="trendyolCategoryId"
                                        type="number"
                                        value={trendyolCategoryId || ""}
                                        onChange={(e) => setTrendyolCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                                        placeholder="Örn: 1234"
                                        className="border-orange-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="n11CategoryId" className="text-purple-600">N11 Kategori ID</Label>
                                    <Input
                                        id="n11CategoryId"
                                        type="number"
                                        value={n11CategoryId || ""}
                                        onChange={(e) => setN11CategoryId(e.target.value ? Number(e.target.value) : undefined)}
                                        placeholder="Örn: 10001"
                                        className="border-purple-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="hbCategoryId" className="text-orange-600">Hepsiburada Kategori ID</Label>
                                    <Input
                                        id="hbCategoryId"
                                        value={hbCategoryId || ""}
                                        onChange={(e) => setHbCategoryId(e.target.value)}
                                        placeholder="Örn: telefon-kiliflari"
                                        className="border-orange-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="order">Sıralama</Label>
                                    <Input
                                        id="order"
                                        type="number"
                                        value={order}
                                        onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Üst Kategori</Label>
                                    <Select
                                        value={parentId || "root"}
                                        onValueChange={(value) => setParentId(value === "root" ? null : value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Üst Kategori Seçin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="root">Ana Kategori</SelectItem>
                                            {categories
                                                .filter(c => c.id !== editCategory?.id) // Prevent self-parenting
                                                .map((c) => (
                                                    <SelectItem key={c.id} value={c.id}>
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Kategori Görseli</Label>
                                    <div className="flex items-center gap-4">
                                        {imageUrl && (
                                            <div className="relative w-16 h-16 border rounded-md overflow-hidden">
                                                <img src={imageUrl} alt="Kategori" className="object-cover w-full h-full" />
                                                <button
                                                    type="button"
                                                    onClick={() => setImageUrl("")}
                                                    className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={uploading}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="featured"
                                        checked={isFeatured}
                                        onCheckedChange={setIsFeatured}
                                    />
                                    <Label htmlFor="featured">Ana Sayfada Göster</Label>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                    İptal
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? "Kaydediliyor..." : "Kaydet"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-lg border bg-white dark:bg-gray-800">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Sıra</TableHead>
                            <TableHead>Kategori Adı</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Ürün Sayısı</TableHead>
                            <TableHead>Durum</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedCategories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    {searchTerm ? "Sonuç bulunamadı." : "Henüz kategori bulunmuyor."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedCategories.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell>{category.order}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{category.name}</span>
                                            {category.parent && (
                                                <span className="text-xs text-gray-400">
                                                    ↳ {category.parent.name}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-gray-500">{category.slug}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            {category._count.products} ürün
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={category.isActive}
                                            onCheckedChange={(checked) =>
                                                handleToggleStatus(category.id, checked)
                                            }
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => openEditDialog(category)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-600 hover:text-red-700"
                                                onClick={() => handleDelete(category.id)}
                                                disabled={category._count.products > 0}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        Önceki
                    </Button>
                    <div className="text-sm font-medium">
                        Sayfa {currentPage} / {totalPages}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        Sonraki
                    </Button>
                </div>
            )}
        </>
    );
}
