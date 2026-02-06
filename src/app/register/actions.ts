"use server";

import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validations";

export async function registerUser(formData: FormData) {
    const rawData = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        confirmPassword: formData.get("confirmPassword") as string,
        companyName: formData.get("companyName") as string,
        taxNumber: formData.get("taxNumber") as string,
        phone: formData.get("phone") as string,
        address: formData.get("address") as string,
        city: formData.get("city") as string,
        district: formData.get("district") as string,
    };

    // Validate data
    const validatedData = registerSchema.parse(rawData);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email },
    });

    if (existingUser) {
        throw new Error("Bu e-posta adresi zaten kullanılıyor.");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 12);

    // Get default discount group (Standart Bayi - 0%)
    const defaultGroup = await prisma.discountGroup.findFirst({
        where: { discountRate: 0, isActive: true },
    });

    // Create user
    const isCorporate = !!validatedData.companyName && !!validatedData.taxNumber;

    await prisma.user.create({
        data: {
            email: validatedData.email,
            passwordHash,
            companyName: validatedData.companyName || null,
            taxNumber: validatedData.taxNumber || null,
            phone: validatedData.phone,
            address: validatedData.address,
            city: validatedData.city,
            district: validatedData.district,
            role: isCorporate ? "DEALER" : "CUSTOMER",
            status: isCorporate ? "PENDING" : "APPROVED",
            discountGroupId: isCorporate ? defaultGroup?.id : undefined,
        },
    });
}
