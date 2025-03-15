# Twitter User Scraper

## Process Flow
```mermaid
flowchart TD
    A[Start] --> B[Load Environment Variables]
    B --> C[Initialize ApifyClient]
    C --> D[Prepare Actor Input]
    D --> E[Run Twitter User Scraper]
    E --> F[Call Apify Actor]
    F --> G[Wait for Run Completion]
    G --> H[Fetch Results from Dataset]
    H --> I[Ensure TestData Directory Exists]
    I --> J[Generate Formatted Date]
    J --> K[Save User Data to File]
    K --> L[End]
```

## Data Structure
```mermaid
flowchart TD
    A[Actor Input] --> B[twitterHandles]
    A --> C[getFollowers]
    A --> D[getFollowing]
    A --> E[getRetweeters]
    A --> F[includeUnavailableUsers]
    A --> G[maxItems]
    A --> H[customMapFunction]
    
    I[Output Data] --> J[User Objects Array]
    J --> K[userName]
    J --> L[fullName]
    J --> M[description]
    J --> N[followersCount]
    J --> O[followingCount]
    J --> P[tweetCount]
    J --> Q[location]
    J --> R[profileImageUrl]
    J --> S[isVerified]
    J --> T[joinDate]
    J --> U[websiteUrl]
```

## Output Example
```json
[
  {
    "userName": "example_user",
    "fullName": "Example User",
    "description": "This is an example user profile",
    "followersCount": 1234,
    "followingCount": 567,
    "tweetCount": 890,
    "location": "San Francisco, CA",
    "profileImageUrl": "https://pbs.twimg.com/profile_images/example.jpg",
    "isVerified": true,
    "joinDate": "March 2020",
    "websiteUrl": "https://example.com"
  }
]
``` 