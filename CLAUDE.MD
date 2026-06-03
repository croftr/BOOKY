# Claude Code Context for Booky

This document provides context and guidance for Claude Code when working on the Booky project.

## Project Overview

Booky is a modern, full-stack book tracking application built with Next.js. It allows users to track their reading journey, rate books, write reviews, and manage their personal library with an elegant dark mode interface.

## Tech Stack

- **Framework**: Next.js 16.1 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Runtime**: React 19
- **Storage**: Vercel KV (Redis) for book data, Vercel Blob for images

## Key Project Structure

```
booky/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── books/              # Book CRUD operations
│   │   │   │   ├── route.ts        # GET all, POST new, DELETE all
│   │   │   │   ├── [id]/
│   │   │   │   │   └── route.ts    # GET, PUT, DELETE by ID
│   │   │   │   └── bulk/           # Bulk import
│   │   │   └── upload/             # Image upload to Vercel Blob
│   │   ├── create/                 # Book creation page
│   │   ├── details/[id]/           # Book details page
│   │   └── page.tsx                # Main library page
│   ├── components/
│   │   ├── AddBook.tsx             # Book creation form
│   │   ├── BookItem.tsx            # Book card display
│   │   ├── BookList.tsx            # Book grid/list
│   │   ├── EditBook.tsx            # Book editing form
│   │   ├── ImportBooks.tsx         # JSON import
│   │   └── Toolbar.tsx             # Search, filter, sort
│   ├── lib/
│   │   ├── api.ts                  # API client functions
│   │   ├── redis.ts                # Vercel KV helper
│   │   └── importBooks.ts          # Import utilities
│   ├── types/
│   │   └── book.ts                 # TypeScript definitions
│   └── config/
│       └── categories.tsx          # Book categories config
├── scripts/
│   └── migrate-*.ts                # Migration scripts
└── data/
    └── books.json                  # Legacy file storage (migrated to KV)
```

## Important Patterns & Conventions

### Data Storage

- **Books**: Stored in Vercel KV (Redis) with keys like `book:{id}`
- **Book List**: Maintained as `books` key containing array of book IDs
- **Images**: Stored in Vercel Blob storage
- **Migration**: Scripts available to migrate from file storage to KV/Blob

### Book Data Model

```typescript
interface Book {
  id: string;                    // Timestamp-based ID
  title: string;
  image?: string;                // Vercel Blob URL
  rating?: number;               // 0-5 (0 = unrated)
  review?: string;
  category?: string;             // See categories.tsx
  dateCompleted: string;         // ISO date string
}
```

### Categories

Defined in `src/config/categories.tsx`:
- Picture, Story, Fiction, Factual, Rhyming, Poetry, Novel, Series, Biography, Autobiography, History, Science, Self-Help, Reference, Other

### API Patterns

- All API routes use Next.js App Router conventions
- Error handling returns appropriate HTTP status codes
- Book IDs are timestamp-based strings
- Image uploads return blob URLs

### Component Patterns

- Server components by default
- Client components marked with `'use client'`
- Modals use conditional rendering
- Forms use controlled components with React state

## Development Workflow

### Running the App

```bash
npm run dev          # Development server on :3000
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
```

### Migration Scripts

```bash
npm run migrate              # Migrate books to KV
npm run migrate:images       # Convert images to base64
npm run migrate:blob         # Migrate images to Blob
```

### Environment Variables

Required in `.env.local`:
- `KV_REST_API_URL`: Vercel KV REST API URL
- `KV_REST_API_TOKEN`: Vercel KV REST API token
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob storage token

## Common Tasks

### Adding a New Feature

1. Consider if it needs API routes, components, or both
2. Update TypeScript types in `src/types/book.ts` if needed
3. Follow existing patterns for error handling and loading states
4. Use Tailwind CSS for styling (dark mode first)
5. Test with existing data in KV storage

### Working with the Database

- Use `src/lib/redis.ts` for KV operations
- Always handle null cases (book not found)
- Update the book list when adding/deleting books
- Consider caching strategies for frequently accessed data

### Styling Guidelines

- Dark mode is the primary theme (bg-gray-900, text-white)
- Use Tailwind utility classes
- Consistent spacing and borders
- Icons from lucide-react
- Responsive design (mobile-first)

## Important Files to Review

Before making changes, review:
- `src/types/book.ts` - Core data model
- `src/lib/api.ts` - Client-side API calls
- `src/lib/redis.ts` - Database operations
- `src/config/categories.tsx` - Category configuration
- `README.md` - User-facing documentation

## Known Considerations

- Image storage migrated from file system to Vercel Blob
- Book data migrated from JSON files to Vercel KV
- Migration scripts are one-time use utilities
- Pagination implemented (infinite scroll, 30 books per page)
- Search, filter, and sort functionality in Toolbar

## Testing Checklist

When making changes, verify:
- Book creation with and without images
- Book editing preserves all fields
- Book deletion updates the book list
- Search/filter/sort works correctly
- Responsive design on mobile
- Dark mode styling is consistent
- Loading states are shown appropriately

## Git Workflow

- Main branch: `main`
- Current worktree: `zen-shannon`
- Use descriptive commit messages
- Test locally before committing
