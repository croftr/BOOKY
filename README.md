# Booky

A modern, full-stack book tracking application built with Next.js. Track your reading journey, rate books, write reviews, and manage your personal library with an elegant dark mode interface.

## Features

- **Book Management**: Add, view, and delete books from your personal library
- **Rich Metadata**: Track title, category, completion date, ratings, and detailed reviews
- **Image Upload**: Upload and store book cover images on the server
- **Rating System**: Rate books from 1-5 stars, or leave them unrated
- **Bulk Import**: Import entire book collections from JSON files
- **Persistent Storage**: All data stored server-side in file system (survives browser cache clears)
- **Dark Mode**: Beautiful dark theme for comfortable reading in any lighting
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 16.1 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Runtime**: React 19
- **Storage**: File system (JSON + uploaded images)

## Project Structure

```
booky/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── books/          # Book CRUD API routes
│   │   │   │   ├── route.ts    # GET all, POST new, DELETE all
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts # GET, PUT, DELETE by ID
│   │   │   └── upload/
│   │   │       └── route.ts    # Image upload endpoint
│   │   ├── layout.tsx          # Root layout with metadata
│   │   └── page.tsx            # Main app page
│   ├── components/
│   │   ├── AddBook.tsx         # Form to add new books
│   │   ├── BookItem.tsx        # Individual book card display
│   │   ├── BookList.tsx        # List of all books
│   │   └── ImportBooks.tsx     # JSON import functionality
│   ├── lib/
│   │   ├── api.ts              # API client functions
│   │   └── importBooks.ts      # Import utility functions
│   └── types/
│       └── book.ts             # TypeScript type definitions
├── data/
│   └── books.json              # Server-side book data storage
├── public/
│   └── uploads/                # Uploaded book cover images
└── books-data.json             # Sample/backup book data
```

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd booky
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Initial Setup

The app comes with sample book data in `books-data.json`. You can:
- Import it using the "Import Books from JSON" feature in the UI
- Or start fresh by adding books manually

## Usage

### Adding a Book

1. Fill out the "Add a New Book" form with:
   - Title (required)
   - Book cover image (optional)
   - Rating (0 = Not Rated, 1-5 stars)
   - Review/notes
   - Category (Fiction, Factual, Picture, Story, etc.)
   - Date completed (required)

2. Click "Add Book" to save

### Importing Books

1. Click "Choose File" under "Import Books from JSON"
2. Select a JSON file with the following format:
```json
[
  {
    "title": "Book Title",
    "category": "Factual",
    "dateCompleted": "2025-01-15",
    "review": "My thoughts on the book",
    "rating": 4
  }
]
```
3. Books will be added to your existing collection

### Managing Books

- **View**: All books are displayed as cards with cover, rating, category, and review
- **Delete**: Click the "Delete" button on any book card to remove it
- **Ratings**: Displayed as filled stars (★) and empty stars (☆)

## API Endpoints

### Books
- `GET /api/books` - Get all books
- `POST /api/books` - Create a new book
- `GET /api/books/[id]` - Get a specific book
- `PUT /api/books/[id]` - Update a specific book
- `DELETE /api/books/[id]` - Delete a specific book

### Upload
- `POST /api/upload` - Upload a book cover image
  - Accepts: `multipart/form-data` with `file` field
  - Returns: `{ url: "/uploads/filename.jpg" }`

## Data Storage

### Books Data
Books are stored in `data/books.json` with the following structure:
```json
{
  "id": "1703123456789",
  "title": "Book Title",
  "image": "/uploads/cover.jpg",
  "rating": 4,
  "review": "Review text",
  "category": "Fiction",
  "dateCompleted": "2025-01-15"
}
```

### Images
- Uploaded images are stored in `public/uploads/`
- Filenames are auto-generated with timestamp and random suffix
- Images are served as static files

## Development

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm run start
```

### Lint Code
```bash
npm run lint
```

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Import project to [Vercel](https://vercel.com)
3. Deploy with default settings

**Note**: For persistent storage in production, consider migrating to a database (PostgreSQL, MongoDB, etc.)

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- AWS
- DigitalOcean

**Important**: Ensure the platform supports file system writes for `data/` directory, or migrate to a database solution.

## Future Enhancements

Potential features to add:
- Search and filter functionality
- Sort by rating, date, category
- Edit existing books
- Export data to JSON/CSV
- Database integration (PostgreSQL, MongoDB)
- User authentication
- Multiple reading lists
- Reading statistics and insights
- ISBN lookup and auto-fill
- Goodreads integration

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

Built with [Next.js](https://nextjs.org) and [Tailwind CSS](https://tailwindcss.com)
