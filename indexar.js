// indexar-api.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Pinecone } = require("@pinecone-database/pinecone");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const path = require("path");

// --- Configuración (¡Reemplaza con tus valores!) ---
const GEMINI_API_KEY = "AIzaSyDWWbL2jTTymu9zwB37MPCUcNEo79L89Ho"; // Tu API Key de Google Gemini
const PINECONE_API_KEY = "pcsk_3PDaue_Q85z8zeoq2kQJVnMUwopg8r31g7qqNPYjYFb49Jz5Tb62a43VysGJyqTvmDR1vR";
const PINECONE_HOST_URL = "https://siseg-3kch4h1.svc.aped-4627-b74a.pinecone.io"; // Ej: "servicio-social-xxxx.svc.gcp-starter.pinecone.io"
const PINECONE_INDEX_NAME = "siseg"; // El nombre que pusiste en Pinecone

const PDF_PATH = path.resolve('./uploads/infogeneralserviciosocialenmh.pdf');

// --- Inicializar Clientes ---
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
const index = pinecone.index(PINECONE_INDEX_NAME);

// --- Tu función de Chunking (sin cambios) ---
function chunkText(text, maxLen = 800, overlap = 200) {
    // ... (tu código de chunkText va aquí) ...
    const paras = text.split(/\n{2,}/);
    const chunks = [];
    let current = "";
    for (const p of paras) {
        const candidate = (current ? current + "\n\n" : "") + p;
        if (candidate.length <= maxLen) {
            current = candidate;
        } else {
            if (current) chunks.push(current);
            if (p.length > maxLen) {
                let start = 0;
                while (start < p.length) {
                    const end = Math.min(start + maxLen, p.length);
                    chunks.push(p.slice(start, end));
                    start = Math.max(end - overlap, end);
                }
                current = "";
            } else {
                current = p;
            }
        }
    }
    if (current) chunks.push(current);
    return chunks;
}

// --- Nueva Función: Obtener Embedding desde Gemini ---
async function getEmbedding(text) {
    try {
        // Usamos el modelo de embedding de Google
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await model.embedContent(text);
        const embedding = result.embedding;
        return embedding.values; // Devuelve el array de 768 números
    } catch (error) {
        console.error("Error al obtener embedding de Gemini:", error.message);
        throw error;
    }
}

// --- Función Principal de Indexación ---
async function loadAndIndexPDF() {
    console.log("Iniciando indexación con APIs...");
    try {
        // 1. Cargar y Parsear PDF (Tu código)
        const fileBuffer = fs.readFileSync(PDF_PATH);
        const data = await pdfParse(fileBuffer);
        const text = data.text || "";
        if (!text.trim()) throw new Error("PDF sin texto.");

        // 2. Crear Chunks (Tu código)
        const chunks = chunkText(text, 700, 100);
        console.log(`PDF dividido en ${chunks.length} chunks.`);

        // 3. Vectorizar y Almacenar Chunks en Pinecone
        // Pinecone permite subir en "batches" (lotes) para más eficiencia
        const batchSize = 100;
        for (let i = 0; i < chunks.length; i += batchSize) {
            const batchChunks = chunks.slice(i, i + batchSize);
            console.log(`Procesando batch ${Math.floor(i / batchSize) + 1}...`);

            const vectorsToUpsert = [];

            for (let j = 0; j < batchChunks.length; j++) {
                const chunk = batchChunks[j];
                const id = `chunk_${i + j}`;

                // 3a. Obtener embedding de Gemini
                const embedding = await getEmbedding(chunk);

                // 3b. Preparar el vector para Pinecone
                vectorsToUpsert.push({
                    id: id,
                    values: embedding,
                    metadata: {
                        text: chunk // ¡Guardamos el texto original aquí!
                    }
                });
            }

            // 3c. Subir el lote a Pinecone
            await index.upsert(vectorsToUpsert);
        }
        
        console.log("¡Indexación completada exitosamente en Pinecone!");

    } catch (err) {
        console.error("Error durante la indexación:", err.message);
    }
}

loadAndIndexPDF();