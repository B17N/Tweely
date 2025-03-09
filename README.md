# Node.js Backend Project

A clean, structured Node.js backend application with Twitter scraping capabilities using Apify.

## Project Structure

```
├── src/
│   ├── controllers/    # Request handlers
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── middleware/     # Express middleware
│   ├── utils/          # Utility functions
│   ├── config/         # Configuration files
│   └── index.js        # Application entry point
├── examples/           # Example scripts
├── tests/
│   ├── unit/           # Unit tests
│   └── integration/    # Integration tests
├── .env.example        # Example environment variables
├── .gitignore          # Git ignore file
└── package.json        # Project dependencies and scripts
```

## Getting Started

1. Clone this repository
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.example`
4. Set your Apify API token in the `.env` file
5. Run the development server: `npm run dev`

## Twitter Scraping

This project includes functionality to scrape Twitter data using Apify's tweet-scraper. 

### API Endpoint

```
POST /api/twitter/scrape
```

### Request Body Example

```json
{
  "searchTerms": ["web scraping"],
  "twitterHandles": ["elonmusk"],
  "maxItems": 100,
  "sort": "Latest",
  "tweetLanguage": "en",
  "start": "2023-01-01",
  "end": "2023-12-31"
}
```

### Running the Example

```
node examples/twitterScraper.js
```

## Available Scripts

- `npm start` - Run the production server
- `npm run dev` - Run the development server with hot reload
- `npm test` - Run tests 