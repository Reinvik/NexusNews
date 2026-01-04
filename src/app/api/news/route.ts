import { NextResponse } from 'next/server';
import {
    clusterStories,
    type NewsItem,
    CHILE_DOMAINS,
    CHILE_LEFT, CHILE_RIGHT_CENTER,
    INTL_LEFT, INTL_RIGHT_CENTER,
    ANGLO_LEFT, ANGLO_RIGHT_CENTER,
    ANGLO_DOMAINS
} from '@/lib/analyzer';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'nacional';
    const query = searchParams.get('q') || '';
    const timeRange = searchParams.get('time_range') || 'any';

    // console.log(`API: /api/news called scope=${scope} time=${timeRange} query=${query}`);

    try {
        const apiKey = process.env.NEWS_API_KEY;
        if (!apiKey) return NextResponse.json({ error: 'API Key missing' }, { status: 500 });

        // 1. Select Domain Sets based on Scope for BALANCED FETCHING
        let leftDomains = '';
        let rightDomains = '';
        let language = 'es';

        if (scope === 'nacional') {
            leftDomains = CHILE_LEFT;
            rightDomains = CHILE_RIGHT_CENTER;
        } else if (scope === 'internacional') {
            leftDomains = INTL_LEFT;
            rightDomains = INTL_RIGHT_CENTER;
        } else if (scope === 'anglo') {
            leftDomains = ANGLO_LEFT;
            rightDomains = ANGLO_RIGHT_CENTER;
            language = 'en';
        }

        // 2. Time Calculation
        let fromDate = '';
        const now = new Date();

        if (timeRange === 'hour') {
            const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
            fromDate = `&from=${oneHourAgo.toISOString()}`;
        } else if (timeRange === 'day') {
            const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
            fromDate = `&from=${oneDayAgo.toISOString()}`;
        }

        // 3. Construct URLs (Balanced Strategy)
        const pageSize = 50;
        let articles: any[] = [];

        const fetchNews = async (domains: string) => {
            if (!domains) return [];
            let url = '';
            // If specific query, valid domains are crucial
            if (query) {
                url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&domains=${domains}&language=${language}&sortBy=publishedAt&pageSize=${pageSize}&apiKey=${apiKey}${fromDate}`;
            } else {
                url = `https://newsapi.org/v2/everything?domains=${domains}&language=${language}&sortBy=publishedAt&pageSize=${pageSize}&apiKey=${apiKey}${fromDate}`;
            }

            try {
                const res = await fetch(url, { next: { revalidate: 0 } });
                if (res.ok) {
                    const data = await res.json();
                    return data.articles || [];
                }
            } catch (e) {
                console.error(`Fetch failed for domains: ${domains.slice(0, 20)}...`, e);
            }
            return [];
        };

        console.log(`Fetching Balanced News for ${scope}...`);

        // Execute Parallel Fetches to ensure Left/Right representation
        const [leftArticles, rightArticles] = await Promise.all([
            fetchNews(leftDomains),
            fetchNews(rightDomains)
        ]);

        articles = [...leftArticles, ...rightArticles];
        console.log(`Fetched: ${leftArticles.length} Left, ${rightArticles.length} Right. Total: ${articles.length}`);

        // Fallback? If dangerously low, we might need to broaden, but user wants STRICT filtering.
        // If we have very few articles, intersection is unlikely. 
        // Let's allow a fallback if TOTAL is 0 to at least show *something* is alive, 
        // but the intersection logic might strip it anyway.
        if (articles.length === 0 && !query) {
            console.log("Zero results in balanced fetch. Attempting fallback...");
            let fbUrl = '';
            if (scope === 'nacional') fbUrl = `https://newsapi.org/v2/top-headlines?country=cl&pageSize=40&apiKey=${apiKey}`;
            else if (scope === 'internacional') fbUrl = `https://newsapi.org/v2/top-headlines?language=es&pageSize=60&apiKey=${apiKey}`;
            else if (scope === 'anglo') fbUrl = `https://newsapi.org/v2/top-headlines?language=en&pageSize=60&apiKey=${apiKey}`;

            const fbRes = await fetch(fbUrl, { next: { revalidate: 0 } });
            if (fbRes.ok) {
                const fbData = await fbRes.json();
                articles = fbData.articles || [];
            }
        }

        // Deduplicate (by URL)
        const uniqueArticles = Array.from(new Map(articles.map((item: any) => [item.url, item])).values());

        // Transform
        const newsItems: NewsItem[] = uniqueArticles
            .filter((article: any) => article.title && article.source.name && article.title !== '[Removed]')
            .map((article: any) => ({
                url: article.url,
                title: article.title.split(' - ')[0],
                source: article.source.name,
                publishedAt: article.publishedAt,
                description: article.description,
                urlToImage: article.urlToImage
            }));

        // Cluster
        let clusters = clusterStories(newsItems);

        // 4. INTERSECTION FILTERING (The "Nexus" Logic)
        // Only keep clusters that have coverage from at least 2 different biases
        if (clusters.length > 0) {
            const strictClusters = clusters.filter(c => {
                const types = Object.keys(c.biasDistribution).filter(k => c.biasDistribution[k as 'left' | 'center' | 'right'] > 0);
                return types.length >= 2;
            });

            console.log(`Clustering: ${clusters.length} total -> ${strictClusters.length} strict intersections.`);

            // Use strict list
            clusters = strictClusters;
        }

        return NextResponse.json({ clusters });

    } catch (error: any) {
        console.error("API Route Error:", error);
        return NextResponse.json({ error: error.message || 'Failed to fetch news' }, { status: 500 });
    }
}
