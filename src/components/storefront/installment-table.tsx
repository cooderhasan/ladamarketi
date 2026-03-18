"use client";

import { useEffect, useRef } from "react";

interface InstallmentTableProps {
    price: number;
}

const PAYTR_TOKEN = "9b1ae477fc7a222ba4e52328780a106f96b0ecfeab47494afbd0e8c74107645c";
const PAYTR_MERCHANT_ID = "278525";

export function InstallmentTable({ price }: InstallmentTableProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const scriptRef = useRef<HTMLScriptElement | null>(null);

    // Fiyatı PayTR'nin beklediği formata çevir (örn: 1881.38)
    const formattedPrice = price.toFixed(2);

    useEffect(() => {
        const containerId = "paytr_taksit_tablosu";

        // Önceki script varsa kaldır
        if (scriptRef.current) {
            scriptRef.current.remove();
            scriptRef.current = null;
        }

        // Konteyneri temizle
        const container = document.getElementById(containerId);
        if (container) container.innerHTML = "";

        // Yeni script ekle
        const script = document.createElement("script");
        script.src = `https://www.paytr.com/odeme/taksit-tablosu/v2?token=${PAYTR_TOKEN}&merchant_id=${PAYTR_MERCHANT_ID}&amount=${formattedPrice}&taksit=0&tumu=0`;
        script.async = true;
        document.body.appendChild(script);
        scriptRef.current = script;

        return () => {
            if (scriptRef.current) {
                scriptRef.current.remove();
                scriptRef.current = null;
            }
        };
    }, [formattedPrice]);

    return (
        <>
            <style>{`
                #paytr_taksit_tablosu {
                    clear: both;
                    font-size: 12px;
                    max-width: 100%;
                    text-align: center;
                    font-family: Arial, sans-serif;
                }
                #paytr_taksit_tablosu::before { display: table; content: " "; }
                #paytr_taksit_tablosu::after { content: ""; clear: both; display: table; }
                .taksit-tablosu-wrapper {
                    margin: 5px;
                    width: 260px;
                    padding: 12px;
                    cursor: default;
                    text-align: center;
                    display: inline-block;
                    border: 1px solid #e1e1e1;
                    border-radius: 8px;
                }
                .taksit-logo img { max-height: 28px; padding-bottom: 10px; }
                .taksit-tutari-text { float: left; width: 126px; color: #a2a2a2; margin-bottom: 5px; }
                .taksit-tutar-wrapper { display: inline-block; background-color: #f7f7f7; }
                .taksit-tutar-wrapper:hover { background-color: #e8e8e8; }
                .taksit-tutari { float: left; width: 126px; padding: 6px 0; color: #474747; border: 2px solid #ffffff; }
                .taksit-tutari-bold { font-weight: bold; }
                @media all and (max-width: 600px) {
                    .taksit-tablosu-wrapper { margin: 5px 0; width: 100%; }
                }
            `}</style>
            <div id="paytr_taksit_tablosu" ref={containerRef} />
        </>
    );
}
