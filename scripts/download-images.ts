import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

/**
 * IMAGE DOWNLOAD SCRIPT
 * Source: https://www.ladamarketi.com/img/p/...
 * Target: ./public/img/p/...
 * Strategy:
 * 1. Fetch all products from DB.
 * 2. identifying missing images locally.
 * 3. Download concurrently with limit.
 */

const prisma = new PrismaClient();
const BASE_URL = 'https://www.ladamarketi.com';
const TARGET_DIR = path.join(process.cwd(), 'public', 'img', 'p');
const CONCURRENCY = 5;

async function main() {
    console.log('🚀 Resim indirme aracı başlatılıyor...');

    // 1. Get all products with images
    const products = await prisma.product.findMany({
        select: { id: true, images: true },
        where: { images: { isEmpty: false } } // Ensure we only get products with images
    });

    console.log(`📦 Toplam ${products.length} ürün bulundu.`);

    let downloadQueue: { url: string; path: string }[] = [];

    // 2. Prepare download queue
    for (const p of products) {
        // images stored as: ["/img/p/1/2/3/123.jpg", ...]
        // We need to extract the ID and structure
        for (const imgUrl of p.images) {
            // imgUrl ex: /img/p/1/2/12.jpg
            // We want to download from: BASE_URL + imgUrl
            // Save to: public + imgUrl

            const targetPath = path.join(process.cwd(), 'public', imgUrl);
            const sourceUrl = `${BASE_URL}${imgUrl}`;

            // Check if exists
            if (!fs.existsSync(targetPath)) {
                downloadQueue.push({ url: sourceUrl, path: targetPath });
            }
        }
    }

    console.log(`⬇️ İndirilecek resim sayısı: ${downloadQueue.length}`);
    if (downloadQueue.length === 0) {
        console.log('✅ Tüm resimler zaten mevcut.');
        return;
    }

    // 3. Process queue
    let processed = 0;
    const total = downloadQueue.length;

    // Change limit as needed
    const chunked = chunk(downloadQueue, CONCURRENCY);

    for (const batch of chunked) {
        await Promise.all(batch.map(async (item) => {
            try {
                await downloadFile(item.url, item.path);
                processed++;
                process.stdout.write(`\r✅ İlerleme: ${processed}/${total}`);
            } catch (error) {
                console.error(`\n❌ Hata: ${item.url} -> ${(error as Error).message}`);
            }
        }));
    }

    console.log('\n🏁 İşlem Tamamlandı.');
}

async function downloadFile(url: string, destPath: string) {
    // Ensure directory exists
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (!response.body) throw new Error('No body');

    // Node.js readable stream from fetch body
    // @ts-ignore - Readable.fromWeb is available in recent Node versions but might need typecast
    const stream = Readable.fromWeb(response.body as any);
    await pipeline(stream, fs.createWriteStream(destPath));
}

function chunk<T>(arr: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
        arr.slice(i * size, i * size + size)
    );
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
