# Booky MCP Tool

An MCP (Model Context Protocol) tool for accessing the Booky API. This tool allows Claude to fetch book information from your Booky application.

## Features

- Get all books from the Booky API
- Configurable base URL via environment variable
- Built with fastmcp for easy MCP server creation
- Written in TypeScript for type safety

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the TypeScript code:
```bash
npm run build
```

3. Configure the base URL (optional):
```bash
cp .env.example .env
```

Edit `.env` and set your `BOOKY_BASE_URL`:
- For local development: `http://localhost:3000` (default)
- For production: `https://your-app.vercel.app`

## Usage

### Running the MCP Server

First build the project, then start it:
```bash
npm run build
npm start
```

Or use the dev script to build and run in one command:
```bash
npm run dev
```

### Configuring with Claude Code

Add this to your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "booky": {
      "command": "node",
      "args": ["c:\\Users\\rob\\projects\\booky\\booky-tool\\dist\\index.js"],
      "env": {
        "BOOKY_BASE_URL": "http://localhost:3000"
      }
    }
  }
}
```

Adjust the path to match your actual installation directory.

## Available Tools

### get_books

Retrieves information about books the user has read from their personal reading tracker.

**Parameters:** All parameters are optional

- `category` (string): Filter by book category (e.g., 'Factual', 'Story', 'Picture')
- `rating` (number): Filter by exact rating (0-5)
- `minRating` (number): Filter by minimum rating (0-5)
- `title` (string): Search books by title (partial match, case-insensitive, min 3 chars)
- `dateCompleted` (string): Filter by exact completion date (ISO format: YYYY-MM-DD)
- `dateFrom` (string): Filter books completed on or after this date (ISO format: YYYY-MM-DD)
- `dateTo` (string): Filter books completed on or before this date (ISO format: YYYY-MM-DD)
- `completionOrder` (number): Filter by exact completion order number
- `minOrder` (number): Filter by minimum completion order
- `maxOrder` (number): Filter by maximum completion order
- `sortBy` (string): Sort results by field (title, rating, category, dateCompleted, completionOrder)
- `sortOrder` (string): Sort order: ascending or descending (default: asc)

**Returns:** JSON array of books with details including:
- Title
- Category
- Rating (0-5)
- Review notes
- Completion date
- Completion order
- Image URL

**Example usage in Claude:**
```
# Get all books
Use the get_books tool to show me all my books

# Get highly rated books
Use get_books with minRating=5 to show me my 5-star books

# Search for specific books
Use get_books with title="Evolution" to find books about evolution

# Get books by category
Use get_books with category="Factual" and sortBy="rating" and sortOrder="desc" to show factual books sorted by rating

# Get recent books
Use get_books with dateFrom="2025-01-01" to show books I read this year
```

## Future Enhancements

- Add individual book lookup by ID
- Add book creation/update functionality
- Add statistics and analytics tools

## Development

The MCP server uses the fastmcp library which handles the MCP protocol communication via stdin/stdout. The server exposes tools that Claude can use to interact with your Booky API.

## Environment Variables

- `BOOKY_BASE_URL` - The base URL of your Booky API (default: `http://localhost:3000`)
