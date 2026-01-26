import { GoogleGenAI, Type } from "@google/genai";
import { ServiceType } from "../types";

export interface AIAnalysisResult {
  suggestedService: ServiceType;
  shortSummary: string;
  estimatedCostRange: string;
}

export const analyzeVehicleIssue = async (
  vehicleType: string, 
  issueDescription: string
): Promise<AIAnalysisResult | null> => {
  if (!process.env.API_KEY) {
    console.warn("Gemini API Key not found. Skipping AI analysis.");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      You are an expert mechanic AI assistant for a roadside assistance app called Mech On Wheels.
      
      Vehicle Type: ${vehicleType}
      User Issue Description: "${issueDescription}"
      
      Based on this, suggest the most appropriate service type from these three options:
      1. 'onsite_repair' (for minor fixes like flat tyre, battery jumpstart, small mechanical issues)
      2. 'towing' (for major breakdowns, engine failure, accidents, smoke)
      3. 'fuel_delivery' (if the user ran out of gas/petrol)
      
      Also provide a 1-sentence summary of the likely problem and a rough estimated cost range in USD (e.g. $50-$100).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedService: {
              type: Type.STRING,
              description: "The suggested service type",
              enum: ['onsite_repair', 'towing', 'fuel_delivery']
            },
            shortSummary: { 
              type: Type.STRING,
              description: "A short 1-sentence summary of the diagnosis"
            },
            estimatedCostRange: { 
              type: Type.STRING,
              description: "Estimated cost range in USD"
            }
          },
          required: ["suggestedService", "shortSummary", "estimatedCostRange"]
        }
      }
    });

    const text = response.text;
    if (text) {
        return JSON.parse(text) as AIAnalysisResult;
    }
    return null;

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return null;
  }
};