from playwright.sync_api import sync_playwright
import urllib.request
import json

def verify_google_books_fallback():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Set up route interception to simulate a failed Google Books API response
        context = browser.new_context()
        page = context.new_page()

        # Intercept the Google Books API call and mock a "not found" response
        page.route("**/api/books/google*", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='{"found": false}'
        ))

        # We need a book ID to navigate to. Let's create one via the API first.
        new_book = {
            "id": "test-book-id-123",
            "title": "A Very Obscure Book That Does Not Exist",
            "image": "",
            "rating": 0,
            "review": "",
            "category": "Fiction",
            "dateCompleted": "2023-01-01",
            "completionOrder": 999
        }

        data = json.dumps(new_book).encode('utf-8')
        req = urllib.request.Request(
            "http://localhost:3000/api/books",
            data=data,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        try:
            with urllib.request.urlopen(req) as response:
                print(f"Created test book, status: {response.status}")
        except Exception as e:
            print(f"Failed to create test book: {e}")

        print("Navigating to the book details page...")
        page.goto("http://localhost:3000/details/test-book-id-123")

        # Wait a moment for any client-side fetching to complete
        page.wait_for_timeout(2000)

        print("Taking screenshot...")
        page.screenshot(path="fallback.png", full_page=True)

        # Cleanup
        req = urllib.request.Request(
            "http://localhost:3000/api/books/test-book-id-123",
            method='DELETE'
        )
        try:
            with urllib.request.urlopen(req) as response:
                 print("Cleaned up")
        except:
            pass

        browser.close()

if __name__ == "__main__":
    verify_google_books_fallback()