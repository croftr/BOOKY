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

    const apiKey = process.env.GOOGLE_BOOKS_API_KEY || '';
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}${apiKey ? `&key=${apiKey}` : ''}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch from Google Books API');
    }

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      // Extract cover images from multiple results
      const coverOptions = data.items
        .slice(0, 10) // Get up to 10 results
        .map((item: any, index: number) => {
          const volumeInfo = item.volumeInfo;
          const imageLinks = volumeInfo.imageLinks;

          if (!imageLinks) return null;

          // Get the highest quality image available
          const coverUrl =
            imageLinks.extraLarge ||
            imageLinks.large ||
            imageLinks.medium ||
            imageLinks.small ||
            imageLinks.thumbnail ||
            imageLinks.smallThumbnail;

          if (!coverUrl) return null;

          return {
            id: index,
            url: coverUrl.replace('http:', 'https:'), // Use HTTPS
            title: volumeInfo.title,
            authors: volumeInfo.authors?.join(', ') || 'Unknown',
            publishedDate: volumeInfo.publishedDate,
            // Provide multiple sizes if available
            sizes: {
              thumbnail: imageLinks.thumbnail?.replace('http:', 'https:'),
              small: imageLinks.small?.replace('http:', 'https:'),
              medium: imageLinks.medium?.replace('http:', 'https:'),
              large: imageLinks.large?.replace('http:', 'https:'),
            }
          };
        })
        .filter((cover: any) => cover !== null);

      return NextResponse.json({
        found: true,
        covers: coverOptions,
        total: coverOptions.length
      });
    }

    return NextResponse.json({
      found: false,
      covers: [],
      total: 0
    });
  } catch (error) {
    console.error('Error fetching book covers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch book covers' },
      { status: 500 }
    );
  }
}
