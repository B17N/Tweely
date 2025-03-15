# Twitter Data Scraping Workflow

## Complete Workflow
```mermaid
flowchart TD
    subgraph "1. User Following Scraper"
        A1[scraperfollowinguser.js] --> B1[Fetch Twitter Users]
        B1 --> C1[Save User Data]
    end
    
    subgraph "2. Last Week Tweets Scraper"
        A2[scraperlastweektwitter.js] --> B2[Read User Data]
        B2 --> C2[Generate URLs]
        C2 --> D2[Fetch Recent Tweets]
        D2 --> E2[Save Tweet Data]
    end
    
    subgraph "3. Username Extractor"
        A3[ExtractTwitterUsernames.js] --> B3[Read Tweet Data]
        B3 --> C3[Extract Usernames]
        C3 --> D3[Save Username Data]
    end
    
    C1 -->|User Data| B2
    E2 -->|Tweet Data| B3
    
    style A1 fill:#f9f,stroke:#333,stroke-width:2px
    style A2 fill:#bbf,stroke:#333,stroke-width:2px
    style A3 fill:#bfb,stroke:#333,stroke-width:2px
```

## Data Flow
```mermaid
flowchart LR
    A[Twitter API] --> B[User Data]
    B --> C[Tweet URLs]
    C --> D[Tweet Data]
    D --> E[Username Data]
    
    subgraph "Scripts"
        F[scraperfollowinguser.js]
        G[scraperlastweektwitter.js]
        H[ExtractTwitterUsernames.js]
    end
    
    F -->|Produces| B
    G -->|Processes| B
    G -->|Produces| D
    H -->|Processes| D
    H -->|Produces| E
```

## File Formats
```mermaid
flowchart TD
    A[User Data JSON] --> B[YYYY-MM-DD.json]
    C[Tweet URLs JSON] --> D[twitter_urls_TIMESTAMP.json]
    E[Tweet Data JSON] --> F[twitter_scraped_data_TIMESTAMP.json]
    G[Username Data JSON] --> H[twitter_usernames_TIMESTAMP.json]
```

## Usage Sequence
1. Run `scraperfollowinguser.js` to collect Twitter user data
2. Run `scraperlastweektwitter.js` to collect recent tweets from those users
3. Run `ExtractTwitterUsernames.js` to extract usernames from the tweets
4. Use the extracted data for analysis or visualization 