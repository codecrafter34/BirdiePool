import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

export class AIService {
  static async getPerformanceInsights(userId: string, scores: number[]): Promise<string> {
    if (!process.env.GEMINI_API_KEY) {
      return "AI insights unavailable. Keep logging scores!";
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // In a real scenario, check if scores_hash matches cached DB version before generating

    const prompt = `You are a premium golf performance coach for BirdiePool. Analyze these recent Stableford scores (max 45): ${scores.join(", ")}. Provide a brief 2-sentence encouraging insight on the user's trend and consistency. Do not mention that you are an AI.`;
    
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      // Cache the insight in the ai_insights table...
      return text;
    } catch (e) {
      console.error("Gemini API Error:", e);
      return "Keep up the great work on the course! Continue logging your scores to unlock deeper performance trends.";
    }
  }
}
