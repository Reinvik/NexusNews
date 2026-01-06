import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { type NewsItem } from "./analyzer";

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

export class GeminiProcessor {
    private genAI: GoogleGenerativeAI | null = null;
    private model: GenerativeModel | null = null;

    constructor() {
        if (API_KEY) {
            this.genAI = new GoogleGenerativeAI(API_KEY);
            this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        }
    }

    async smartCluster(articles: NewsItem[]): Promise<number[][]> {
        if (!this.model || articles.length === 0) return [];

        // Prepare a simplified list for the prompt to save tokens
        const simplifiedList = articles.map((a, index) => ({
            id: index,
            title: a.title,
            desc: a.description?.substring(0, 100) || ""
        }));

        const prompt = `
        You are an expert news aggregator. Group the following news articles into clusters based on the EVENT they are reporting.
        Articles about the EXACT SAME event/topic should be in the same cluster.
        If an article is unique, it should be in its own cluster.
        
        Input Articles:
        ${JSON.stringify(simplifiedList)}

        Return a STRICT JSON array of arrays of IDs. Each inner array is a cluster.
        Example: [[0, 2], [1], [3, 4, 5]]
        DO NOT return markdown code blocks. Just the JSON string.
        `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Clean markdown if present (Gemini often adds \`\`\`json)
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

            const clusters: number[][] = JSON.parse(cleanText);
            return clusters;
        } catch (error) {
            console.error("Gemini Clustering Error:", error);
            return []; // Fallback to empty (will trigger fallback logic in caller)
        }
    }

    async analyzeCluster(articles: NewsItem[]): Promise<any> {
        if (!this.model || articles.length === 0) return null;

        const simplifiedList = articles.map(a =>
            `- Fuente: ${a.source} (${a.bias || 'Unknown'})\n  Titular: ${a.title}\n  Resumen: ${a.description || ''}`
        ).join('\n\n');

        const prompt = `
        Actúa como un Auditor de Datos y Analista Político Senior experto en el ecosistema de medios chileno.

        CONTEXTO: Se te entregan un grupo de artículos sobre un mismo evento noticioso provenientes de diferentes fuentes. Tu misión es diseccionar la cobertura para exponer las discrepancias y los "puntos ciegos" informativos.

        INSTRUCCIONES DE ANÁLISIS:
        Realiza una "Auditoría Lineal" de cada fuente proporcionada. Para cada artículo, identifica su framing (enfoque), lo que oculta (puntos ciegos) y un adjetivo crítico que defina su tono.

        FORMATO DE SALIDA (ESTRICTO JSON):
        Debes responder únicamente con un objeto JSON siguiendo esta estructura:

        {
            "resumen_ejecutivo": "Identifica el patrón general...",
            "auditoria_lineal": [
                // DEBE haber una entrada por cada artículo provisto, en el MISMO ORDEN.
                {
                    "meta": {
                        "sesgo": "Izquierda",
                        "medio": "La Tercera",
                        "titular": "..."
                    },
                    "analisis_especifico": {
                        "framing": "...",
                        "puntos_ciegos": "...",
                        "adjetivo_critico": "..."
                    },
                    "kpis": {
                        "polarizacion": 1-10,
                        "neutralidad": 1-10,
                        "sensacionalismo": 1-10
                    }
                }
                // ... repite para CADA artículo en el input
            ],
            "kpis": {
                "polarizacion": 8.2, // Escala 1-10
                "diversidad": "ALTA" | "MEDIA" | "BAJA"
            }
        }

        Retorna SOLO el JSON válido. Sin bloques de código markdown.
        `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Clean markdown
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

            return JSON.parse(cleanText);
        } catch (error) {
            console.error("Gemini Analysis Error:", error);
            return null;
        }
    }
}
