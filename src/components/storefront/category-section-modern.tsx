import Link from "next/link";
import Image from "next/image";

interface Category {
    id: string;
    name: string;
    slug: string;
    imageUrl?: string | null;
}

interface CategorySectionProps {
    categories: Category[];
}

export function CategorySectionModern({ categories }: CategorySectionProps) {
    if (!categories || categories.length === 0) return null;

    const topRow = categories.slice(0, 2);
    const bottomRow = categories.slice(2, 5);

    return (
        <section className="container mx-auto px-4">
            <div className="space-y-4">
                {/* Top Row: 2 Large Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {topRow.map((category) => (
                        <Link
                            key={category.id}
                            href={`/category/${category.slug}`}
                            className="relative h-48 sm:h-56 md:h-64 rounded-2xl overflow-hidden group block"
                        >
                            {category.imageUrl ? (
                                <Image
                                    src={category.imageUrl}
                                    alt={category.name}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    sizes="(max-width: 640px) 100vw, 50vw"
                                    priority
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent group-hover:from-black/50 transition-colors" />
                            <div className="absolute bottom-4 left-4 right-4 z-10">
                                <h3 className="text-white font-bold text-lg sm:text-xl drop-shadow-md">
                                    {category.name}
                                </h3>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Bottom Row: 3 Smaller Cards */}
                {bottomRow.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {bottomRow.map((category) => (
                            <Link
                                key={category.id}
                                href={`/category/${category.slug}`}
                                className="relative h-40 sm:h-44 md:h-52 rounded-2xl overflow-hidden group block"
                            >
                                {category.imageUrl ? (
                                    <Image
                                        src={category.imageUrl}
                                        alt={category.name}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        sizes="(max-width: 640px) 50vw, 33vw"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent group-hover:from-black/50 transition-colors" />
                                <div className="absolute bottom-4 left-4 right-4 z-10">
                                    <h3 className="text-white font-bold text-sm sm:text-base md:text-lg drop-shadow-md">
                                        {category.name}
                                    </h3>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
