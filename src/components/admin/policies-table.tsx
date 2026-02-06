"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Pencil } from "lucide-react";
import Link from "next/link";

interface Policy {
    slug: string;
    title: string;
    updatedAt: Date;
}

export function PoliciesTable({ policies }: { policies: Policy[] }) {
    return (
        <div className="rounded-md border bg-white dark:bg-gray-800">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Başlık</TableHead>
                        <TableHead>Slug (Bağlantı)</TableHead>
                        <TableHead>Son Güncelleme</TableHead>
                        <TableHead className="text-right">İşlem</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {policies.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                Kayıtlı politika bulunmuyor.
                            </TableCell>
                        </TableRow>
                    ) : (
                        policies.map((policy) => (
                            <TableRow key={policy.slug}>
                                <TableCell className="font-medium">{policy.title}</TableCell>
                                <TableCell className="text-gray-500">{policy.slug}</TableCell>
                                <TableCell>
                                    {format(new Date(policy.updatedAt), "d MMM yyyy HH:mm", { locale: tr })}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Link href={`/admin/policies/${policy.slug}`}>
                                        <Button variant="ghost" size="sm">
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Düzenle
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
