import { prisma } from "@/lib/db";
import { CustomersTable } from "@/components/admin/customers-table";

export default async function CustomersPage() {
    const customers = await prisma.user.findMany({
        where: {
            role: { in: ["CUSTOMER", "DEALER"] },
        },
        include: {
            discountGroup: true,
            transactions: {
                select: {
                    type: true,
                    amount: true,
                }
            },
            _count: {
                select: { orders: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const discountGroups = await prisma.discountGroup.findMany({
        where: { isActive: true },
        orderBy: { discountRate: "asc" },
    });

    const serializedCustomers = customers.map(customer => {
        const totalDebit = customer.transactions
            .filter(t => t.type === "DEBIT")
            .reduce((acc, t) => acc + Number(t.amount), 0);

        const totalCredit = customer.transactions
            .filter(t => t.type === "CREDIT")
            .reduce((acc, t) => acc + Number(t.amount), 0);

        const currentDebt = totalDebit - totalCredit;

        // Destructure to separate Decimal fields and exclude raw transactions
        const { transactions, creditLimit, riskLimit, discountGroup, ...otherFields } = customer;

        return {
            ...otherFields,
            creditLimit: Number(creditLimit),
            riskLimit: Number(riskLimit),
            currentDebt,
            availableLimit: Number(creditLimit) - currentDebt,
            discountGroup: discountGroup ? {
                ...discountGroup,
                discountRate: Number(discountGroup.discountRate)
            } : null
        };
    });

    const serializedDiscountGroups = discountGroups.map(group => ({
        ...group,
        discountRate: Number(group.discountRate)
    }));

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Müşteri Yönetimi
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                    Bayi onayı ve iskonto grubu ataması yapın.
                </p>
            </div>

            <CustomersTable customers={serializedCustomers} discountGroups={serializedDiscountGroups} />
        </div>
    );
}
