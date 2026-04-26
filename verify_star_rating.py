from playwright.sync_api import sync_playwright
import time

def verify_star_rating():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        print("Navigating to the home page...")
        page.goto("http://localhost:3000")

        # Wait for the books to load
        page.wait_for_selector('h3.text-xl', timeout=10000)

        print("Finding a star rating button to click...")

        # Find the first book's star rating
        star_buttons = page.locator('button[aria-label*="Rate"]')
        first_star = star_buttons.first

        # Take a screenshot before click
        page.screenshot(path="before_click.png")

        print("Clicking a star...")
        first_star.click()

        # Wait a moment to see if navigation occurs
        time.sleep(2)

        # Take a screenshot after click
        page.screenshot(path="after_click.png")

        # Check if we are still on the home page
        current_url = page.url
        print(f"Current URL after click: {current_url}")

        if "details" in current_url:
            print("FAILED: Click propagated and navigated to the detail page!")
            exit(1)
        else:
            print("SUCCESS: Click did not propagate to detail page.")

        browser.close()

if __name__ == "__main__":
    verify_star_rating()
