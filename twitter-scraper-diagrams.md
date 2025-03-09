# Twitter Scraper Diagrams

This document serves as an index for all the diagrams explaining the Twitter scraping functionality using Apify.

## Available Diagrams

1. [Flow Diagram](./twitter-scraper-flow.md) - High-level overview of the data flow and process
2. [Technical Diagram](./twitter-scraper-technical.md) - Detailed view of the code structure and components
3. [Sequence Diagram](./twitter-scraper-sequence-fixed.md) - Step-by-step sequence of operations

## Implementation Overview

The Twitter scraping functionality is implemented using the following components:

### Backend Components
- **Routes**: `src/routes/twitter.routes.js`
- **Controller**: `src/controllers/twitterController.js`
- **Service**: `src/services/twitterScraper.js`

### External Services
- **Apify Platform**: Provides the tweet-scraper actor
- **Twitter**: The data source being scraped

### Configuration
- **Environment Variables**: `.env` file containing the Apify API token

### Testing
- **Example Script**: `examples/twitterScraper.js`
- **API Test Script**: `examples/testApiEndpoint.js`

## Usage

To use the Twitter scraping functionality:

1. Ensure the Apify API token is set in the `.env` file
2. Start the server: `npm run dev`
3. Send a POST request to `/api/twitter/scrape` with appropriate parameters

Example request body:
```json
{
  "searchTerms": ["web scraping"],
  "twitterHandles": ["elonmusk"],
  "maxItems": 10,
  "sort": "Latest",
  "tweetLanguage": "en"
}
```

## Diagram Viewing

The diagrams are created using Mermaid syntax. To view them:

1. Open the markdown files in a Mermaid-compatible viewer
2. Use GitHub's built-in Mermaid rendering if viewing on GitHub
3. Use a Mermaid live editor: [https://mermaid.live/](https://mermaid.live/) 