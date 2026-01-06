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

    async analyzeCluster(articles: NewsItem[]): Promise<string> {
        if (!this.model || articles.length === 0) return "No se pudo realizar el análisis. (Modelo no disponible o sin artículos)";

        const simplifiedList = articles.map(a =>
            `- Fuente: ${a.source} (${a.bias || 'Unknown'})\n  Titular: ${a.title}\n  Resumen: ${a.description || ''}`
        ).join('\n\n');

        const prompt = `
        Actúa como un analista de medios experto y neutral. Analiza el siguiente grupo de noticias que cubren el MISMO evento pero desde diferentes fuentes.
        
        Tu objetivo es detectar:
        1. **Contradicciones**: ¿Hay hechos, cifras o interpretaciones que chocan directamente entre las fuentes?
        2. **Sesgos Evidentes**: Señala lenguaje emocional, omisión de datos clave o encuadres tendenciosos de fuentes específicas (menciona la fuente).
        3. **Puntos de Vista**: Resume brevemente los ángulos principales (ej. "La prensa económica se enfoca en X, mientras que la prensa social destaca Y").

        Si no hay contradicciones importantes, indícalo. Sé conciso y directo.

        Noticias a analizar:
        ${simplifiedList}

        Formato de respuesta (Markdown):
        ### 🔍 Análisis de Contradicciones y Sesgos
        * **Contradicciones Principales**: ...
        * **Sesgos Detectados**: ...
        * **Resumen de Perspectivas**: ...
        `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("Gemini Analysis Error:", error);
            return "Ocurrió un error al generar el análisis con IA.";
        }
    }
}
