require('dotenv').config();
const { scrapeTwitterData } = require('../src/services/twitterScraper');

/**
 * Example script demonstrating how to use the Twitter scraper
 */
async function runExample() {
  console.log('Starting Twitter scraping example...');
  
  // Using a more popular Twitter handle
  const options ={
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
  
 

  try {
    // Run the scraper
    console.log('Using the following options:', JSON.stringify(options, null, 2));
    const result = await scrapeTwitterData(options);
    
    // Log the full result for debugging
    console.log('Raw result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log(`Successfully scraped ${result.itemCount} items`);
      console.log(`Dataset URL: ${result.datasetUrl}`);
      console.log(`Run ID: ${result.runId}`);
      
      // Log run info details
      console.log('Run status:', result.runInfo.status);
      console.log('Started at:', result.runInfo.startedAt);
      console.log('Finished at:', result.runInfo.finishedAt);
      console.log(result.items.length+"here----")

      // Check if we have items with noResults flag
      if (result.items.length > 0) {
        console.log(JSON.stringify(result.items[0], null, 2))  
        console.log(JSON.stringify(result.items[1], null, 2))  
      } else {
        console.log(result.items[0])  
        console.log('\nNo items returned in the result.');
      }
    } else {
      console.error('Scraping failed:', result.error || 'Unknown error');
    }
  } catch (error) {
    console.error('Error running example:', error);
  }
}

// Run the example
runExample()
  .then(() => console.log('Example completed'))
  .catch(err => console.error('Example failed:', err)); 