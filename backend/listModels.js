require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function checkModels() {
    console.log("Asking Google for your approved models via the NEW SDK...");
    try {
        const response = await ai.models.list();
        
        console.log("\n--- YOUR APPROVED MODELS ---");
        for await (const model of response) {
            if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes("generateContent")) {
                console.log(`✅ ${model.name}`);
            }
        }
        console.log("----------------------------\n");
    } catch (error) {
        console.error("Failed to fetch models:", error);
    }
}

checkModels();