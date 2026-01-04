/**
 * Interface representing a normalized news item from an API
 */
export interface NewsItem {
    url: string;
    title: string;
    source: string;
    publishedAt: string; // ISO date string
    description?: string;
    urlToImage?: string; // Image URL from API
    bias?: 'left' | 'center' | 'right'; // Added for UI display
}

/**
 * Curated list of domains for reliable news fetching.
 * Used to filter the 'everything' endpoint to ensure quality and freshness.
 */
// --- Domain Lists (Split for Balanced Querying) ---

// CHILE
// "Left" / Progressive / Independent set to counterbalance the heavy Right/Conservative duopoly
export const CHILE_LEFT = [
    'elmostrador.cl',
    'eldesconcierto.cl',
    'theclinic.cl',
    'elciudadano.com',
    'laizquierdadiario.cl',
    'cooperativa.cl', // Broadly considered center-left/progressive
    'cnnchile.com',   // Progressive liberal
    'radio.uchile.cl',
    'interferencia.cl'
].join(',');

export const CHILE_RIGHT_CENTER = [
    'latercera.com',
    'biobiochile.cl',
    'emol.com',
    '24horas.cl', // State TV, usually institutional/center
    't13.cl',
    'radioagricultura.cl',
    'adnradio.cl',
    'meganoticias.cl'
].join(',');

// Combined for fallback
export const CHILE_DOMAINS = `${CHILE_LEFT},${CHILE_RIGHT_CENTER}`;

// INTERNACIONAL (Spanish)
export const INTL_LEFT = [
    'elpais.com',
    'rt.com',
    'pagina12.com.ar', // Distinctly left
    'eldiario.es'
].join(',');

export const INTL_RIGHT_CENTER = [
    'infobae.com',
    'clarin.com',
    'lanacion.com.ar',
    'elmundo.es',
    'lavanguardia.com',
    'abc.es',
    'cnn.com', // CNN es is often center
    'bbc.com', // BBC is center
    'dw.com'   // DW is center
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
    id: string; // concise hash or uuid
    mainTitle: string;
    summary: string; // AI generated summary
    items: NewsItem[];
    biasDistribution: {
        left: number;
        center: number;
        right: number;
    };
    firstPublishedAt: string;
}

/**
 * Hardcoded Bias Map for Chilean Media (MVP)
 * Adjusted to reflect the local "Duopoly vs Others" dynamic more effectively for filtering.
 */
const SOURCE_BIAS: Record<string, 'left' | 'center' | 'right'> = {
    // CHILE
    'La Tercera': 'right',
    'Emol': 'right',
    'BioBioChile': 'right',
    'El Mercurio': 'right',
    'Radio Agricultura': 'right',
    'Meganoticias': 'center',
    '24horas.cl': 'center',
    'T13': 'center',
    // Shifted to Left/Progressive for MVP contrast against the hard right
    'CNN Chile': 'left',
    'Cooperativa.cl': 'left',
    'El Mostrador': 'left',
    'El Desconcierto': 'left',
    'La Izquierda Diario': 'left',
    'El Ciudadano': 'left',
    'The Clinic': 'left',
    'Radio Universidad de Chile': 'left',
    'Interferencia': 'left',
    'Radio Bío-Bío': 'right',

    // International
    'El País': 'left',
    'Página/12': 'left',
    'elDiario.es': 'left',
    'RT': 'left',
    'BBC News Mundo': 'center',
    'CNN en Español': 'center',
    'Infobae': 'right',
    'Clarín': 'right',
    'La Nación': 'right',
    'El Mundo': 'right',
    'ABC': 'right',
    'Marca': 'center',
    'Deutsche Welle (Español)': 'center',

    // English (Anglo)
    'The New York Times': 'left',
    'CNN': 'left',
    'MSNBC': 'left',
    'Fox News': 'right',
    'BBC News': 'center',
    'The Guardian': 'left',
    'The Washington Post': 'left',
    'Reuters': 'center',
    'Associated Press': 'center',
    'USA Today': 'center',
    'Bloomberg': 'center',
    'Al Jazeera English': 'left',
    'Wall Street Journal': 'right',
    'New York Post': 'right'
};

function getBiasForSource(sourceName: string): 'left' | 'center' | 'right' {
    const cleanName = sourceName.trim();
    if (SOURCE_BIAS[cleanName]) return SOURCE_BIAS[cleanName];

    const lower = cleanName.toLowerCase();
    if (lower.includes('tercera') || lower.includes('mercurio') || lower.includes('emol') || lower.includes('fox')) return 'right';
    if (lower.includes('mostrador') || lower.includes('izquierda') || lower.includes('ciudadano') || lower.includes('guardian')) return 'left';
    if (lower.includes('cnn') || lower.includes('bbc') || lower.includes('reuters')) return 'center';

    return 'center';
}


/**
 * Basic MVP Clustering Logic
 * Groups stories by simple title similarity (Jaccard Index) within a time window.
 */
export function clusterStories(stories: NewsItem[]): StoryCluster[] {
    const clusters: StoryCluster[] = [];
    // Lowered threshold significantly to encourage grouping diverse titles about the same topic
    const threshold = 0.12;

    // Sort by date desc and enrich with bias
    const sortedStories = stories.map(s => ({
        ...s,
        bias: getBiasForSource(s.source)
    })).sort((a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    for (const story of sortedStories) {
        let foundCluster = false;

        // Try to fit into existing clusters
        for (const cluster of clusters) {
            // Check if story falls within 48h (wider window)
            const timeDiff = Math.abs(new Date(story.publishedAt).getTime() - new Date(cluster.firstPublishedAt).getTime());
            const hoursDiff = timeDiff / (1000 * 60 * 60);

            if (hoursDiff < 48) {
                // Check title similarity with the main title of the cluster
                const similarity = jaccardSimilarity(story.title, cluster.mainTitle);
                if (similarity > threshold) {
                    cluster.items.push(story);
                    // Update bias distribution
                    if (story.bias) {
                        cluster.biasDistribution[story.bias]++;
                    }
                    foundCluster = true;
                    break;
                }
            }
        }

        if (!foundCluster) {
            // Create new cluster
            clusters.push({
                id: crypto.randomUUID(),
                mainTitle: story.title,
                summary: story.description || story.title, // Use description if available
                items: [story],
                biasDistribution: {
                    left: story.bias === 'left' ? 1 : 0,
                    center: story.bias === 'center' ? 1 : 0,
                    right: story.bias === 'right' ? 1 : 0
                },
                firstPublishedAt: story.publishedAt
            });
        }
    }

    return clusters;
}

// Helper: Improved Jaccard Similarity
function jaccardSimilarity(str1: string, str2: string): number {
    // Remove punctuation and keep only significant words (>2 chars) to match "Trump" vs "Trump's" etc
    const clean = (str: string) =>
        new Set(
            str.toLowerCase()
                .replace(/[^\w\s]/g, '') // Remove punctuation
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
