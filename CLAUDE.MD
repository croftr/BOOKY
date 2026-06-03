# Claude Code Context for Booky

This document provides context and guidance for Claude Code when working on the Booky project.

## Project Overview

Booky is a modern, full-stack book tracking application built with Next.js. It allows users to track their reading journey, rate books, write reviews, and manage their personal library with an elegant dark mode interface.

## Tech Stack

- **Framework**: Next.js 16.1 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Runtime**: React 19
- **Storage**: AWS S3 (single versioned JSON object for book data; cover/review images under an `images/` prefix in the same bucket)
- **Hosting**: Vercel (functions pinned to the `lhr1` London region to co-locate with the eu-west-2 S3 bucket)

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
│   │   │   └── upload/             # Image upload to S3
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
│   │   ├── storage.ts              # S3 storage client (local-file fallback in dev)
│   │   └── importBooks.ts          # Import utilities
│   ├── types/
│   │   └── book.ts                 # TypeScript definitions
│   └── config/
│       └── categories.tsx          # Book categories config
├── scripts/
│   └── migrate-*.ts                # Migration scripts
└── data/
    └── books.json                  # Local dev storage (production uses S3)
```

## Important Patterns & Conventions

### Data Storage

- **Books**: The entire library is stored as a single JSON object (`books-data-v1.json`) in AWS S3. Reads = one `GetObject`, writes = one `PutObject`. The dataset is small (a few hundred KB), so the API loads the whole document and filters/sorts/paginates in memory.
- **Images**: Cover and review images are stored under the `images/` prefix in the same S3 bucket; the prefix is public-read so URLs load without signing.
- **Durability**: Bucket versioning is enabled (every save is recoverable) with a lifecycle rule expiring noncurrent versions after 30 days.
- **Dev fallback**: In development the storage client reads/writes `data/books.json` instead of S3 (set `FORCE_CLOUD=1` to exercise the S3 path locally).
- **Migration**: `npm run migrate:s3` is a one-off that moved data + images off the retired Vercel Blob.

### Book Data Model

```typescript
interface Book {
  id: string;                    // Timestamp-based ID
  title: string;
  image?: string;                // S3 object URL
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
- Image uploads return S3 object URLs

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
npm run migrate:s3           # One-off: moved data + images from Vercel Blob to S3
```

(The older `migrate`, `migrate:images`, `migrate:blob`, and `sync:*` scripts target the
retired Redis/Vercel Blob path and are kept only for historical reference.)

### Environment Variables

Production credentials are set in the Vercel dashboard. Note: Vercel/Lambda reserve the
`AWS_*` names, so use the `BOOKY_`-prefixed vars below (passed explicitly to the S3 client):
- `BOOKY_S3_BUCKET`: bucket name (`robs-booky-data`)
- `BOOKY_AWS_REGION`: bucket region (`eu-west-2`)
- `BOOKY_AWS_ACCESS_KEY_ID` / `BOOKY_AWS_SECRET_ACCESS_KEY`: least-privilege IAM key (S3 read/write on the data object + `images/*`)

Locally these are optional — the S3 client falls back to the default AWS credential chain
(e.g. your configured `aws` CLI profile), and dev mode uses the local file unless `FORCE_CLOUD=1`.

## Common Tasks

### Adding a New Feature

1. Consider if it needs API routes, components, or both
2. Update TypeScript types in `src/types/book.ts` if needed
3. Follow existing patterns for error handling and loading states
4. Use Tailwind CSS for styling (dark mode first)
5. Test with existing data in S3 storage

### Working with the Database

- Use `src/lib/storage.ts` for S3 operations
- Always handle null cases (book not found)
- Update the book list when adding/deleting books
- The whole library is read-modify-written as one document — keep that in mind for concurrent writes

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
- `src/lib/storage.ts` - S3 storage operations
- `src/config/categories.tsx` - Category configuration
- `README.md` - User-facing documentation

## Known Considerations

- Storage history: local JSON files → Vercel KV/Blob → **AWS S3** (current)
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
