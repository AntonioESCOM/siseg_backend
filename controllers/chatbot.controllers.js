const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Pinecone } = require("@pinecone-database/pinecone");
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ; 
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_HOST_URL = process.env.PINECONE_HOST_URL; 
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME; 

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
const index = pinecone.index(PINECONE_INDEX_NAME);

async function getEmbedding(text) {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    const embedding = result.embedding;
    return embedding.values;
}

async function generateResponse(prompt) {
    const model = genAI.getGenerativeModel({ model: "models/gemini-flash-latest" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}
const actions = {};

actions.chatbotQuery = async (req, res) => {
    try {
        const { question } = req.body || {};
        if (!question || !question.trim()) {
            return res.status(400).json({ error: 1, message: "Falta 'question'" });
        }

        const queryEmbedding = await getEmbedding(question);

        const results = await index.query({
            vector: queryEmbedding,
            topK: 3, 
            includeMetadata: true, 
        });

        const contextChunks = results.matches.map(match => match.metadata.text);
        const context = contextChunks.join("\n\n---\n\n");

        const prompt = `
            Instrucción Estricta: Eres un asistente experto en el documento de servicio social.
            Tu tarea es responder la pregunta del usuario basándote ÚNICA Y EXCLUSIVAMENTE en el siguiente CONTEXTO.
            No puedes usar ningún conocimiento externo.
            Si la respuesta no se encuentra en el CONTEXTO, debes decir: "No tengo respuesta para la pregunta." De lo contrario solo colca la informacion solicitada sin agregar la frase "segun el contexto proporcionado" o algo similar. o similares"

            CONTEXTO:
            ${context}

            PREGUNTA DEL USUARIO:
            ${question}

            RESPUESTA (basada solo en el contexto):
        `;
        const answer = await generateResponse(prompt);

        return res.json({
            error: 0,
            hasAnswer: true,
            answer: answer.trim()
        });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 1, message: "Error al responder." });
    }
};
module.exports = actions;