# Twitter Tweets Scraper

## Process Flow
```mermaid
flowchart TD
    A[Start] --> B[Load Environment Variables]
    B --> C[Initialize ApifyClient]
    C --> D[Read Twitter User Data]
    D --> E[Parse JSON File]
    E --> F[Extract Usernames]
    F --> G[Create URL Structure]
    G --> H[Generate Timestamp]
    H --> I[Save URLs to JSON File]
    I --> J[Call Apify Actor]
    J --> K[Wait for Run Completion]
    K --> L[Fetch Results from Dataset]
    L --> M[Save Scraped Data to File]
    M --> N[End]
```

## Data Structure
```mermaid
flowchart TD
    A[Input JSON] --> B[result_count]
    A --> C[since_date]
    A --> D[start_urls]
    D --> E[url]
    D --> F[method]
    
    G[Output Data] --> H[Tweet Objects Array]
    H --> I[url]
    H --> J[text]
    H --> K[user]
    K --> L[username]
    K --> M[displayname]
    K --> N[description]
    K --> O[verified]
    H --> P[date]
    H --> Q[likes]
    H --> R[retweets]
    H --> S[replies]
    H --> T[quotes]
```

## Output Example
```json
[
  {
    "url": "https://twitter.com/example_user/status/1234567890",
    "text": "This is an example tweet about something interesting",
    "user": {
      "username": "example_user",
      "displayname": "Example User",
      "description": "This is an example user profile",
      "verified": true
    },
    "date": "2025-03-10T12:34:56.000Z",
    "likes": 42,
    "retweets": 12,
    "replies": 5,
    "quotes": 3
  }
]
``` 