import { ApifyClient } from 'apify-client';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Initialize the ApifyClient with your Apify API token from .env
const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

// Log the token to verify it's loaded (remove in production)
console.log('Using Apify token:', process.env.APIFY_API_TOKEN ? 'Token loaded successfully' : 'Token not found');

// Prepare Actor input
const input = {
    "customMapFunction": "(object) => { return {...object} }",
    "getFollowers": false,
    "getFollowing": true,
    "getRetweeters": true,
    "includeUnavailableUsers": false,
    "maxItems": 100,
    "twitterHandles": [
        "VitalikButerin",
        "VitalikButerin",
        "VitalikButerin",
        "VitalikButerin",
        "VitalikButerin"
    ]
};

// Main function to run the scraper
async function runTwitterUserScraper() {
    try {
        console.log('Starting Twitter user scraper...');
        
        // Run the Actor and wait for it to finish
        console.log('Calling Apify actor with input:', JSON.stringify(input, null, 2));
        const run = await client.actor("apidojo/twitter-user-scraper").call(input);
        
        console.log('Run completed with ID:', run.id);
        console.log(`💾 Check your data here: https://console.apify.com/storage/datasets/${run.defaultDatasetId}`);
        
        // Fetch and print Actor results from the run's dataset
        console.log('Fetching results from dataset...');
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        
        console.log(`Retrieved ${items.length} items from dataset`);
        
        // Print each item
        items.forEach((item, index) => {
            console.log(`\nItem ${index + 1}:`);
            console.dir(item, { depth: 3 });
        });
        
        console.log('\nScraping completed successfully');
    } catch (error) {
        console.error('Error running Twitter user scraper:', error);
    }
}

// Run the scraper
runTwitterUserScraper(); 