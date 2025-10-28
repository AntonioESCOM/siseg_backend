const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');
const sw = require('stopword');
const fs = require('fs').promises;
const pdfParse = require('pdf-parse');

let INDEX = null;  
const PDF_PATH = path.resolve('./documents/convocatoria.pdf');
const ES_STOPWORDS = new Set(sw.es.concat([
  "éste","ése","aquél","ésta","ésa","aquélla","éstos","ésos","aquéllos",
  "éstas","ésas","aquéllas","éste","ésta","ésto","éstas","éstos",
  "—","–","…","º","ª","“","”","«","»"
]).map(s => s.toLowerCase()));

function normalizeText(t) {
  return t
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ") // quitar signos/rare chars
    .trim();
}

function tokenizeSpanish(t) {
  const norm = normalizeText(t);
  const tokens = norm.split(/\s+/);
  return tokens.filter(tok => tok && !ES_STOPWORDS.has(tok));
}

// ====== Cargar y analizar el PDF (sólo una vez en el servidor) ======
async function loadAndIndexPDF() {
  try {
    const fileBuffer = fs.readFileSync(PDF_PATH);
    const data = await pdfParse(fileBuffer);
    const text = data.text || "";
    if (!text.trim()) {
      throw new Error("El PDF no contiene texto extraíble.");
    }
    const chunks = chunkText(text, 900, 250); // Ajusta según el tamaño
    if (chunks.length === 0) {
      throw new Error("No se pudo procesar el contenido del PDF.");
    }

    // Crear índice de texto
    INDEX = buildIndexFromChunks(chunks);
    console.log("Índice cargado exitosamente.");
  } catch (err) {
    console.error("Error al cargar y procesar el PDF:", err.message);
  }
}

// Procesar el contenido del PDF en 'chunks' de tamaño adecuado
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

// Generar el índice con TF-IDF
function buildIndexFromChunks(chunks) {
  const tokenized = chunks.map(c => tokenizeSpanish(c));
  const vocab = new Map();
  const df = new Map();

  tokenized.forEach((tokens) => {
    const seen = new Set();
    tokens.forEach(tok => {
      if (!vocab.has(tok)) vocab.set(tok, vocab.size);
      if (!seen.has(tok)) {
        seen.add(tok);
        df.set(tok, (df.get(tok) || 0) + 1);
      }
    });
  });

  const N = chunks.length;
  const idf = new Map();
  for (const [term, dfi] of df.entries()) {
    idf.set(term, Math.log((N + 1) / (dfi + 1)) + 1);
  }

  const vectors = [];
  const norms = [];

  for (const tokens of tokenized) {
    const tf = new Map();
    tokens.forEach(tok => tf.set(tok, (tf.get(tok) || 0) + 1));

    const len = tokens.length || 1;
    const v = new Map();
    for (const [term, freq] of tf.entries()) {
      const w = (freq / len) * (idf.get(term) || 0);
      if (w > 0) v.set(term, w);
    }

    let sumsq = 0;
    for (const w of v.values()) sumsq += w * w;
    vectors.push(v);
    norms.push(Math.sqrt(sumsq) || 1e-12);
  }

  return { chunks, vocab, idf, vectors, norms };
}

// Vectorizar la consulta
function vectorizeQuery(q, idf) {
  const tokens = tokenizeSpanish(q);
  const tf = new Map();
  tokens.forEach(tok => tf.set(tok, (tf.get(tok) || 0) + 1));
  const len = tokens.length || 1;

  const v = new Map();
  for (const [term, freq] of tf.entries()) {
    const w = (freq / len) * (idf.get(term) || 0);
    if (w > 0) v.set(term, w);
  }
  let sumsq = 0;
  for (const w of v.values()) sumsq += w * w;
  const norm = Math.sqrt(sumsq) || 1e-12;
  return { v, norm };
}

// Calcular similitud coseno
function cosineSim(vecA, normA, vecB, normB) {
  const [small, large] = vecA.size < vecB.size ? [vecA, vecB] : [vecB, vecA];
  let dot = 0;
  for (const [term, w] of small.entries()) {
    const wb = large.get(term);
    if (wb) dot += w * wb;
  }
  return dot / (normA * normB);
}
