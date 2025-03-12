import fs from 'fs';
import path from 'path';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

/**
 * Sleep function to pause between API calls
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} - Promise that resolves after the specified time
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Analyzes tweets for a specific user and generates a summary using OpenAI
 * @param {Object} openai - OpenAI client instance
 * @param {string} username - Twitter username to analyze
 * @param {Array} twitterData - Array of tweets
 * @returns {Object} - Analysis results
 */
async function analyzeUserTweets(openai, username, twitterData) {
    console.log(`\nAnalyzing tweets for @${username}...`);
    
    // Filter tweets by the specified username
    const userTweets = twitterData.filter(tweet => {
        if (!tweet.user) return false;
        
        // Extract username from URL if available
        let screenName = null;
        if (tweet.url) {
            const urlParts = tweet.url.split('/');
            if (urlParts.length > 3) {
                screenName = urlParts[3];
            }
        }
        
        const tweetUsername = screenName || tweet.user.screen_name || '';
        return tweetUsername.toLowerCase() === username.toLowerCase();
    });
    
    console.log(`Found ${userTweets.length} tweets by @${username}`);
    
    if (userTweets.length === 0) {
        return {
            username,
            tweetCount: 0,
            tweets: [],
            summary: "No tweets found for this user."
        };
    }
    
    // Log each tweet for verification
    console.log(`\n@${username}'s tweets:`);
    userTweets.forEach((tweet, index) => {
        console.log(`\nTweet ${index + 1}:`);
        console.log(`Date: ${tweet.created_at || 'Unknown date'}`);
        console.log(`Content: ${tweet.full_text || tweet.text || 'No content'}`);
        console.log('-'.repeat(50));
    });
    
    // Extract text content from tweets
    const tweetTexts = userTweets.map(tweet => {
        return tweet.full_text || tweet.text || '';
    }).filter(text => text.length > 0);
    
    // Join tweets for analysis
    const tweetContent = tweetTexts.join('\n\n');
    
    // Create the system and user messages
    const systemMessage = "You are an analyst who specializes in summarizing social media content. Provide a concise summary of the main topics, themes, and sentiments in these tweets.";
    const userMessage = `Please analyze these tweets from @${username} and provide a summary of what they mainly talked about:\n\n${tweetContent}`;
    
    console.log(`Sending @${username}'s tweets to OpenAI for analysis...`);
    
    try {
        // Send to OpenAI for summarization
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { 
                    role: "system", 
                    content: systemMessage
                },
                {
                    role: "user",
                    content: userMessage
                },
            ],
        });
        
        // Get the summary
        const summary = completion.choices[0].message.content;
        
        // Display the summary
        console.log(`\nSummary of @${username}'s tweets:`);
        console.log(summary);
        
        return {
            username,
            tweetCount: userTweets.length,
            tweets: userTweets,
            prompt: {
                system: systemMessage,
                user: userMessage
            },
            summary
        };
    } catch (error) {
        console.error(`Error analyzing @${username}'s tweets:`, error.message);
        return {
            username,
            tweetCount: userTweets.length,
            tweets: userTweets,
            error: error.message
        };
    }
}

/**
 * Saves analysis results to a file
 * @param {Object} analysis - Analysis results
 */
async function saveAnalysisToFile(analysis) {
    try {
        // Create a timestamp for the filename
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const outputFilePath = path.join(__dirname, '../testdata', `${analysis.username}_analysis_${timestamp}.txt`);
        
        // Prepare the content to write to the file
        const fileContent = `
===========================================
TWITTER ANALYSIS FOR @${analysis.username} - ${timestamp}
===========================================

PROMPT:
-------
System: ${analysis.prompt?.system || 'N/A'}

User: ${analysis.prompt?.user || 'N/A'}

TWEETS ANALYZED:
---------------
${analysis.tweets.map((tweet, index) => {
    return `Tweet ${index + 1}:
Date: ${tweet.created_at || 'Unknown date'}
Content: ${tweet.full_text || tweet.text || 'No content'}
`;
}).join('\n')}

ANALYSIS RESULTS:
----------------
${analysis.summary || analysis.error || 'No analysis available.'}
`;
        
        // Write to file
        fs.writeFileSync(outputFilePath, fileContent);
        console.log(`Analysis saved to: ${outputFilePath}`);
        
        return outputFilePath;
    } catch (error) {
        console.error('Error saving analysis to file:', error.message);
        return null;
    }
}

async function main() {
    try {
        // Initialize the OpenAI client with API key from environment variables
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        // Path to the Twitter data file
        const dataFilePath = path.join(__dirname, '../testdata/twitter_scraped_data_2025-03-11T07-44-24-516Z.json');
        
        // Path to the usernames JSON file
        const usernamesFilePath = path.join(__dirname, '../testdata/twitter_usernames_2025-03-11T12-33-15.898Z.json');
        
        // Read and parse the Twitter data
        console.log('Reading Twitter data file...');
        const rawData = fs.readFileSync(dataFilePath, 'utf8');
        const twitterData = JSON.parse(rawData);
        
        // Read and parse the usernames file
        console.log('Reading usernames file...');
        const rawUsernamesData = fs.readFileSync(usernamesFilePath, 'utf8');
        const usernamesData = JSON.parse(rawUsernamesData);
        
        console.log(`Found ${usernamesData.users.length} users to analyze.`);
        
        // Create a timestamp for the summary file
        const summaryTimestamp = new Date().toISOString().replace(/:/g, '-');
        const summaryFilePath = path.join(__dirname, '../testdata', `twitter_analysis_summary_${summaryTimestamp}.json`);
        
        // Array to store all analysis results
        const allAnalyses = [];
        
        // Process each username with a delay between API calls
        for (let i = 0; i < usernamesData.users.length; i++) {
            const user = usernamesData.users[i];
            console.log(`\nProcessing user ${i+1}/${usernamesData.users.length}: @${user.username}`);
            
            // Analyze the user's tweets
            const analysis = await analyzeUserTweets(openai, user.username, twitterData);
            
            // Save the analysis to a file
            const filePath = await saveAnalysisToFile(analysis);
            
            // Add to the summary
            allAnalyses.push({
                username: user.username,
                name: user.name,
                tweetCount: analysis.tweetCount,
                summary: analysis.summary || analysis.error || 'No analysis available.',
                filePath: filePath
            });
            
            // Save the current progress to the summary file
            const summaryData = {
                metadata: {
                    timestamp: summaryTimestamp,
                    source_file: 'twitter_scraped_data_2025-03-11T07-05-06-272Z.json',
                    usernames_file: 'twitter_usernames_2025-03-11T11-46-54.112Z.json',
                    total_users: usernamesData.users.length,
                    processed_users: i + 1
                },
                analyses: allAnalyses
            };
            
            fs.writeFileSync(summaryFilePath, JSON.stringify(summaryData, null, 2));
            console.log(`Updated summary saved to: ${summaryFilePath}`);
            
            // Pause between API calls to avoid rate limits (3 seconds)
            if (i < usernamesData.users.length - 1) {
                console.log(`Pausing for 3 seconds before processing the next user...`);
                await sleep(3000);
            }
        }
        
        console.log(`\nAnalysis complete! Processed ${usernamesData.users.length} users.`);
        console.log(`Summary saved to: ${summaryFilePath}`);
        
    } catch (error) {
        console.error('Error:', error.message);
        if (error.message.includes('api_key')) {
            console.error('\nMake sure you have set the OPENAI_API_KEY in your .env file');
        } else if (error.code === 'ENOENT') {
            console.error('\nFile not found. Please check the path to the Twitter data file.');
        }
    }
}

// Run the main function
main(); 