const fetch = require('node-fetch');

/**
 * Test script for the Twitter scraper API endpoint
 */
async function testApiEndpoint() {
  console.log('Testing Twitter scraper API endpoint...');
  
  const url = 'http://localhost:3000/api/twitter/scrape';
  
  // Twitter scraper parameters
  const searchParams = {
    "startUrls": [
      "https://twitter.com/apify",
      "https://twitter.com/search?q=apify%20&src=typed_query",
      "https://twitter.com/i/lists/78783491",
      "https://twitter.com/elonmusk/with_replies"
    ],
    "searchTerms": [
      "web scraping",
      "scraping from:apify"
    ],
    "twitterHandles": [
      "elonmusk",
      "taylorswift13"
    ],
    "conversationIds": [
      "1754067365707563045",
      "1732037140111102460"
    ],
    "maxItems": 2,
    "sort": "Latest",
    "tweetLanguage": "en",
    "author": "apify",
    "inReplyTo": "webexpo",
    "mentioning": "elonmusk",
    "geotaggedNear": "Los Angeles",
    "withinRadius": "15km",
    "geocode": "37.7764685,-122.4172004,10km",
    "placeObjectId": "96683cc9126741d1",
    "minimumRetweets": 5,
    "minimumFavorites": 5,
    "minimumReplies": 5,
    "start": "2021-07-01",
    "end": "2021-07-02",
    "customMapFunction": "(object) => { return {...object} }"
  };
  
  // Fetch options
  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(searchParams),
  };
  
  console.log('Sending request to:', url);
  console.log('With parameters:', JSON.stringify(searchParams, null, 2));
  
  try {
    const response = await fetch(url, fetchOptions);
    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error testing API endpoint:', error);
  }
}

// Run the test
testApiEndpoint()
  .then(() => console.log('Test completed'))
  .catch(err => console.error('Test failed:', err)); 