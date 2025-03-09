# Twitter Scraper Sequence Diagram (Fixed)

This sequence diagram illustrates the step-by-step process of the Twitter scraping operation.

```mermaid
sequenceDiagram
    Client->>Router: POST /api/twitter/scrape
    Router->>Controller: Route to scrapeTwitter()
    Controller->>Controller: Validate request parameters
    Controller->>Service: Call scrapeTwitterData(options)
    Service->>Service: Initialize ApifyClient with token
    Service->>Service: Prepare input parameters
    Service->>Apify: Call tweet-scraper actor
    Apify->>Twitter: Scrape data
    Twitter-->>Apify: Return data
    Apify->>Apify: Store in dataset
    Apify-->>Service: Return dataset ID
    Service->>Apify: Retrieve dataset items
    Apify-->>Service: Return items
    Service->>Service: Process results
    Service-->>Controller: Return formatted response
    Controller-->>Client: Return JSON response
```

## Sequence Details

### Initialization Phase
1. Client sends a POST request to the API endpoint
2. Express router directs the request to the controller
3. Controller validates the request parameters

### Processing Phase
4. Service initializes the Apify client with the API token
5. Service prepares the input parameters for the tweet-scraper
6. Service calls the Apify actor with the prepared input
7. Apify scrapes Twitter data
8. Results are stored in an Apify dataset

### Response Phase
9. Service retrieves the dataset ID from the run information
10. Service fetches the items from the dataset
11. Service processes and formats the results
12. Controller returns the formatted JSON response to the client

This sequence highlights the asynchronous nature of the operation, where the service waits for the Apify actor to complete before retrieving and processing the results. 