// ... (tus otras importaciones: express, prisma, etc.)
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Pinecone } = require("@pinecone-database/pinecone");

// --- Configuración (¡Reemplaza con tus valores!) ---
const GEMINI_API_KEY = "AIzaSyDWWbL2jTTymu9zwB37MPCUcNEo79L89Ho"; // Tu API Key de Google Gemini
const PINECONE_API_KEY = "pcsk_3PDaue_Q85z8zeoq2kQJVnMUwopg8r31g7qqNPYjYFb49Jz5Tb62a43VysGJyqTvmDR1vR";
const PINECONE_HOST_URL = "https://siseg-3kch4h1.svc.aped-4627-b74a.pinecone.io"; // Ej: "servicio-social-xxxx.svc.gcp-starter.pinecone.io"
const PINECONE_INDEX_NAME = "siseg"; 

// --- Inicializar Clientes (puedes hacerlo globalmente) ---
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
const index = pinecone.index(PINECONE_INDEX_NAME);

// --- Helper: Obtener Embedding desde Gemini ---
async function getEmbedding(text) {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    const embedding = result.embedding;
    return embedding.values;
}

// --- Helper: Generar Respuesta con Gemini LLM ---
async function generateResponse(prompt) {
    // Usamos un modelo de generación (Flash es rápido y gratis)
    const model = genAI.getGenerativeModel({ model: "models/gemini-flash-latest" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}
const actions = {};

// --- ¡TU NUEVA FUNCIÓN DE CHATBOT! ---
actions.chatbotQuery = async (req, res) => {
    try {
        const { question } = req.body || {};
        if (!question || !question.trim()) {
            return res.status(400).json({ error: 1, message: "Falta 'question'" });
        }

        // 1. Vectorizar la PREGUNTA del usuario
        const queryEmbedding = await getEmbedding(question);

        // 2. Buscar en Pinecone los chunks más relevantes
        const results = await index.query({
            vector: queryEmbedding,
            topK: 3, // Pedimos los 3 chunks más similares
            includeMetadata: true, // ¡Importante para obtener el texto!
        });

        // 3. Extraer el contexto de la metadata
        const contextChunks = results.matches.map(match => match.metadata.text);
        const context = contextChunks.join("\n\n---\n\n");

        // 4. Construir el Prompt para el LLM (¡MUY IMPORTANTE!)
        const prompt = `
            Instrucción Estricta: Eres un asistente experto en el documento de servicio social.
            Tu tarea es responder la pregunta del usuario basándote ÚNICA Y EXCLUSIVAMENTE en el siguiente CONTEXTO.
            No puedes usar ningún conocimiento externo.
            Si la respuesta no se encuentra en el CONTEXTO, debes decir: "No encontré la información en el documento."

            CONTEXTO:
            ${context}

            PREGUNTA DEL USUARIO:
            ${question}

            RESPUESTA (basada solo en el contexto):
        `;

        // 5. Generar la respuesta usando el LLM de Gemini
        const answer = await generateResponse(prompt);

        return res.json({
            error: 0,
            hasAnswer: true,
            answer: answer.trim(),
            sourceContext: contextChunks // Opcional: devolver el contexto usado
        });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 1, message: "Error al responder." });
    }
};

// ... (El resto de tu código de servidor)
module.exports = actions;