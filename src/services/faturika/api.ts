/**
 * Faturika Public API v1 istemcisi.
 * Sözleşme: openapi.yaml ve entegrasyon-rehberi.md (v1.21).
 *
 * Yalnız sunucu tarafında kullanılır: FATURIKA_API_KEY tarayıcıya gitmez.
 * Test ortamı yoktur; canlı anahtarla çalışır. Gerçek gönderimi FATURIKA_MODE=live açar, varsayılan "draft".
 */

import type { ContactPayload, DocumentPayload } from "@/services/faturika/mapper";

const BASE_URL = "https://faturika.com/papi/v1";
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_RETRIES = 2;
const MAX_RETRY_WAIT_SECONDS = 15;

export type FaturikaMode = "draft" | "live";

export interface FaturikaAccount {
    legal_name: string;
    tax_number: string;
    credits: { balance: number };
    profile: { complete: boolean; missing: string[] };
    ready: boolean;
    blockers: { code: string; scope: string; message: string }[];
}

/** Ayarlar sayfasındaki hazırlık kartının verisi */
export interface FaturikaReadiness {
    configured: boolean;
    mode: FaturikaMode;
    account?: FaturikaAccount;
    error?: string;
}

export interface TaxpayerResult {
    tax_number: string;
    is_einvoice_user: boolean;
    is_edespatch_user: boolean;
    suggested_document_type: "einvoice_outgoing" | "earchive";
    title?: string | null;
}

export interface ContactResult {
    id: number;
    created: boolean;
    title: string;
    tax_number: string;
}

export interface DocumentSummary {
    uuid: string;
    document_number: string | null;
    document_type: string;
    status: string;
    issue_date: string;
    grand_total: string;
    payable_total: string;
    sendable: boolean;
    warning: string | null;
}

export interface DocumentDetail extends DocumentSummary {
    ettn: string | null;
    provider_status: string | null;
    last_error: string | null;
}

/** Faturika'nın {code, message} hata zarfı. message Türkçedir ve kullanıcıya gösterilebilir. */
export class FaturikaError extends Error {
    constructor(
        message: string,
        readonly status: number,
        readonly code: string,
        readonly body?: unknown,
    ) {
        super(message);
        this.name = "FaturikaError";
    }
}

export function getFaturikaMode(): FaturikaMode {
    return process.env.FATURIKA_MODE === "live" ? "live" : "draft";
}

export function isFaturikaConfigured(): boolean {
    return Boolean(process.env.FATURIKA_API_KEY?.trim());
}

function retryWaitSeconds(res: Response, body: { retry_after?: number } | null): number | null {
    const code = (body as { code?: string } | null)?.code;
    const retriable = res.status === 429 || (res.status === 409 && code === "IDEMPOTENCY_IN_PROGRESS");
    if (!retriable) return null;
    const wait = Number(res.headers.get("retry-after") ?? body?.retry_after ?? 5);
    return Number.isFinite(wait) && wait <= MAX_RETRY_WAIT_SECONDS ? Math.max(wait, 1) : null;
}

async function request<T>(
    method: "GET" | "POST" | "PATCH" | "DELETE",
    path: string,
    options: { body?: unknown; idempotencyKey?: string } = {},
): Promise<T> {
    const apiKey = process.env.FATURIKA_API_KEY?.trim();
    if (!apiKey) {
        throw new FaturikaError("Faturika API anahtarı tanımlı değil.", 0, "NOT_CONFIGURED");
    }

    const headers: Record<string, string> = { "X-Api-Key": apiKey, Accept: "application/json" };
    if (options.body !== undefined) headers["Content-Type"] = "application/json";
    if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;

    // 401 asla tekrarlanmaz: geçersiz anahtar denemeleri sunucunun IP'sini geçici olarak kilitler (rehber §2)
    for (let attempt = 0; ; attempt++) {
        let res: Response;
        try {
            res = await fetch(`${BASE_URL}${path}`, {
                method,
                headers,
                body: options.body === undefined ? undefined : JSON.stringify(options.body),
                signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
                cache: "no-store",
            });
        } catch {
            throw new FaturikaError("Faturika'ya ulaşılamadı. Lütfen tekrar deneyin.", 0, "NETWORK");
        }

        if (res.status === 204) return undefined as T;

        const body = await res.json().catch(() => null);
        if (res.ok) return body as T;

        const wait = retryWaitSeconds(res, body);
        if (wait !== null && attempt < MAX_RETRIES) {
            await new Promise((resolve) => setTimeout(resolve, wait * 1000));
            continue;
        }

        throw new FaturikaError(
            body?.message || `Faturika beklenmeyen bir yanıt verdi (HTTP ${res.status}).`,
            res.status,
            body?.code || "HTTP_ERROR",
            body,
        );
    }
}

export function getAccount() {
    return request<FaturikaAccount>("GET", "/account");
}

export function queryTaxpayer(taxNumber: string) {
    return request<TaxpayerResult>("POST", "/taxpayers/query", { body: { tax_number: taxNumber } });
}

export function upsertContact(payload: ContactPayload) {
    return request<ContactResult>("POST", "/contacts", { body: payload });
}

export function createDraft(payload: DocumentPayload, idempotencyKey: string) {
    return request<DocumentSummary>("POST", "/documents", { body: payload, idempotencyKey });
}

export function getDocument(uuid: string) {
    return request<DocumentDetail>("GET", `/documents/${encodeURIComponent(uuid)}`);
}

/** 1 kontör düşer. Bu uç idempotent değildir: çağırmadan önce belgenin durumu okunmalıdır. */
export function sendDocument(uuid: string) {
    return request<DocumentSummary>("POST", `/documents/${encodeURIComponent(uuid)}/send`, { body: {} });
}

export function redateDocument(uuid: string, issueDate: string) {
    return request<DocumentSummary>("PATCH", `/documents/${encodeURIComponent(uuid)}`, {
        body: { issue_date: issueDate },
    });
}

export function deleteDocument(uuid: string) {
    return request<void>("DELETE", `/documents/${encodeURIComponent(uuid)}`);
}
