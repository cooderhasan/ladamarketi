import { getPolicy } from "@/app/actions/policy";
import { notFound, permanentRedirect } from "next/navigation";
import { policyDbSlug, policyRedirectSlug } from "@/lib/policy-slugs";

interface PolicyPageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function DynamicPolicyPage({ params }: PolicyPageProps) {
    const { slug } = await params;
    // Eski bozuk adres ("i-ptal-ve-i-ade") → düzgün adres ("iptal-ve-iade")
    const better = policyRedirectSlug(slug);
    if (better) permanentRedirect(`/policies/${better}`);
    const policy = await getPolicy(policyDbSlug(slug));

    if (!policy) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
                {policy.title}
            </h1>
            <div
                className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: policy.content }}
            />
        </div>
    );
}
