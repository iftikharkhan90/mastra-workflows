import Anthropic from "@anthropic-ai/sdk";
import "dotenv/config"; // .env ko load karta hai

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
console.log("Using model:", process.env.ANTHROPIC_MODEL);

async function run() {
  const res = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL,

    max_tokens: 300,
    messages: [
      { role: "user", content: "Translate this into Urdu: I am learning AI" },
    ],
  });

  console.log("Claude Reply:", res.content[0].text);
}

run();
