#!/usr/bin/env node
import { FastMCP } from "fastmcp";
import { z } from "zod";

// Get base URL from environment variable, default to localhost
const BASE_URL = process.env.BOOKY_BASE_URL || "http://localhost:3000";

const server = new FastMCP({
  name: "booky-mcp-tool",
  version: "1.0.0",
});

// Tool to get books the user has read
server.addTool({
  name: "get_books",
  description: `Retrieves information about books the user has read from their personal reading tracker.
  Returns book details including title, category, rating (0-5), review notes, completion date, and completion order.
  Supports filtering by category, rating, title search, date ranges, and sorting options.
  Use this to answer questions about what books the user has read, their reviews, ratings, reading history, and preferences.`,
  parameters: z.object({
    category: z.string().optional().describe("Filter by book category (e.g., 'Factual', 'Story', 'Picture')"),
    rating: z.number().optional().describe("Filter by exact rating (0-5)"),
    minRating: z.number().optional().describe("Filter by minimum rating (0-5)"),
    title: z.string().optional().describe("Search books by title (partial match, case-insensitive, min 3 chars)"),
    dateCompleted: z.string().optional().describe("Filter by exact completion date (ISO format: YYYY-MM-DD)"),
    dateFrom: z.string().optional().describe("Filter books completed on or after this date (ISO format: YYYY-MM-DD)"),
    dateTo: z.string().optional().describe("Filter books completed on or before this date (ISO format: YYYY-MM-DD)"),
    completionOrder: z.number().optional().describe("Filter by exact completion order number"),
    minOrder: z.number().optional().describe("Filter by minimum completion order"),
    maxOrder: z.number().optional().describe("Filter by maximum completion order"),
    sortBy: z.enum(["title", "rating", "category", "dateCompleted", "completionOrder"]).optional().describe("Sort results by field"),
    sortOrder: z.enum(["asc", "desc"]).optional().describe("Sort order: ascending or descending (default: asc)"),
  }),
  execute: async (args) => {
    try {
      const queryParams = new URLSearchParams();

      // Add all provided parameters to query string
      Object.entries(args).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const queryString = queryParams.toString();
      const url = queryString ? `${BASE_URL}/api/books?${queryString}` : `${BASE_URL}/api/books`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const books = await response.json();

      return JSON.stringify(books, null, 2);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Error fetching books: ${errorMessage}`);
    }
  },
});

// Start the server
server.start({
  transportType: "stdio",
});
