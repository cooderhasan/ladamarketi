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

    // 1. Get all data with images
    const [products, categories, sliders] = await Promise.all([
        prisma.product.findMany({
            select: { id: true, images: true },
            where: { images: { isEmpty: false } }
        }),
        prisma.category.findMany({
            select: { id: true, imageUrl: true },
            where: {
                AND: [
                    { imageUrl: { not: null } },
                    { imageUrl: { not: "" } }
                ]
            }
        }),
        prisma.slider.findMany({
            select: { id: true, imageUrl: true },
            where: { imageUrl: { not: "" } }
        })
    ]);

    console.log(`📦 Veriler toplandı: ${products.length} ürün, ${categories.length} kategori, ${sliders.length} slider.`);

    let downloadQueue: { url: string; path: string }[] = [];

    // Products
    for (const p of products) {
        for (const imgUrl of p.images) {
            addIfMissing(imgUrl, downloadQueue);
        }
    }

    // Categories
    for (const c of categories) {
        if (c.imageUrl) addIfMissing(c.imageUrl, downloadQueue);
    }

    // Sliders
    for (const s of sliders) {
        if (s.imageUrl) addIfMissing(s.imageUrl, downloadQueue);
    }

    console.log(`⬇️ İndirilecek yeni resim sayısı: ${downloadQueue.length}`);
    if (downloadQueue.length === 0) {
        console.log('✅ Tüm resimler zaten mevcut veya indirilecek resim bulunamadı.');
        return;
    }

    // 3. Process queue
    let processed = 0;
    const total = downloadQueue.length;
    const chunked = chunk(downloadQueue, CONCURRENCY);

    for (const batch of chunked) {
        await Promise.all(batch.map(async (item) => {
            try {
                await downloadFile(item.url, item.path);
                processed++;
                process.stdout.write(`\r✅ İlerleme: ${processed}/${total}`);
            } catch (error) {
                // Sadece 404 değilse hata bas, bazı resimler silinmiş olabilir
                if (!(error as any).message.includes('404')) {
                    console.error(`\n❌ Hata: ${item.url} -> ${(error as Error).message}`);
                }
            }
        }));
    }

    console.log('\n🏁 İşlem Tamamlandı.');
}

function addIfMissing(imgUrl: string, queue: { url: string; path: string }[]) {
    // URL kontrolü - Eğer zaten tam URL ise (https://...) indirmeyebiliriz veya başka işlem yapabiliriz
    if (imgUrl.startsWith('http')) return;

    const targetPath = path.join(process.cwd(), 'public', imgUrl);
    const sourceUrl = `${BASE_URL}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`;

    if (!fs.existsSync(targetPath)) {
        queue.push({ url: sourceUrl, path: targetPath });
    }
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
