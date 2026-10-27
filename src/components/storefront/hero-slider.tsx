"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
    // Fare üstündeyken (masaüstü) otomatik geçiş durur; kullanıcı yazıyı okurken slayt değişmesin
    const [paused, setPaused] = useState(false);
    const touchStartX = useRef<number | null>(null);

    useEffect(() => {
        if (sliders.length <= 1 || paused) return;

        const interval = setInterval(() => {
            setCurrent((prev) => (prev + 1) % sliders.length);
        }, 6000);

        return () => clearInterval(interval);
    }, [sliders.length, paused, current]);

    const prev = () => {
        setCurrent((c) => (c === 0 ? sliders.length - 1 : c - 1));
    };

    const next = () => {
        setCurrent((c) => (c + 1) % sliders.length);
    };

    // Telefonda parmakla kaydırma (oklar telefonda gizli)
    const onTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };
    const onTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current == null || sliders.length <= 1) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
        touchStartX.current = null;
    };

    // Telefonda 400px ekranın yarısını kaplıyor ve görseli kırpıyordu
    const heightClass = "h-[220px] sm:h-[320px] md:h-[420px]";

    if (sliders.length === 0) {
        return (
            <div className={`relative ${heightClass} bg-gradient-to-br from-[#00739C] to-[#002838] flex items-center`}>
                <div className="px-6 md:px-14 text-white">
                    <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.2em] text-white/70 mb-2">Lada Marketi</p>
                    <p className="text-2xl md:text-4xl font-extrabold tracking-tight mb-4">
                        Lada yedek parçada doğru adres
                    </p>
                    <Link
                        href="/products"
                        className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#00739C] hover:bg-white/90 transition-colors"
                    >
                        Ürünleri İncele
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        );
    }

    const slide = sliders[current];

    return (
        <div
            className={`relative ${heightClass} overflow-hidden bg-[#002838]`}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            {/* Önceki mode="wait": eski slayt tamamen kaybolup sonra yenisi geliyordu, arada koyu ekran görünüyordu.
                Şimdi iki slayt üst üste yumuşak geçiş yapıyor */}
            <AnimatePresence initial={false}>
                <motion.div
                    key={slide.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0"
                >
                    {/* Background */}
                    {slide.imageUrl && (
                        <Image
                            src={slide.imageUrl}
                            alt={slide.title || ""}
                            fill
                            className="object-cover object-center md:object-right"
                            priority={current === 0}
                            sizes="(max-width: 1024px) 100vw, 75vw"
                        />
                    )}
                    {/* Yazı okunurluğu için soldan marka tonlu koyu geçiş */}
                    {(slide.title || slide.subtitle) && (
                        <div className="absolute inset-0 bg-gradient-to-r from-[#002838]/75 via-[#002838]/35 to-transparent" />
                    )}

                    {/* Content */}
                    <div className="relative z-10 h-full flex items-center">
                        <div className="px-6 sm:px-10 md:px-20 max-w-2xl">
                            {slide.title && (
                                <motion.h2
                                    initial={{ y: 16, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.25, duration: 0.5 }}
                                    className="text-xl sm:text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight mb-2 md:mb-4 drop-shadow-sm"
                                >
                                    {slide.title}
                                </motion.h2>
                            )}
                            {slide.subtitle && (
                                <motion.p
                                    initial={{ y: 16, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4, duration: 0.5 }}
                                    className="text-sm sm:text-base md:text-xl text-white/85 mb-4 md:mb-7"
                                >
                                    {slide.subtitle}
                                </motion.p>
                            )}
                            {slide.linkUrl && (
                                <motion.div
                                    initial={{ y: 16, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.55, duration: 0.5 }}
                                >
                                    <Link
                                        href={slide.linkUrl}
                                        className="group/cta inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-[#0aa6dd] to-[#0088bb] px-4 py-2 md:px-6 md:py-3 text-xs md:text-base font-bold text-white shadow-lg shadow-black/20 ring-1 ring-inset ring-white/15 hover:from-[#0088bb] hover:to-[#00739C] transition-colors"
                                    >
                                        Hemen İncele
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover/cta:translate-x-0.5" />
                                    </Link>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            {sliders.length > 1 && (
                <>
                    <button
                        type="button"
                        onClick={prev}
                        aria-label="Önceki slayt"
                        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm ring-1 ring-white/25 items-center justify-center text-white hover:bg-white/30 transition-colors"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        onClick={next}
                        aria-label="Sonraki slayt"
                        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm ring-1 ring-white/25 items-center justify-center text-white hover:bg-white/30 transition-colors"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>

                    {/* Dots */}
                    <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 rounded-full bg-black/20 backdrop-blur-sm px-2.5 py-1.5">
                        {sliders.map((s, index) => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => setCurrent(index)}
                                aria-label={`${index + 1}. slayt`}
                                aria-current={index === current}
                                className={`h-1.5 rounded-full transition-all ${index === current
                                    ? "bg-white w-5"
                                    : "bg-white/50 hover:bg-white/80 w-1.5"
                                    }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
