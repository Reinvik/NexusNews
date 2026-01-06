/**
 * Interface representing a normalized news item from an API
 */
export type BiasType = 'left' | 'center-left' | 'center' | 'center-right' | 'right';

export interface NewsItem {
    url: string;
    title: string;
    source: string;
    publishedAt: string; // ISO date string
    description?: string;
    urlToImage?: string;
    bias?: BiasType;
}

/**
 * Curated list of domains for reliable news fetching.
 * Used to filter the 'everything' endpoint to ensure quality and freshness.
 */
// --- Domain Lists (Split for Balanced Querying) ---

// CHILE
// "Left" / Progressive / Independent set to counterbalance the heavy Right/Conservative duopoly
export const CHILE_LEFT_LIST = [
    'elmostrador.cl',
    'eldesconcierto.cl',
    'theclinic.cl',
    'elciudadano.com',
    'laizquierdadiario.cl',
    'cooperativa.cl',
    'cnnchile.com',
    'radio.uchile.cl',
    'interferencia.cl',
    'ciperchile.cl'
];
export const CHILE_LEFT = CHILE_LEFT_LIST.join(',');

export const CHILE_RIGHT_CENTER_LIST = [
    'latercera.com',
    'biobiochile.cl',
    'emol.com',
    '24horas.cl',
    't13.cl',
    'radioagricultura.cl',
    'adnradio.cl',
    'meganoticias.cl'
];
export const CHILE_RIGHT_CENTER = CHILE_RIGHT_CENTER_LIST.join(',');

// Combined for fallback
export const CHILE_DOMAINS = `${CHILE_LEFT},${CHILE_RIGHT_CENTER}`;

// INTERNACIONAL (Spanish)
export const INTL_LEFT = [
    'elpais.com',
    'rt.com',
    'pagina12.com.ar',
    'eldiario.es'
].join(',');

export const INTL_RIGHT_CENTER = [
    'infobae.com',
    'clarin.com',
    'lanacion.com.ar',
    'elmundo.es',
    'lavanguardia.com',
    'abc.es',
    'cnn.com',
    'bbc.com',
    'dw.com'
].join(',');

export const INTL_DOMAINS = `${INTL_LEFT},${INTL_RIGHT_CENTER}`;


// ANGLO (English)
export const ANGLO_LEFT = [
    'nytimes.com',
    'cnn.com',
    'theguardian.com',
    'washingtonpost.com',
    'aljazeera.com',
    'msnbc.com'
].join(',');

export const ANGLO_RIGHT_CENTER = [
    'foxnews.com',
    'bbc.co.uk',
    'reuters.com',
    'apnews.com',
    'usatoday.com',
    'bloomberg.com',
    'wsj.com',
    'nypost.com'
].join(',');

export const ANGLO_DOMAINS = `${ANGLO_LEFT},${ANGLO_RIGHT_CENTER}`;

/**
 * Represents a cluster of stories about the same event
 */
export interface StoryCluster {
    id: string;
    mainTitle: string;
    summary: string;
    items: NewsItem[];
    biasDistribution: Record<BiasType, number>;
    firstPublishedAt: string;
    blindspot?: boolean; // Is this a blindspot?
    blindspotSide?: 'left' | 'right'; // Which side is ignoring this? (e.g. 'left' means Left is ignoring it)
}

/**
 * Hardcoded Bias Map for Chilean Media (Bias 2.0)
 * 5-point scale based on local media analysis.
 */
const SOURCE_BIAS: Record<string, BiasType> = {
    // CHILE - DERECHA
    'El Mercurio': 'right',
    'Emol': 'right',
    'Radio Agricultura': 'right',

    // CHILE - CENTRO DERECHA
    'La Tercera': 'center-right',
    'Meganoticias': 'center-right', // Bethia
    'T13': 'center-right', // Luksic often center-right

    // CHILE - CENTRO / NEUTRAL / INSTITUCIONAL
    'BioBioChile': 'center', // Independent / Fast
    '24horas.cl': 'center', // State TV
    'CNN Chile': 'center', // Moved back to Center (Liberal) as per feedback
    'ADN Radio': 'center',

    // CHILE - CENTRO IZQUIERDA
    'Cooperativa.cl': 'center-left',
    'El Mostrador': 'center-left',

    // CHILE - IZQUIERDA
    'El Desconcierto': 'left',
    'La Izquierda Diario': 'left',
    'El Ciudadano': 'left',
    'The Clinic': 'left',
    'Radio Universidad de Chile': 'left',
    'Interferencia': 'left',
    'CIPER': 'center-left', // Verification/Investigative often leans prog.

    // International
    'El País': 'center-left',
    'Página/12': 'left',
    'elDiario.es': 'left',
    'RT': 'left', // State media, anti-west often distinct
    'BBC News Mundo': 'center',
    'CNN en Español': 'center',
    'Infobae': 'right',
    'Clarín': 'center-right',
    'La Nación': 'right',
    'El Mundo': 'right',
    'ABC': 'right',
    'Marca': 'center',
    'Deutsche Welle (Español)': 'center',

    // English (Anglo)
    'The New York Times': 'center-left',
    'CNN': 'center-left',
    'MSNBC': 'left',
    'Fox News': 'right',
    'BBC News': 'center',
    'The Guardian': 'left',
    'The Washington Post': 'center-left',
    'Reuters': 'center',
    'Associated Press': 'center',
    'USA Today': 'center',
    'Bloomberg': 'center',
    'Al Jazeera English': 'center-left',
    'Wall Street Journal': 'right',
    'New York Post': 'right'
};

export function getBiasForSource(sourceName: string): BiasType {
    const cleanName = sourceName.trim();
    if (SOURCE_BIAS[cleanName]) return SOURCE_BIAS[cleanName];

    const lower = cleanName.toLowerCase();
    if (lower.includes('tercera')) return 'center-right';
    if (lower.includes('mercurio') || lower.includes('emol') || lower.includes(' agricultura')) return 'right';
    if (lower.includes('fox')) return 'right';

    if (lower.includes('mostrador') || lower.includes('cooperativa')) return 'center-left';
    if (lower.includes('izquierda') || lower.includes('ciudadano') || lower.includes('clinic')) return 'left';

    if (lower.includes('biobio') || lower.includes('cnn') || lower.includes('bbc') || lower.includes('reuters') || lower.includes('24horas')) return 'center';

    return 'center';
}


/**
 * Advanced Clustering Logic (Bias 2.0)
 */
export function clusterStories(stories: NewsItem[]): StoryCluster[] {
    const clusters: StoryCluster[] = [];
    const threshold = 0.12;

    // Enrich with bias
    const sortedStories = stories.map(s => ({
        ...s,
        bias: getBiasForSource(s.source)
    })).sort((a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    for (const story of sortedStories) {
        let foundCluster = false;

        for (const cluster of clusters) {
            const timeDiff = Math.abs(new Date(story.publishedAt).getTime() - new Date(cluster.firstPublishedAt).getTime());
            const hoursDiff = timeDiff / (1000 * 60 * 60);

            if (hoursDiff < 72) {
                // 1. Text Similarity (Original)
                const similarity = jaccardSimilarity(story.title, cluster.mainTitle);

                // 2. Entity Overlap (New)
                const storyEntities = extractEntities(story.title);
                const clusterEntities = extractEntities(cluster.mainTitle);
                // Check intersection
                const sharedEntities = [...storyEntities].filter(e => clusterEntities.has(e));
                const hasSharedEntity = sharedEntities.length > 0;

                // Rule: High Similarity (> 0.2) OR (Moderate Similarity > 0.1 AND Shared Entity)
                const isHighSim = similarity > 0.2;
                const isModerateSim = similarity > 0.08;

                if (isHighSim || (isModerateSim && hasSharedEntity)) {
                    cluster.items.push(story);

                    // Update bias distribution
                    if (story.bias) {
                        cluster.biasDistribution[story.bias]++;
                    }

                    // PRIORITIZE .cl DOMAIN for Main Title (Local Priority)
                    // If current main title is NOT from .cl, and this new story IS from .cl, swap it.
                    // This ensures the dashboard feels "Chilean" first.
                    if (!cluster.mainTitle.includes('.cl') && story.url.includes('.cl')) {
                        cluster.mainTitle = story.title;
                        cluster.summary = story.description || story.title;
                    }

                    foundCluster = true;
                    break;
                }
            }
        }

        if (!foundCluster) {
            clusters.push({
                id: crypto.randomUUID(),
                mainTitle: story.title,
                summary: story.description || story.title,
                items: [story],
                biasDistribution: {
                    'left': story.bias === 'left' ? 1 : 0,
                    'center-left': story.bias === 'center-left' ? 1 : 0,
                    'center': story.bias === 'center' ? 1 : 0,
                    'center-right': story.bias === 'center-right' ? 1 : 0,
                    'right': story.bias === 'right' ? 1 : 0
                },
                firstPublishedAt: story.publishedAt
            });
        }
    }

    // CALCULATE BLINDSPOTS
    // Blindspot = Story covered significantly (>0) by one side's block, but 0 by the other.
    // Blocks: Left Block (Left + Center-Left), Right Block (Right + Center-Right).
    // Center is neutral.
    clusters.forEach(c => {
        const leftBlock = c.biasDistribution['left'] + c.biasDistribution['center-left'];
        const rightBlock = c.biasDistribution['right'] + c.biasDistribution['center-right'];
        const total = leftBlock + rightBlock + c.biasDistribution['center'];

        // Only detect blindspots if we have enough signals (at least 2  articles usually, or 1 strong)
        if (total > 0) {
            if (leftBlock > 0 && rightBlock === 0) {
                // Right is ignoring this -> Blindspot for the Right (Shown to user as "Blindspot Derecha"?)
                // Actually, usually tools say "Left Blindspot" to mean "The Left is MISSING this".
                // Ground News uses "Blindspot" labels to indicate which side is ignoring it.
                // If only Left covers it, it is a "Right Blindspot" (The Right is blind to it).
                c.blindspot = true;
                c.blindspotSide = 'right';
            } else if (rightBlock > 0 && leftBlock === 0) {
                c.blindspot = true;
                c.blindspotSide = 'left';
            }
        }
    });

    // FILTER: Enforce Diversity (Minimum 2 distinct political leanings)
    // "no quiero que muestren solo 1 noticia que es solo de un medio minimo deben haber 2 tendencias politicas distintas"
    const diverseClusters = clusters.filter(c => {
        // 1. Must have at least 2 items
        if (c.items.length < 2) return false;

        // 2. Removed strict diversity check to allow blindspots and more news
        // "no importa si son mas antiguas... o noticias que al menos tienes 2 diferentes puntos"
        // User agreed to relax this to see more content.

        // const presentLeanings = Object.values(c.biasDistribution).filter(count => count > 0).length;
        // if (presentLeanings < 2) {
        //     return false;
        // }

        return true;
    });

    console.log(`[DIVERSITY CHECK] Dropped ${clusters.length - diverseClusters.length} clusters due to low diversity.`);

    // FALLBACK: If diversity filter kills everything, return best effort (original clusters)
    // We prioritize showing SOMETHING over showing nothing.
    if (diverseClusters.length === 0 && clusters.length > 0) {
        console.warn("[DIVERSITY CHECK] Strict diversity filter removed all news. Falling back to less strict clusters.");
        return clusters;
    }

    return diverseClusters;
}

// Helper: Extract Capitalized Words (Potential Entities like "Maduro", "Kast", "Boric")
function extractEntities(text: string): Set<string> {
    const ignored = new Set([
        'PARA', 'COMO', 'ESTE', 'ESTA', 'PERO', 'PORQUE', 'CUANDO', 'DONDE', 'QUIEN',
        'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO',
        'CHILE', 'SANTIAGO', 'GOBIERNO', 'PAIS', 'MUNDO', 'NACIONAL', 'INTERNACIONAL',
        'NOTICIAS', 'AHORA', 'ULTIMO', 'MINUTO', 'VIVO', 'DIRECTO'
    ]);

    const words = text.split(/\s+/);
    const entities = new Set<string>();

    for (const word of words) {
        // Clean punctuation: "Maduro," -> "Maduro"
        const cleanParams = word.replace(/[^\w\u00C0-\u00FF]/g, '');

        if (cleanParams.length > 3 && /^[A-ZÁÉÍÓÚÑ]/.test(cleanParams)) {
            // Check if it's NOT ALL CAPS (unless short acronym, but filtering length > 3 usually avoids acronyms)
            // or check against ignore list
            if (!ignored.has(cleanParams.toUpperCase())) {
                entities.add(cleanParams.toLowerCase());
            }
        }
    }
    return entities;
}

// Helper: Improved Jaccard Similarity
function jaccardSimilarity(str1: string, str2: string): number {
    const clean = (str: string) =>
        new Set(
            str.toLowerCase()
                .replace(/[^\w\s]/g, '')
                .split(/\s+/)
                .filter(w => w.length > 2)
        );

    const set1 = clean(str1);
    const set2 = clean(str2);

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    if (union.size === 0) return 0;
    return intersection.size / union.size;
}
