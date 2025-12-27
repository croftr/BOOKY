import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q');

        if (!query) {
            return NextResponse.json(
                { error: 'Search query is required' },
                { status: 400 }
            );
        }

        // Google Books API doesn't require an API key for basic queries
        // But you can add one in .env.local as GOOGLE_BOOKS_API_KEY for higher rate limits
        const apiKey = process.env.GOOGLE_BOOKS_API_KEY || '';
        const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}${apiKey ? `&key=${apiKey}` : ''}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Failed to fetch from Google Books API');
        }

        const data = await response.json();

        // Extract relevant information from the first result
        if (data.items && data.items.length > 0) {
            const book = data.items[0];
            const volumeInfo = book.volumeInfo;

            const googleBooksInfo = {
                description: volumeInfo.description,
                publishedDate: volumeInfo.publishedDate,
                publisher: volumeInfo.publisher,
                authors: volumeInfo.authors,
                pageCount: volumeInfo.pageCount,
                infoLink: volumeInfo.infoLink,
                previewLink: volumeInfo.previewLink,
            };

            return NextResponse.json({
                found: true,
                info: googleBooksInfo,
                allResults: data.items.slice(0, 5).map((item: any) => ({
                    title: item.volumeInfo.title,
                    authors: item.volumeInfo.authors,
                    publishedDate: item.volumeInfo.publishedDate,
                }))
            });
        }

        return NextResponse.json({ found: false });
    } catch (error) {
        console.error('Error fetching Google Books data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch Google Books data' },
            { status: 500 }
        );
    }
}
