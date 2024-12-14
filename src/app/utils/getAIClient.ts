

import Groq from "groq-sdk";
const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface ChatMessage{

    role: "system" | "user" | "assistant";
    content: string

}
export async function getAIResponse(chatMessages: ChatMessage[]) {

    const query = `You are an expert in when scraping and web technologies. You are given a message to answer.
    In your response,
    --be clear, concise and to the point
    --site any sources that you grab information from, list a maximum of 5 sources
    `;

      // Validate chatMessages to ensure correct structure
  const validatedChatMessages = chatMessages.filter(
    (msg) => msg && typeof msg === "object" && "role" in msg && "content" in msg
  );

  if (validatedChatMessages.length !== chatMessages.length) {
    console.warn(
      "Some chatMessages entries were invalid and have been removed:",
      chatMessages.filter((msg) => !validatedChatMessages.includes(msg))
    );
  }
    const messages: ChatMessage[] = [
        {
          role: "system",
          content: query,
        },
        ...validatedChatMessages,
      ];
    const llmData = await client.chat.completions.create({
      
      model: "llama3-8b-8192",messages,
    });

    return llmData.choices[0].message.content;
  }