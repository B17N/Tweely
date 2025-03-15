# Twitter Following User API Documentation

## API Overview

This API provides a standalone endpoint to fetch the list of accounts a Twitter user is following using Apify's Twitter scraper service, then updates a specified task with this data.

## API Specifications

### Fetch Following User
- **Endpoint**: `/api/twitter/fetchFollowingUser`
- **Method**: `POST`
- **Purpose**: Fetch a Twitter user's following list and associate it with a task

### Request Parameters

```json
{
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "twitterUsername": "VitalikButerin"
}
```

### Response (202 Accepted)

```json
{
  "status": "processing",
  "message": "Twitter following fetch initiated",
  "requestId": "f7b92-8a31c-4ee12",
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "twitterUsername": "VitalikButerin"
}
```

## Process Flow

```mermaid
sequenceDiagram
    participant Client
    participant TwitterRoutes as Twitter Routes
    participant TwitterController as Twitter Controller
    participant TwitterService as Twitter Service
    participant TaskService as Task Service
    participant ApifyClient as Apify Client
    participant FileSystem as File System

    Client->>TwitterRoutes: POST /api/twitter/fetchFollowingUser
    TwitterRoutes->>TwitterController: fetchFollowingUserHandler(req, res)
    
    TwitterController->>TaskService: getTaskById(taskId)
    alt Task not found
        TaskService-->>TwitterController: null or error
        TwitterController-->>Client: 404 Task Not Found
    else Task found
        TaskService-->>TwitterController: Task object
        TwitterController->>TwitterService: fetchFollowingUser(taskId, twitterUsername)
        TwitterService-->>TwitterController: Request accepted (requestId)
        TwitterController-->>Client: 202 Accepted with request info
    end
    
    Note over TwitterService: Asynchronous processing
    TwitterService->>ApifyClient: Initialize client with API token
    TwitterService->>ApifyClient: Call Twitter user scraper
    ApifyClient-->>TwitterService: Return following list data
    
    TwitterService->>TaskService: getTaskById(taskId)
    TaskService-->>TwitterService: Return task object
    
    TwitterService->>TaskService: updateTaskWithTwitterData(taskId, twitterData)
    TaskService->>FileSystem: Update task JSON file
    FileSystem-->>TaskService: File write complete
```

## Implementation Details

### File Structure
- `src/routes/twitter.routes.js`: Twitter API route definitions
- `src/controllers/twitterController.js`: Request handling and validation
- `src/services/twitterService.js`: Apify integration and asynchronous processing
- `src/services/taskService.js`: Task data operations (extended with Twitter-related methods)

### Updated Task Data Structure

After processing, the task JSON will include:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Original task title",
  "description": "Original task description",
  "createdAt": "2023-10-15T14:22:33.421Z",
  "updatedAt": "2023-10-15T14:35:45.123Z",
  "completed": false,
  "twitterData": {
    "username": "VitalikButerin",
    "fetchedAt": "2023-10-15T14:35:42.387Z",
    "followingCount": 145,
    "following": [
      {
        "username": "ethereum",
        "displayName": "Ethereum",
        "bio": "Official account of the Ethereum project",
        "followersCount": 3500000,
        "followingCount": 125,
        "location": "Everywhere",
        "profileImageUrl": "https://pbs.twimg.com/profile_images/...",
        "verified": true
      },
      // Additional followed accounts...
    ]
  }
}
```

## Implementation Considerations

1. **Environment Configuration**:
   - `APIFY_API_TOKEN` must be set in the environment variables

2. **Error Handling**:
   - API should handle task not found scenarios
   - Should gracefully handle Apify API failures

3. **Status Checking**:
   - Clients can check request status via a status endpoint
   - Active requests are tracked in memory 