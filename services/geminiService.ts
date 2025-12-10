import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeSportsImage = async (base64Image: string): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key provided. Returning mock data.");
    return {
      sportType: "Demo Sport",
      lightingCondition: "OUTDOOR_DAY",
      sceneAttributes: {
        brightness: 'HIGH',
        dominantColors: 'Green, Blue',
        lightSources: 'Sunlight'
      },
      detectedAthletes: [
        { ymin: 20, xmin: 30, ymax: 80, xmax: 70, label: "Athlete" }
      ],
      subjectDetected: true,
      suggestedEV: 0.3,
      suggestedWB: 0,
      confidence: 0.85
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          },
          {
            text: `Act as a professional sports photography editing system.
            1. Scene Classification: Analyze the image brightness, dominant colors, and light sources to classify it as OUTDOOR_DAY, OUTDOOR_NIGHT, or INDOOR.
            2. Object Detection (YOLO-style): Detect the main athletes in the frame. Return bounding boxes (ymin, xmin, ymax, xmax) normalized to 0-100 scale.
            3. Recommendations: Suggest EV offset and White Balance tint corrections.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sportType: { type: Type.STRING, description: "The specific sport." },
            lightingCondition: { 
              type: Type.STRING, 
              enum: ["OUTDOOR_DAY", "OUTDOOR_NIGHT", "INDOOR", "UNKNOWN"],
              description: "The environmental lighting context."
            },
            sceneAttributes: {
              type: Type.OBJECT,
              properties: {
                brightness: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] },
                dominantColors: { type: Type.STRING },
                lightSources: { type: Type.STRING, description: "E.g. Natural Sun, Stadium Floodlights, Gym Fluorescent" }
              }
            },
            detectedAthletes: {
              type: Type.ARRAY,
              description: "Bounding boxes for main athletes.",
              items: {
                type: Type.OBJECT,
                properties: {
                  ymin: { type: Type.NUMBER, description: "Top coordinate 0-100" },
                  xmin: { type: Type.NUMBER, description: "Left coordinate 0-100" },
                  ymax: { type: Type.NUMBER, description: "Bottom coordinate 0-100" },
                  xmax: { type: Type.NUMBER, description: "Right coordinate 0-100" },
                  label: { type: Type.STRING }
                }
              }
            },
            subjectDetected: { type: Type.BOOLEAN },
            suggestedEV: { type: Type.NUMBER },
            suggestedWB: { type: Type.NUMBER },
            confidence: { type: Type.NUMBER }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AnalysisResult;
    }
    
    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("Analysis failed:", error);
    // Fallback
    return {
      sportType: "Unknown",
      lightingCondition: "UNKNOWN",
      sceneAttributes: { brightness: 'MEDIUM', dominantColors: '-', lightSources: '-' },
      detectedAthletes: [],
      subjectDetected: false,
      suggestedEV: 0,
      suggestedWB: 0,
      confidence: 0
    };
  }
};