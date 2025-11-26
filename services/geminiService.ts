import { GoogleGenAI, Type } from "@google/genai";
import { ServiceType } from "../types";

// NOTE: Ensure REACT_APP_GEMINI_API_KEY is set in your .env
const apiKey = process.env.API_KEY || process.env.REACT_APP_GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export interface AIAnalysisResult {
  suggestedService: ServiceType;
  shortSummary: string;
  estimatedCostRange: string;
}

export const analyzeVehicleIssue = async (
  vehicleType: string, 
  issueDescription: string
): Promise<AIAnalysisResult | null> => {
  if (!ai) {
    console.warn("Gemini API Key not found. Skipping AI analysis.");
    return null;
  }

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      You are an expert mechanic AI assistant for a roadside assistance app.
      
      Vehicle Type: ${vehicleType}
      User Issue Description: "${issueDescription}"
      
      Based on this, suggest the most appropriate service type from these three options:
      1. 'onsite_repair' (for minor fixes like flat tyre, battery jumpstart, small mechanical issues)
      2. 'towing' (for major breakdowns, engine failure, accidents, smoke)
      3. 'fuel_delivery' (if the user ran out of gas/petrol)
      
      Also provide a 1-sentence summary of the likely problem and a rough estimated cost range in USD (e.g. $50-$100).
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedService: {
              type: Type.STRING,
              enum: ['onsite_repair', 'towing', 'fuel_delivery']
            },
            shortSummary: { type: Type.STRING },
            estimatedCostRange: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text) as AIAnalysisResult;
    }
    return null;

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return null;
  }
};
