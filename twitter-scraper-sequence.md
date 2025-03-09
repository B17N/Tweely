# Twitter Scraper Sequence Diagram

This sequence diagram illustrates the step-by-step process of the Twitter scraping operation.

```mermaid
sequenceDiagram
    Client->>Router: POST /api/twitter/scrape
    Note over Client,Router: Request body contains search parameters
    Router->>Controller: Route to scrapeTwitter()
    Controller->>Controller: Validate request parameters
    alt Invalid Parameters
        Controller-->>Client: Return 400 Bad Request
    else Valid Parameters
        Controller->>Service: Call scrapeTwitterData(options)
        Service->>Service: Initialize ApifyClient with token
        Note over Service: Uses APIFY_API_TOKEN from .env
        Service->>Service: Prepare input parameters
        Service->>Apify: client.actor("apidojo/tweet-scraper").call(input)
        Apify->>TweetScraper: Execute tweet-scraper actor
        Note over TweetScraper: Scrapes Twitter based on parameters
        TweetScraper->>Dataset: Store results in dataset
        TweetScraper-->>Apify: Return run information
        Apify-->>Service: Return run with defaultDatasetId
        Service->>Apify: client.dataset(datasetId).listItems()
        Apify->>Dataset: Retrieve items from dataset
        Dataset-->>Apify: Return dataset items
        Apify-->>Service: Return { items }
        Service->>Service: Process and format results
        Service-->>Controller: Return formatted response
        Controller-->>Client: Return JSON response
    end
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
7. Apify executes the tweet-scraper actor on its platform
8. Actor scrapes Twitter and stores results in a dataset

### Response Phase
9. Service retrieves the dataset ID from the run information
10. Service fetches the items from the dataset
11. Service processes and formats the results
12. Controller returns the formatted JSON response to the client

This sequence highlights the asynchronous nature of the operation, where the service waits for the Apify actor to complete before retrieving and processing the results. 