import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Extracts all unique usernames from Twitter data and saves them to a file in JSON format
 */
async function main() {
    try {
        // Path to the Twitter data file
        const dataFilePath = path.join(__dirname, '../testdata/twitter_scraped_data_2025-03-11T07-44-24-516Z.json');
        
        // Read and parse the Twitter data
        console.log('Reading Twitter data file...');
        const rawData = fs.readFileSync(dataFilePath, 'utf8');
        const twitterData = JSON.parse(rawData);
        
        console.log(`Loaded ${twitterData.length} tweets from the data file.`);
        
        // Extract usernames
        console.log('Extracting usernames...');
        const userProfiles = [];
        const uniqueUsernames = new Set();
        
        twitterData.forEach(tweet => {
            if (tweet.user) {
                // Extract the screen_name from the URL if available
                let screenName = null;
                if (tweet.url) {
                    const urlParts = tweet.url.split('/');
                    if (urlParts.length > 3) {
                        screenName = urlParts[3]; // Extract username from URL
                    }
                }
                
                const username = screenName || tweet.user.screen_name || 'Unknown';
                
                // Only add if we haven't seen this username before
                if (!uniqueUsernames.has(username)) {
                    uniqueUsernames.add(username);
                    
                    // Create a user profile object
                    userProfiles.push({
                        username: username,
                        name: tweet.user.name || 'Unknown',
                        description: tweet.user.description || 'No description',
                        followers_count: tweet.user.followers_count || 0,
                        friends_count: tweet.user.friends_count || 0,
                        statuses_count: tweet.user.statuses_count || 0,
                        created_at: tweet.user.created_at || null,
                        verified: tweet.user.verified || false,
                        profile_image_url: tweet.user.profile_image_url || null,
                        url: tweet.user.url || null
                    });
                }
            }
        });
        
        console.log(`Found ${uniqueUsernames.size} unique usernames.`);
        
        // Create a timestamp for the filename
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const outputFilePath = path.join(__dirname, '../testdata', `twitter_usernames_${timestamp}.json`);
        
        // Create the JSON output object
        const outputData = {
            metadata: {
                timestamp: timestamp,
                source_file: 'twitter_scraped_data_2025-03-11T07-05-06-272Z.json',
                total_tweets_analyzed: twitterData.length,
                unique_usernames_found: uniqueUsernames.size
            },
            users: userProfiles.sort((a, b) => a.username.localeCompare(b.username))
        };
        
        // Write to file as formatted JSON
        fs.writeFileSync(outputFilePath, JSON.stringify(outputData, null, 2));
        console.log(`\nUsernames saved to: ${outputFilePath}`);
        
    } catch (error) {
        console.error('Error:', error.message);
        if (error.code === 'ENOENT') {
            console.error('\nFile not found. Please check the path to the Twitter data file.');
        }
    }
}

// Run the main function
main(); 