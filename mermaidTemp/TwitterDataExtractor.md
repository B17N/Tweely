# Twitter Data Extractor

## Process Flow
```mermaid
flowchart TD
    A[Start] --> B[Load Twitter Data]
    B --> C[Parse JSON Data]
    C --> D[Extract Usernames]
    D --> E{For Each Tweet}
    E --> F[Extract Username from URL]
    F --> G[Check if Username Already Processed]
    G -- Yes --> E
    G -- No --> H[Create User Profile Object]
    H --> I[Add to Unique Usernames Set]
    I --> E
    E --> J[Generate Timestamp]
    J --> K[Create Output JSON Structure]
    K --> L[Write JSON to File]
    L --> M[End]
```

## Data Structure
```mermaid
flowchart TD
    N[Metadata Object] --> O[timestamp]
    N --> P[source_file]
    N --> Q[total_tweets_analyzed]
    N --> R[unique_usernames_found]
    S[Users Array] --> T[User Objects]
    T --> U[username]
    T --> V[name]
    T --> W[description]
    T --> X[followers_count]
    T --> Y[friends_count]
    T --> Z[statuses_count]
    T --> AA[created_at]
    T --> AB[verified]
    T --> AC[profile_image_url]
    T --> AD[url]
```

## Output Example
```json
{
  "metadata": {
    "timestamp": "2025-03-11T12:34:56.789Z",
    "source_file": "input.json",
    "total_tweets_analyzed": 1000,
    "unique_usernames_found": 20
  },
  "users": [
    {
      "username": "example_user",
      "name": "Example User",
      "description": "Profile description",
      "followers_count": 1234,
      "friends_count": 567,
      "statuses_count": 890,
      "created_at": "2020-03-11T12:34:56Z",
      "verified": true,
      "profile_image_url": "https://example.com/image.jpg",
      "url": "https://twitter.com/example_user"
    }
  ]
}
``` 