import { GoogleGenAI } from "@google/genai";

console.log("KEY:", process.env.GEMINI_API_KEY);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function run() {
  const response = await ai.models.generateContent({
    model: "models/gemini-flash-latest",
    contents: "Say hello in one sentence",
  });

  console.log(response.text);
}

run();
