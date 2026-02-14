import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

/**
 * Cleans extracted PDF text:
 * - Collapses multiple whitespace/newlines into single spaces
 * - Removes control characters
 * - Trims leading/trailing whitespace
 */
function cleanText(raw) {
    return raw
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // strip control chars (keep \n, \r, \t)
        .replace(/\r\n/g, "\n") // normalize line endings
        .replace(/[ \t]+/g, " ") // collapse horizontal whitespace
        .replace(/\n{3,}/g, "\n\n") // max 2 consecutive newlines
        .trim();
}

/**
 * POST /education/ingest-pdf
 * Receives a PDF via multer, extracts text with pdf-parse,
 * and forwards clean text + metadata to n8n webhook.
 */
export const ingest_pdf = async (req, res) => {
    try {
        const user_id = req.user.id;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "No se recibió ningún archivo PDF.",
            });
        }

        const file = req.file;
        console.log(
            `[PDF Ingest] Received file: "${file.originalname}" (${(file.size / 1024 / 1024).toFixed(2)} MB) from user ${user_id}`,
        );

        // Extract text from PDF buffer
        let pdfData;
        try {
            pdfData = await pdfParse(file.buffer);
        } catch (parseError) {
            console.error("[PDF Ingest] pdf-parse error:", parseError.message);
            return res.status(422).json({
                success: false,
                error: "No se pudo leer el PDF. El archivo podría estar dañado o protegido con contraseña.",
            });
        }

        const extractedText = cleanText(pdfData.text);

        // Validate that we got actual text content
        if (!extractedText || extractedText.length < 10) {
            console.warn(
                `[PDF Ingest] Empty or near-empty text extracted from "${file.originalname}" (${extractedText.length} chars)`,
            );
            return res.status(422).json({
                success: false,
                error: "El PDF no contiene texto extraíble. Podría ser un documento escaneado (imagen). Intenta con un PDF que tenga texto seleccionable.",
            });
        }

        console.log(
            `[PDF Ingest] Extracted ${extractedText.length} chars, ${pdfData.numpages} pages from "${file.originalname}"`,
        );

        // Build payload for n8n
        const n8nPayload = {
            userId: user_id,
            source_type: "pdf",
            archivo_nombre: file.originalname,
            text: extractedText,
            metadatos: {
                paginas: pdfData.numpages,
                tamaño_original_bytes: file.size,
                caracteres_extraidos: extractedText.length,
            },
        };

        // Forward to n8n webhook
        const N8N_WEBHOOK_URL =
            process.env.N8N_WEBHOOK_URL ||
            "https://personal-n8n.suwsiw.easypanel.host/webhook/education";

        console.log(
            `[PDF Ingest] Forwarding extracted text to n8n: ${N8N_WEBHOOK_URL}`,
        );

        const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(n8nPayload),
        });

        if (!webhookResponse.ok) {
            const errorText = await webhookResponse.text();
            console.error(
                `[PDF Ingest] n8n error (${webhookResponse.status}):`,
                errorText,
            );
            return res.status(502).json({
                success: false,
                error: `El servidor de procesamiento respondió con error: ${webhookResponse.status}`,
                details: errorText,
            });
        }

        const webhookData = await webhookResponse.json();
        console.log("[PDF Ingest] n8n response success:", webhookData);

        // Return n8n's response to the caller
        return res.json(webhookData);
    } catch (error) {
        console.error("[PDF Ingest] Unexpected error:", error);
        return res.status(500).json({
            success: false,
            error: "Error interno al procesar el PDF.",
        });
    }
};
