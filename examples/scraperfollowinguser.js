import { ApifyClient } from 'apify-client';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

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

// Function to ensure the testdata directory exists
function ensureTestDataDirectoryExists() {
    const testDataDir = path.join(process.cwd(), 'testdata');
    if (!fs.existsSync(testDataDir)) {
        fs.mkdirSync(testDataDir, { recursive: true });
        console.log(`Created directory: ${testDataDir}`);
    }
    return testDataDir;
}

// Function to get formatted date for filename
function getFormattedDate() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// Function to save all user data to a single file
function saveAllUserDataToFile(usersData, testDataDir, formattedDate) {
    try {
        const filename = `${formattedDate}.json`;
        const filePath = path.join(testDataDir, filename);
        
        fs.writeFileSync(filePath, JSON.stringify(usersData, null, 2));
        console.log(`Saved data for ${usersData.length} users to ${filePath}`);
        return filePath;
    } catch (error) {
        console.error(`Error saving data to file:`, error);
        return null;
    }
}

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
        
        // Ensure testdata directory exists
        const testDataDir = ensureTestDataDirectoryExists();
        const formattedDate = getFormattedDate();
        console.log(`Using date format for filename: ${formattedDate}`);
        
        // Save all items to a single file
        const filePath = saveAllUserDataToFile(items, testDataDir, formattedDate);
        
        if (filePath) {
            console.log(`\nSuccessfully saved all data to: ${filePath}`);
        } else {
            console.log('\nFailed to save data to file');
        }
        
        console.log('\nScraping and saving completed successfully');
    } catch (error) {
        console.error('Error running Twitter user scraper:', error);
    }
}

// Run the scraper
runTwitterUserScraper(); 