import OpenAI from "openai";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
    try {
        // Initialize the OpenAI client with API key from environment variables
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        console.log('Sending request to OpenAI...');
        
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                {
                    role: "user",
                    content: "Write a haiku about recursion in programming.",
                },
            ],
        });

        console.log('\nResponse from OpenAI:');
        console.log(completion.choices[0].message.content);
    } catch (error) {
        console.error('Error:', error.message);
        if (error.message.includes('api_key')) {
            console.error('\nMake sure you have set the OPENAI_API_KEY in your .env file');
        }
    }
}

// Run the main function
main();