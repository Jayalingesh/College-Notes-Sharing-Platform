const fs = require("fs");
const path = require("path");

const MAX_CHARS = 60000; // keeps requests fast and inside free-tier limits
const MIN_PDF_TEXT = 200; // fewer characters than this = probably a scanned PDF
const MAX_INLINE_BYTES = 15 * 1024 * 1024;

const IMAGE_MIME = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
};

const httpError = (status, message) => Object.assign(new Error(message), { status });

const pdfToText = async (buffer) => {
    const { PDFParse } = require("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
        const result = await parser.getText();
        return result.text || "";
    } finally {
        await parser.destroy().catch(() => {});
    }
};

const clean = (text) =>
    text
        .replace(/\r/g, "")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

// Returns { text } for readable text, or { inline: { mime_type, data } }
// when the file has to be read by the AI model itself (images, scanned PDFs).
const extractNoteContent = async (note) => {
    const filePath = path.join(__dirname, "..", note.fileUrl);

    if(!fs.existsSync(filePath)) {
        throw httpError(410, "The original file is no longer on the server, so AI tools can't read it");
    }

    const ext = path.extname(note.fileName || filePath).toLowerCase();
    const buffer = fs.readFileSync(filePath);

    if(ext === ".txt") {
        return { text: clean(buffer.toString("utf8")).slice(0, MAX_CHARS) };
    }

    if(ext === ".docx") {
        const mammoth = require("mammoth");
        const result = await mammoth.extractRawText({ buffer });
        const text = clean(result.value || "");
        if(!text) throw httpError(422, "No readable text found in this document");
        return { text: text.slice(0, MAX_CHARS) };
    }

    if(ext === ".pdf") {
        let text = "";
        try {
            text = clean(await pdfToText(buffer));
        } catch(err) {
            console.warn("pdf-parse failed, falling back to AI file reading:", err.message);
        }
        if(text.length >= MIN_PDF_TEXT) return { text: text.slice(0, MAX_CHARS) };

        // Scanned / image-only PDF: let the model read the file directly
        if(buffer.length > MAX_INLINE_BYTES) {
            throw httpError(422, "This scanned PDF is too large for AI tools (max 15 MB)");
        }
        return { inline: { mime_type: "application/pdf", data: buffer.toString("base64") } };
    }

    if(IMAGE_MIME[ext]) {
        if(buffer.length > MAX_INLINE_BYTES) {
            throw httpError(422, "This image is too large for AI tools (max 15 MB)");
        }
        return { inline: { mime_type: IMAGE_MIME[ext], data: buffer.toString("base64") } };
    }

    throw httpError(
        415,
        "AI tools support PDF, DOCX, TXT and image notes. PPT/PPTX and old DOC files aren't supported yet"
    );
};

module.exports = { extractNoteContent, httpError };
