"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CategoryTreeSelect } from "@/components/ui/category-tree-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createProduct, updateProduct } from "@/app/admin/(protected)/products/actions";
import { generateSlug, generateSKU, generateBarcode } from "@/lib/helpers";
import { useState } from "react";
import Link from "next/link";
import { Plus, X, ImageIcon, Trash2, Loader2, RefreshCcw, Package } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { calculateDesi } from "@/lib/shipping";
import { toast } from "sonner";
import { useRouter } from "next/navigation";


interface Brand {
    id: string;
    name: string;
}

interface Category {
    id: string;
    name: string;
    parentId: string | null;
}

interface ProductVariant {
    id?: string;
    color: string;
    size: string;
    sku: string;
    barcode: string;
    stock: number;
    priceAdjustment: number;
    isActive: boolean;
}

interface Product {
    id: string;
    name: string;
    slug: string;
    sku: string | null;
    barcode: string | null;
    origin: string | null;
    brandId: string | null;
    description: string | null;
    listPrice: number;
    trendyolPrice?: number | null;
    n11Price?: number | null;
    hepsiburadaPrice?: number | null;
    salePrice?: number | null;
    vatRate: number | null;
    minQuantity: number;
    stock: number;
    criticalStock: number;
    categoryId: string | null;
    images: string[];
    isFeatured: boolean;
    isNew: boolean;
    isBestSeller: boolean;
    isActive: boolean;
    weight?: number | null;
    width?: number | null;
    height?: number | null;
    length?: number | null;
    desi?: number | null;
    variants?: ProductVariant[];
    categories?: { id: string }[];
}

interface ProductFormProps {
    categories: Category[];
    brands: Brand[];
    product?: Product;
}

export function ProductForm({ categories, brands, product }: ProductFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Initial State
    const [formData, setFormData] = useState({
        name: product?.name || "",
        slug: product?.slug || "",
        description: product?.description || "",
        sku: product?.sku || "",
        barcode: product?.barcode || "",
        origin: product?.origin || "",
        brandId: product?.brandId || "none",
        categoryIds: product?.categories?.map(c => c.id) || (product?.categoryId ? [product.categoryId] : []) as string[],
        listPrice: product?.listPrice || "",
        trendyolPrice: product?.trendyolPrice || "",
        n11Price: product?.n11Price || "",
        hepsiburadaPrice: product?.hepsiburadaPrice || "",
        salePrice: product?.salePrice || "",
        vatRate: product?.vatRate?.toString() || "20",
        minQuantity: product?.minQuantity || 1,
        stock: product?.stock || 0,
        criticalStock: product?.criticalStock || 10,
        images: product?.images || [] as string[],
        variants: product?.variants || [] as ProductVariant[],
        isActive: product?.isActive ?? true,
        isFeatured: product?.isFeatured || false,
        isNew: product?.isNew || false,
        isBestSeller: product?.isBestSeller || false,
        weight: product?.weight ?? "",
        width: product?.width ?? "",
        height: product?.height ?? "",
        length: product?.length ?? "",
        desi: product?.desi ?? "",
    });

    // Otomatik desi hesaplama
    const autoDesi = formData.width && formData.height && formData.length
        ? calculateDesi(Number(formData.width), Number(formData.height), Number(formData.length))
        : 0;

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Auto-generate slug if name changes and it's a new product (no ID)
        if (field === "name" && !product) {
            setFormData(prev => ({ ...prev, slug: generateSlug(value), name: value }));
        }
    };

    const addVariant = () => {
        handleChange("variants", [
            ...formData.variants,
            {
                color: "",
                size: "",
                sku: "",
                barcode: "",
                stock: 0,
                priceAdjustment: 0,
                isActive: true,
            },
        ]);
    };

    const removeVariant = (index: number) => {
        handleChange("variants", formData.variants.filter((_, i) => i !== index));
    };

    const updateVariant = (index: number, field: keyof ProductVariant, value: string | number | boolean) => {
        const updated = [...formData.variants];
        updated[index] = { ...updated[index], [field]: value };
        handleChange("variants", updated);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        const newImages: string[] = [];

        for (const file of Array.from(files)) {
            const uploadData = new FormData();
            uploadData.append("file", file);

            try {
                const response = await fetch("/api/upload", {
                    method: "POST",
                    body: uploadData,
                });

                if (response.ok) {
                    const data = await response.json();
                    newImages.push(data.url);
                } else {
                    toast.error("Görsel yüklenemedi");
                }
            } catch {
                toast.error("Yükleme hatası oluştu");
            }
        }

        if (newImages.length > 0) {
            handleChange("images", [...formData.images, ...newImages]);
        }
        setUploading(false);
        e.target.value = "";
    };

    const removeImage = (index: number) => {
        handleChange("images", formData.images.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            if (key === 'variants' || key === 'images' || key === 'categoryIds') {
                data.append(key, JSON.stringify(value));
            } else {
                data.append(key, String(value));
            }
        });

        try {
            let result;
            if (product) {
                result = await updateProduct(product.id, data);
            } else {
                result = await createProduct(data);
            }

            if (result?.success) {
                toast.success(product ? "Ürün güncellendi" : "Ürün oluşturuldu");
                setTimeout(() => {
                    router.push("/admin/products");
                    router.refresh();
                }, 1000);
            } else {
                toast.error((result as any)?.error || "Bir hata oluştu");
            }
        } catch (error: any) {
            console.error("Save error:", error);
            toast.error("Kaydetme başarısız");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative pb-24">
            <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="bg-white dark:bg-gray-800 p-1 rounded-lg border flex flex-wrap h-auto sticky top-4 z-10 shadow-sm gap-2">
                    <TabsTrigger value="general" className="px-4 py-2">Genel Bilgiler</TabsTrigger>
                    <TabsTrigger value="price" className="px-4 py-2">Fiyat & Stok</TabsTrigger>
                    <TabsTrigger value="variants" className="px-4 py-2">Varyantlar</TabsTrigger>
                    <TabsTrigger value="media" className="px-4 py-2">Görseller</TabsTrigger>
                    <TabsTrigger value="settings" className="px-4 py-2">Ayarlar</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Temel Bilgiler</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Ürün Adı *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => handleChange("name", e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="slug">URL (Slug) *</Label>
                                    <Input
                                        id="slug"
                                        value={formData.slug}
                                        onChange={(e) => handleChange("slug", e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="categoryIds">Kategoriler</Label>
                                    <CategoryTreeSelect
                                        options={categories}
                                        selected={formData.categoryIds}
                                        onChange={(vals: string[]) => handleChange("categoryIds", vals)}
                                        placeholder="Kategori seçin"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="brandId">Marka</Label>
                                    <Select
                                        value={formData.brandId}
                                        onValueChange={(val) => handleChange("brandId", val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Marka seçin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Markasız</SelectItem>
                                            {brands.map((b) => (
                                                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Ürün Açıklaması</Label>
                                <RichTextEditor
                                    content={formData.description}
                                    onChange={(html) => handleChange("description", html)}
                                    placeholder="Ürün açıklaması..."
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="price" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Fiyatlandırma & Stok</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="listPrice">Liste Fiyatı (₺) *</Label>
                                    <Input
                                        id="listPrice"
                                        type="number"
                                        step="0.01"
                                        value={formData.listPrice}
                                        onChange={(e) => handleChange("listPrice", e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="salePrice" className="text-red-600 font-bold">İndirimli Fiyat (₺)</Label>
                                    <Input
                                        id="salePrice"
                                        type="number"
                                        step="0.01"
                                        value={formData.salePrice}
                                        onChange={(e) => handleChange("salePrice", e.target.value)}
                                        placeholder="İndirimli satış fiyatı"
                                        className="border-red-200 focus:border-red-500 bg-red-50/50"
                                    />
                                    <p className="text-[10px] text-gray-500">Girilirse bu fiyat geçerli olur, liste fiyatı üstü çizili görünür.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="trendyolPrice" className="text-orange-600">Trendyol Fiyatı (₺)</Label>
                                    <Input
                                        id="trendyolPrice"
                                        type="number"
                                        step="0.01"
                                        value={formData.trendyolPrice}
                                        onChange={(e) => handleChange("trendyolPrice", e.target.value)}
                                        placeholder="Varsayılan: Liste Fiyatı"
                                        className="border-orange-200 focus:border-orange-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="n11Price" className="text-purple-600">N11 Fiyatı (₺)</Label>
                                    <Input
                                        id="n11Price"
                                        type="number"
                                        step="0.01"
                                        value={formData.n11Price}
                                        onChange={(e) => handleChange("n11Price", e.target.value)}
                                        placeholder="Varsayılan: Liste Fiyatı"
                                        className="border-purple-200 focus:border-purple-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="hepsiburadaPrice" className="text-orange-600">Hepsiburada Fiyatı (₺)</Label>
                                    <Input
                                        id="hepsiburadaPrice"
                                        type="number"
                                        step="0.01"
                                        value={formData.hepsiburadaPrice}
                                        onChange={(e) => handleChange("hepsiburadaPrice", e.target.value)}
                                        placeholder="Varsayılan: Liste Fiyatı"
                                        className="border-orange-200 focus:border-orange-500"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="vatRate">KDV Oranı *</Label>
                                    <Select
                                        value={formData.vatRate}
                                        onValueChange={(val) => handleChange("vatRate", val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">%10</SelectItem>
                                            <SelectItem value="20">%20</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <hr />

                            <div className="grid gap-4 md:grid-cols-2">

                                <div className="space-y-2 relative">
                                    <Label htmlFor="sku">Stok Kodu (SKU)</Label>
                                    <Input
                                        id="sku"
                                        value={formData.sku}
                                        onChange={(e) => handleChange("sku", e.target.value)}
                                        placeholder="PRD-001"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="absolute right-0 top-6"
                                        onClick={() => handleChange("sku", generateSKU())}
                                        title="Rastgele SKU Oluştur"
                                    >
                                        <RefreshCcw className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="space-y-2 relative">
                                    <Label htmlFor="barcode">Barkod</Label>
                                    <Input
                                        id="barcode"
                                        value={formData.barcode}
                                        onChange={(e) => handleChange("barcode", e.target.value)}
                                        placeholder="869..."
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="absolute right-0 top-6"
                                        onClick={() => handleChange("barcode", generateBarcode())}
                                        title="Rastgele Barkod Oluştur"
                                    >
                                        <RefreshCcw className="h-4 w-4" />
                                    </Button>

                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="stock">Stok Adedi</Label>
                                    <Input
                                        id="stock"
                                        type="number"
                                        value={formData.stock}
                                        onChange={(e) => handleChange("stock", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="criticalStock">Kritik Stok Seviyesi</Label>
                                    <Input
                                        id="criticalStock"
                                        type="number"
                                        value={formData.criticalStock}
                                        onChange={(e) => handleChange("criticalStock", e.target.value)}
                                        placeholder="10"
                                    />
                                    <p className="text-xs text-gray-500">Stok bu seviyeye düştüğünde uyarı gösterilir</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="minQuantity">Min. Sipariş Adedi</Label>
                                    <Input
                                        id="minQuantity"
                                        type="number"
                                        value={formData.minQuantity}
                                        onChange={(e) => handleChange("minQuantity", e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="origin">Menşei</Label>
                                <Input
                                    id="origin"
                                    value={formData.origin}
                                    onChange={(e) => handleChange("origin", e.target.value)}
                                    placeholder="Türkiye"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-blue-500" />
                                Kargo Bilgileri (Desi)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    <strong>Bilgi:</strong> Desi = (En × Boy × Yükseklik) / 3000. Kargo firmaları ağırlık ve desi değerlerinden büyük olanı baz alır.
                                </p>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="weight">Ağırlık (kg)</Label>
                                    <Input
                                        id="weight"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.weight}
                                        onChange={(e) => handleChange("weight", e.target.value)}
                                        placeholder="Ör: 2.50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="desi">Desi (Manuel)</Label>
                                    <Input
                                        id="desi"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.desi}
                                        onChange={(e) => handleChange("desi", e.target.value)}
                                        placeholder={autoDesi > 0 ? `Otomatik: ${autoDesi}` : "Ör: 3.00"}
                                    />
                                    <p className="text-xs text-gray-500">Boş bırakılırsa boyutlardan otomatik hesaplanır.</p>
                                </div>
                            </div>

                            <hr />

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="width">Genişlik (cm)</Label>
                                    <Input
                                        id="width"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.width}
                                        onChange={(e) => handleChange("width", e.target.value)}
                                        placeholder="Ör: 30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="height">Yükseklik (cm)</Label>
                                    <Input
                                        id="height"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.height}
                                        onChange={(e) => handleChange("height", e.target.value)}
                                        placeholder="Ör: 20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="length">Uzunluk (cm)</Label>
                                    <Input
                                        id="length"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.length}
                                        onChange={(e) => handleChange("length", e.target.value)}
                                        placeholder="Ör: 15"
                                    />
                                </div>
                            </div>

                            {(autoDesi > 0 || Number(formData.weight) > 0) && (
                                <div className="bg-gray-50 dark:bg-gray-800 border rounded-lg p-4 mt-2">
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">Hacimsel Desi:</span>
                                            <p className="font-semibold">{autoDesi > 0 ? autoDesi : "-"}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Ağırlık:</span>
                                            <p className="font-semibold">{Number(formData.weight) > 0 ? `${formData.weight} kg` : "-"}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Efektif Desi:</span>
                                            <p className="font-bold text-blue-600">
                                                {Math.max(autoDesi, Number(formData.weight) || 0, Number(formData.desi) || 0).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="variants" className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Varyantlar</CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                                <Plus className="h-4 w-4 mr-1" /> Varyant Ekle
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {formData.variants.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                                    <p>Henüz varyant eklenmedi</p>
                                    <p className="text-sm">Renk/beden seçenekleri için varyant ekleyebilirsiniz</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {formData.variants.map((variant, index) => (
                                        <div key={index} className="border rounded-lg p-4 space-y-4 relative bg-gray-50 dark:bg-gray-800/50">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeVariant(index)}
                                                className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>

                                            <div className="grid gap-4 md:grid-cols-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Renk</Label>
                                                    <Input
                                                        value={variant.color}
                                                        onChange={(e) => updateVariant(index, "color", e.target.value)}
                                                        placeholder="Renk"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Beden</Label>
                                                    <Input
                                                        value={variant.size}
                                                        onChange={(e) => updateVariant(index, "size", e.target.value)}
                                                        placeholder="Beden"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Stok</Label>
                                                    <Input
                                                        type="number"
                                                        value={variant.stock}
                                                        onChange={(e) => updateVariant(index, "stock", parseInt(e.target.value) || 0)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Fiyat Farkı (+/-)</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={variant.priceAdjustment}
                                                        onChange={(e) => updateVariant(index, "priceAdjustment", parseFloat(e.target.value) || 0)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid gap-4 md:grid-cols-2">

                                                <div className="space-y-2 relative">
                                                    <Label className="text-xs">Varyant SKU</Label>
                                                    <Input
                                                        value={variant.sku}
                                                        onChange={(e) => updateVariant(index, "sku", e.target.value)}
                                                        placeholder="SKU"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute right-0 top-6 h-8 w-8"
                                                        onClick={() => updateVariant(index, "sku", generateSKU())}
                                                        title="SKU Oluştur"
                                                    >
                                                        <RefreshCcw className="h-3 w-3" />
                                                    </Button>
                                                </div>

                                                <div className="space-y-2 relative">
                                                    <Label className="text-xs">Varyant Barkod</Label>
                                                    <Input
                                                        value={variant.barcode}
                                                        onChange={(e) => updateVariant(index, "barcode", e.target.value)}
                                                        placeholder="Barkod"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute right-0 top-6 h-8 w-8"
                                                        onClick={() => updateVariant(index, "barcode", generateBarcode())}
                                                        title="Barkod Oluştur"
                                                    >
                                                        <RefreshCcw className="h-3 w-3" />
                                                    </Button>

                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent >

                <TabsContent value="media" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Görseller</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                                <Label htmlFor="image-upload" className="cursor-pointer block">
                                    <div className="flex flex-col items-center gap-2">
                                        <ImageIcon className="h-8 w-8 text-gray-400" />
                                        <span className="text-sm font-medium">Görsel Yüklemek İçin Tıklayın</span>
                                        <span className="text-xs text-gray-500">veya sürükleyip bırakın (Max 5MB)</span>
                                    </div>
                                    <Input
                                        id="image-upload"
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                    />
                                </Label>
                                {uploading && (
                                    <div className="mt-4 flex justify-center text-blue-600">
                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                        <span className="text-sm">Yükleniyor...</span>
                                    </div>
                                )}
                            </div>

                            {formData.images.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                    {formData.images.map((url, index) => (
                                        <div key={index} className="relative group aspect-square">
                                            <img
                                                src={url}
                                                alt={`Görsel ${index + 1}`}
                                                className="w-full h-full object-cover rounded-lg border bg-white"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                            {index === 0 && (
                                                <div className="absolute bottom-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs rounded shadow-sm">
                                                    Ana Görsel
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Görünürlük & Etiketler</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-gray-800">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Aktif Durum</Label>
                                    <p className="text-sm text-muted-foreground">Ürün mağazada görünür olsun mu?</p>
                                </div>
                                <Checkbox
                                    checked={formData.isActive}
                                    onCheckedChange={(c) => handleChange("isActive", c)}
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-gray-800">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Öne Çıkan</Label>
                                    <p className="text-sm text-muted-foreground">Ana sayfada vitrine eklensin mi?</p>
                                </div>
                                <Checkbox
                                    checked={formData.isFeatured}
                                    onCheckedChange={(c) => handleChange("isFeatured", c)}
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-gray-800">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Yeni Ürün</Label>
                                    <p className="text-sm text-muted-foreground">"Yeni" etiketi gösterilsin mi?</p>
                                </div>
                                <Checkbox
                                    checked={formData.isNew}
                                    onCheckedChange={(c) => handleChange("isNew", c)}
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-gray-800">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Çok Satan</Label>
                                    <p className="text-sm text-muted-foreground">"Çok Satan" etiketi gösterilsin mi?</p>
                                </div>
                                <Checkbox
                                    checked={formData.isBestSeller}
                                    onCheckedChange={(c) => handleChange("isBestSeller", c)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs >

            {/* Sticky Action Bar */}
            < div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-t z-50 flex items-center justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:pl-64" >
                <Link href="/admin/products">
                    <Button type="button" variant="outline">Vazgeç</Button>
                </Link>
                <Button type="submit" disabled={loading} className="min-w-[120px]">
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Kaydediliyor
                        </>
                    ) : (
                        product ? "Güncelle" : "Kaydet"
                    )}
                </Button>
            </div >
        </form >
    );
}
