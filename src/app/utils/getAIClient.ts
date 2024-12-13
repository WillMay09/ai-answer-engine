

import Groq from "groq-sdk";
const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface ChatMessage{

    role: "system" | "user" | "assistant";
    content: string

}
export async function getAIResponse(message: string) {

    const query = `You are an expert in when scraping and web technologies. You are given a message to answer.
    In your response,
    --be clear, concise and to the point
    --site any sources that you grab information from, list a maximum of 5 sources
    `;
    const messages: ChatMessage[] = [
        {
          role: "system",
          content: query,
        },
        {
          role: "user",
          content: message,
        },
      ];
    const llmData = await client.chat.completions.create({
      
      model: "llama3-8b-8192",messages: messages
    });

    return llmData.choices[0].message.content;
  }