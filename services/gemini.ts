
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getStylistAdvice = async (productName: string, category: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a high-end minimalist fashion stylist for a brand like COS. Provide 2 concise styling tips for a "${productName}" in the "${category}" category. Keep it editorial, sophisticated, and under 60 words total.`,
      config: {
        temperature: 0.7,
      }
    });
    return response.text || "Pair with neutral tones and clean silhouettes for a timeless look.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Style with monochromatic essentials for a sophisticated minimalist aesthetic.";
  }
};

export const generateProductDescription = async (name: string, category: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Write a sophisticated, editorial-style product description for a clothing item named "${name}" in the category "${category}". Focus on quality, sustainability, and timeless design. Keep it under 50 words.`,
    });
    return response.text || "Crafted for durability and style, this piece embodies modern luxury.";
  } catch (error) {
    return "A premium addition to your wardrobe, designed with meticulous attention to detail and sustainable materials.";
  }
};
