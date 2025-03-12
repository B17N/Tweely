import fs from 'fs';
import path from 'path';
import { ApifyClient } from 'apify-client';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Initialize the ApifyClient with your Apify API token from .env
const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

// Function to generate a timestamp for filenames
function generateTimestamp() {
    return new Date().toISOString().replace(/[:.]/g, '-');
}

// Function to read and parse the JSON file
async function readTwitterData() {
    try {
        // Construct the path to the JSON file
        const filePath = path.join(process.cwd(), 'testdata', '2025-03-11.json');
        
        console.log('Reading file from:', filePath);
        
        // Read and parse the JSON file
        const jsonData = await fs.promises.readFile(filePath, 'utf8');
        const data = JSON.parse(jsonData);
        
        console.log('Successfully loaded Twitter data');
        console.log('Total users found:', data.length);
        
        // Extract usernames and create the new JSON structure
        const usernames = data.map(user => user.userName);
        
        // Create the new JSON structure
        const outputJson = {
            "result_count": "1000",
            "since_date": "2025-03-08",
            "start_urls": usernames.map(username => ({
                "url": `https://twitter.com/${username}`,
                "method": "GET"
            }))
        };
        
        // Generate timestamp for filename
        const timestamp = generateTimestamp();
        const outputFilePath = path.join(process.cwd(), 'testdata', `twitter_urls_${timestamp}.json`);
        
        // Save the JSON to a file
        await fs.promises.writeFile(outputFilePath, JSON.stringify(outputJson, null, 4));
        console.log(`\nSaved JSON output to: ${outputFilePath}`);
        
        // Output the formatted JSON
        console.log('\nFormatted JSON output:');
        console.log(JSON.stringify(outputJson, null, 4));
        
        return { outputJson, outputFilePath, timestamp };
    } catch (error) {
        console.error('Error processing Twitter data:', error);
        return null;
    }
}

// Function to call the Apify actor with the generated JSON
async function callApifyActor(inputJson, timestamp) {
    try {
        console.log('\nCalling Apify actor: gentle_cloud/twitter-tweets-scraper');
        console.log('Using Apify token:', process.env.APIFY_API_TOKEN ? 'Token loaded successfully' : 'Token not found');
        
        // Run the Actor and wait for it to finish
        console.log('Sending request to Apify...');
        const run = await client.actor("gentle_cloud/twitter-tweets-scraper").call(inputJson);
        
        console.log('Run completed with ID:', run.id);
        console.log(`💾 Check your data here: https://console.apify.com/storage/datasets/${run.defaultDatasetId}`);
        
        // Fetch and print Actor results from the run's dataset
        console.log('Fetching results from dataset...');
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        
        console.log(`Retrieved ${items.length} items from dataset`);
        
        // Save the retrieved data to a file
        const retrievedDataPath = path.join(process.cwd(), 'testdata', `twitter_scraped_data_${timestamp}.json`);
        await fs.promises.writeFile(retrievedDataPath, JSON.stringify(items, null, 4));
        console.log(`\nSaved scraped data to: ${retrievedDataPath}`);
        
        console.log('\nScraping completed successfully');
        
        return items;
    } catch (error) {
        console.error('Error calling Apify actor:', error);
        return null;
    }
}

// Main function to run the process
async function main() {
    // Read Twitter data and generate JSON
    const result = await readTwitterData();
    
    if (result) {
        // Call Apify actor with the generated JSON
        await callApifyActor(result.outputJson, result.timestamp);
    }
}

// Run the main function
main(); 