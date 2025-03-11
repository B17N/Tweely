import fs from 'fs';
import path from 'path';

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
            "result_count": data.length.toString(),
            "since_date": "2025-03-05",
            "start_urls": usernames.map(username => ({
                "url": `https://twitter.com/${username}`,
                "method": "GET"
            }))
        };
        
        // Output the formatted JSON
        console.log('\nFormatted JSON output:');
        console.log(JSON.stringify(outputJson, null, 4));
        
        return outputJson;
    } catch (error) {
        console.error('Error processing Twitter data:', error);
        return null;
    }
}

// Run the function
readTwitterData(); 