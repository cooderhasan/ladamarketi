"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getGeminiConfig() {
  try {
    const config = await prisma.geminiConfig.findFirst();
    return { success: true, data: config };
  } catch (error) {
    return { success: false, error: "Ayarlar alınamadı" };
  }
}

export async function saveGeminiConfig(formData: FormData) {
  const apiKey = formData.get("apiKey") as string;
  const isActive = formData.get("isActive") === "on";

  try {
    const existing = await prisma.geminiConfig.findFirst();

    if (existing) {
      await prisma.geminiConfig.update({
        where: { id: existing.id },
        data: { apiKey, isActive },
      });
    } else {
      await prisma.geminiConfig.create({
        data: { apiKey, isActive },
      });
    }

    revalidatePath("/admin/integrations/gemini");
    return { success: true, message: "Ayarlar kaydedildi" };
  } catch (error) {
    return { success: false, error: "Kaydedilirken bir hata oluştu" };
  }
}
