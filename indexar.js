// indexar-api.js
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Pinecone } = require("@pinecone-database/pinecone");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const path = require("path");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_HOST_URL = process.env.PINECONE_HOST_URL; 
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME; 

const PDF_PATH = path.resolve('./uploads/convocatoriafeb26-ene27.pdf');
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
const index = pinecone.index(PINECONE_INDEX_NAME);


function chunkText(text, maxLen = 800, overlap = 200) {
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

async function getEmbedding(text) {
    try {
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await model.embedContent(text);
        const embedding = result.embedding;
        return embedding.values; 
    } catch (error) {
        console.error("Error al obtener embedding de Gemini:", error.message);
        throw error;
    }
}

async function loadAndIndexPDF() {
    console.log("Iniciando indexación con APIs...");
    try {
        const fileBuffer = fs.readFileSync(PDF_PATH);
        const data = await pdfParse(fileBuffer);
        const text = data.text || "";
        if (!text.trim()) throw new Error("PDF sin texto.");

        const chunks = chunkText(text, 700, 100);
        console.log(`PDF dividido en ${chunks.length} chunks.`);

        const batchSize = 100;
        for (let i = 0; i < chunks.length; i += batchSize) {
            const batchChunks = chunks.slice(i, i + batchSize);
            console.log(`Procesando batch ${Math.floor(i / batchSize) + 1}...`);

            const vectorsToUpsert = [];

            for (let j = 0; j < batchChunks.length; j++) {
                const chunk = batchChunks[j];
                const id = `chunk_${i + j}`;
                const embedding = await getEmbedding(chunk);
                vectorsToUpsert.push({
                    id: id,
                    values: embedding,
                    metadata: {
                        text: chunk 
                    }
                });
            }
            await index.upsert(vectorsToUpsert);
        }
        
        console.log("¡Indexación completada exitosamente en Pinecone!");

    } catch (err) {
        console.error("Error durante la indexación:", err.message);
    }
}

loadAndIndexPDF();