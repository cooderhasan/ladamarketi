import { PoliciesTable } from "@/components/admin/policies-table";
import { getAllPolicies } from "@/app/actions/policy";

export default async function PoliciesPage() {
    const policies = await getAllPolicies();

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Politika ve Sözleşmeler</h1>
            </div>
            <PoliciesTable policies={policies} />
        </div>
    );
}
