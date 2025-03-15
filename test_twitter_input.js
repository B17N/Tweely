import { ApifyClient } from 'apify-client';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';

// Load environment variables
dotenv.config();

async function main() {
  try {
    console.log('Testing Twitter scraper input formats');
    
    // Initialize Apify client
    const client = new ApifyClient({
      token: process.env.APIFY_API_TOKEN,
    });
    
    // Sample usernames for testing
    const usernames = [
      "VitalikButerin",
      "gavofyork",
      "TimBeiko"
    ];
    
    // NEW FORMAT (correct according to example)
    const newFormatInput = {
      "result_count": "100",
      "since_date": new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      "start_urls": usernames.map(username => ({
        "url": `https://twitter.com/${username}`,
        "method": "GET"
      }))
    };
    
    // OLD FORMAT (what we see in logs)
    const oldFormatInput = {
      "username": true,
      "usernames": usernames,
      "tweetsDesired": 100,
      "searchTerms": "",
      "searchMode": "live",
      "language": "en",
      "onlyVerifiedUsers": false,
      "onlyUsersWithDescription": false,
      "onlyUsersWithLocation": false,
      "onlyUsersWithMinimumFollowers": 0,
      "includeReplies": true,
      "includeRetweets": true
    };
    
    console.log('\n=== New Format (CORRECT) ===');
    console.log(JSON.stringify(newFormatInput, null, 2));
    
    console.log('\n=== Old Format (INCORRECT) ===');
    console.log(JSON.stringify(oldFormatInput, null, 2));
    
    // Ensure test directory exists
    const testDir = path.join(process.cwd(), 'test_results');
    await fs.mkdir(testDir, { recursive: true });
    
    // Ask user which format to test
    console.log('\nIMPORTANT: Which format would you like to test?');
    console.log('1. New Format (CORRECT)');
    console.log('2. Old Format (INCORRECT)');
    
    // We can't get user input in this script, so let's test both formats
    // In a real application, you would prompt the user
    
    console.log('\n=== Testing NEW Format ===');
    console.log('Calling actor gentle_cloud/twitter-tweets-scraper with NEW format...');
    try {
      const newFormatRun = await client.actor("gentle_cloud/twitter-tweets-scraper").call(newFormatInput);
      console.log(`✅ NEW format run successful! Run ID: ${newFormatRun.id}`);
      console.log(`Dataset ID: ${newFormatRun.defaultDatasetId}`);
      
      // Get a few results to verify
      const { items: newItems } = await client.dataset(newFormatRun.defaultDatasetId).listItems({ limit: 5 });
      console.log(`Retrieved ${newItems.length} tweets with NEW format`);
      
      // Save results
      await fs.writeFile(
        path.join(testDir, 'new_format_results.json'), 
        JSON.stringify(newItems, null, 2)
      );
      console.log('Saved NEW format results to test_results/new_format_results.json');
    } catch (error) {
      console.error('❌ ERROR with NEW format:', error.message);
    }
    
    // Test old format too
    console.log('\n=== Testing OLD Format ===');
    console.log('Calling actor gentle_cloud/twitter-tweets-scraper with OLD format...');
    try {
      const oldFormatRun = await client.actor("gentle_cloud/twitter-tweets-scraper").call(oldFormatInput);
      console.log(`✅ OLD format run successful! Run ID: ${oldFormatRun.id}`);
      console.log(`Dataset ID: ${oldFormatRun.defaultDatasetId}`);
      
      // Get a few results to verify
      const { items: oldItems } = await client.dataset(oldFormatRun.defaultDatasetId).listItems({ limit: 5 });
      console.log(`Retrieved ${oldItems.length} tweets with OLD format`);
      
      // Save results
      await fs.writeFile(
        path.join(testDir, 'old_format_results.json'), 
        JSON.stringify(oldItems, null, 2)
      );
      console.log('Saved OLD format results to test_results/old_format_results.json');
    } catch (error) {
      console.error('❌ ERROR with OLD format:', error.message);
    }
    
    console.log('\n=== Test Complete ===');
    console.log('Check test_results directory for the output from each format');
    console.log('This will tell you which format the actor actually accepts.');
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

main(); 