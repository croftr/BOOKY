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

// Tool to add a new book
server.addTool({
  name: "add_book",
  description: `Adds a new book to the user's personal reading tracker.
  Creates a new book entry with the provided details. Only title and category are required.
  If dateCompleted is not provided, it defaults to today's date.
  If completionOrder is not provided, it automatically increments from the highest existing completion order.
  Use this when the user wants to add a new book they've read to their collection.`,
  parameters: z.object({
    title: z.string().describe("The book title (required)"),
    category: z.string().describe("The book category - e.g., 'Factual', 'Story', 'Picture' (required)"),
    rating: z.number().optional().describe("Book rating from 0-5 (optional, defaults to 0)"),
    review: z.string().optional().describe("Review notes about the book (optional, supports Markdown)"),
    dateCompleted: z.string().optional().describe("Date completed in ISO format YYYY-MM-DD (optional, defaults to today)"),
    completionOrder: z.number().optional().describe("Completion order number (optional, defaults to max + 1)"),
    image: z.string().optional().describe("Image URL for book cover (optional)"),
  }),
  execute: async (args) => {
    try {
      const { title, category, rating, review, dateCompleted, completionOrder, image } = args;

      // Get all books to calculate next completion order if not provided
      let finalCompletionOrder = completionOrder;
      if (!completionOrder) {
        const response = await fetch(`${BASE_URL}/api/books`);
        if (!response.ok) {
          throw new Error(`Failed to fetch books for completion order calculation`);
        }
        const books = await response.json();
        const maxOrder = books.length > 0
          ? Math.max(...books.map((b: any) => b.completionOrder || 0))
          : 0;
        finalCompletionOrder = maxOrder + 1;
      }

      // Set dateCompleted to today if not provided
      const finalDateCompleted = dateCompleted || new Date().toISOString().split('T')[0];

      // Create the new book object
      const newBook = {
        id: Date.now().toString(),
        title,
        category,
        rating: rating || 0,
        review: review || "",
        dateCompleted: finalDateCompleted,
        completionOrder: finalCompletionOrder,
        image: image || "",
      };

      const createResponse = await fetch(`${BASE_URL}/api/books`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newBook),
      });

      if (!createResponse.ok) {
        throw new Error(`HTTP error! status: ${createResponse.status}`);
      }

      const createdBook = await createResponse.json();
      return JSON.stringify({
        success: true,
        message: `Successfully added "${createdBook.title}" to your reading list`,
        book: createdBook,
      }, null, 2);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Error adding book: ${errorMessage}`);
    }
  },
});

// Tool to edit a book field
server.addTool({
  name: "edit_book",
  description: `Edits a single field of a book the user has read in their personal reading tracker.
  Allows updating one field at a time: title, rating (0-5), review, category, dateCompleted (ISO format: YYYY-MM-DD), or completionOrder.
  Use this when the user wants to update or correct information about a book they've read.`,
  parameters: z.object({
    id: z.string().describe("The unique ID of the book to edit (required)"),
    field: z.enum(["title", "rating", "review", "category", "dateCompleted", "completionOrder"]).describe("The field to edit (required)"),
    value: z.union([z.string(), z.number()]).describe("The new value for the field (required)"),
  }),
  execute: async (args) => {
    try {
      const { id, field, value } = args;

      // Validate and convert value based on field type
      let updatePayload: any = {};

      if (field === "rating" || field === "completionOrder") {
        const numValue = typeof value === "number" ? value : parseInt(String(value));
        if (isNaN(numValue)) {
          throw new Error(`${field} must be a valid number`);
        }
        if (field === "rating" && (numValue < 0 || numValue > 5)) {
          throw new Error("Rating must be between 0 and 5");
        }
        updatePayload[field] = numValue;
      } else {
        updatePayload[field] = String(value);
      }

      const response = await fetch(`${BASE_URL}/api/books/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Book with ID "${id}" not found`);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedBook = await response.json();
      return JSON.stringify({
        success: true,
        message: `Successfully updated ${field} for "${updatedBook.title}"`,
        book: updatedBook,
      }, null, 2);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Error editing book: ${errorMessage}`);
    }
  },
});

// Start the server
server.start({
  transportType: "stdio",
});
