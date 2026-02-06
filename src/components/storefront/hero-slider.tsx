"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

interface Slider {
    id: string;
    title: string | null;
    subtitle: string | null;
    imageUrl: string;
    linkUrl: string | null;
}

interface HeroSliderProps {
    sliders: Slider[];
}

export function HeroSlider({ sliders }: HeroSliderProps) {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        if (sliders.length <= 1) return;

        const interval = setInterval(() => {
            setCurrent((prev) => (prev + 1) % sliders.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [sliders.length]);

    const prev = () => {
        setCurrent((c) => (c === 0 ? sliders.length - 1 : c - 1));
    };

    const next = () => {
        setCurrent((c) => (c + 1) % sliders.length);
    };

    if (sliders.length === 0) {
        return (
            <div className="relative h-[400px] md:h-[500px] bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                <div className="text-center text-white px-4">
                    <h1 className="text-3xl md:text-5xl font-bold mb-4">
                        B2B Toptancı E-Ticaret
                    </h1>
                    <p className="text-xl text-blue-100 mb-6">
                        Bayilere özel fiyatlarla toptan alışveriş
                    </p>
                    <Link href="/products">
                        <Button size="lg" variant="secondary">
                            Ürünleri Keşfet
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-[400px] md:h-[500px] overflow-hidden">
            {sliders.map((slider, index) => (
                <div
                    key={slider.id}
                    className={`absolute inset-0 transition-opacity duration-500 ${index === current ? "opacity-100" : "opacity-0"
                        }`}
                >
                    {/* Background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-900/70 to-gray-900/30 z-10" />
                    <div className="absolute inset-0 bg-blue-600">
                        {slider.imageUrl && (
                            <Image
                                src={slider.imageUrl}
                                alt={slider.title || ""}
                                fill
                                className="object-cover"
                                priority={index === 0}
                            />
                        )}
                    </div>

                    {/* Content */}
                    <div className="relative z-20 h-full flex items-center">
                        <div className="container mx-auto px-4">
                            <div className="max-w-2xl">
                                {slider.title && (
                                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                                        {slider.title}
                                    </h2>
                                )}
                                {slider.subtitle && (
                                    <p className="text-xl text-gray-200 mb-6">
                                        {slider.subtitle}
                                    </p>
                                )}
                                {slider.linkUrl && (
                                    <Link href={slider.linkUrl}>
                                        <Button size="lg">Keşfet</Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {/* Navigation */}
            {sliders.length > 1 && (
                <>
                    <button
                        onClick={prev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>

                    {/* Dots */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                        {sliders.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrent(index)}
                                className={`w-2 h-2 rounded-full transition-all ${index === current
                                        ? "bg-white w-6"
                                        : "bg-white/50 hover:bg-white/75"
                                    }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
