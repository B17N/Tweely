require('dotenv').config();

const { scrapeTwitterData } = require('../src/services/twitterScraper');
const fs = require('fs');
const path = require('path');

/**
 * Example script demonstrating how to use the Twitter scraper
 */
async function runExample() {
  console.log('Starting Twitter scraping example...');
  
  // Using a more popular Twitter handle
  const scraperUsers = ["elonmusk"];
  const startDate = "2025-03-01";
  const endDate = "2025-03-02";

  const options = {
    "includeSearchTerms": false,
    "maxItems": 10,
    "onlyImage": false,
    "onlyQuote": false,
    "onlyTwitterBlue": false,
    "onlyVerifiedUsers": false,
    "onlyVideo": false,
    "start": startDate,
    "end": endDate,
    "sort": "Latest",
    // Adding twitterHandles to ensure the request is valid
    "twitterHandles": scraperUsers,
    // Adding startUrls as an alternative way to find the user
    "startUrls": scraperUsers.map(user => `https://twitter.com/${user}`)
  };
 
  try {
    // Run the scraper
    console.log('Using the following options:', JSON.stringify(options, null, 2));
    const result = await scrapeTwitterData(options);
    
    // Log the full result for debugging
    console.log('Raw result:', JSON.stringify(result, null, 2));
    
    // Prepare log directory
    const logDir = path.join(__dirname, 'log');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }

    // Create log filename with current date and time
    const logFileName = new Date().toISOString().replace(/[:.]/g, '-') + '.log';
    const logFilePath = path.join(logDir, logFileName);

    // Format log content
    const logContent = `input------------------\n${JSON.stringify(options, null, 2)}\noutput------------------\n${JSON.stringify(result, null, 2)}`;

    // Write log to file
    fs.writeFileSync(logFilePath, logContent);
    console.log(`Log saved to: ${logFilePath}`);

    if (result.success) {
      console.log(`Successfully scraped ${result.itemCount} items`);
      console.log(`Dataset URL: ${result.datasetUrl}`);
      console.log(`Run ID: ${result.runId}`);
      
      // Log run info details
      console.log('Run status:', result.runInfo.status);
      console.log('Started at:', result.runInfo.startedAt);
      console.log('Finished at:', result.runInfo.finishedAt);
      console.log(result.items.length + "here----");

      // Check if we have items with noResults flag
      if (result.items.length > 0) {
        console.log(JSON.stringify(result.items[0], null, 2));  
        console.log(JSON.stringify(result.items[1], null, 2));  
      } else {
        console.log(result.items[0]);  
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