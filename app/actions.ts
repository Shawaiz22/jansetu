"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

export async function verifyCivicIssue(imageBase64: string, description: string): Promise<{
  status: "VALID" | "SPAM" | "INVALID";
  title: string;
  description: string;
  category: string;
}> {
  try {
    // Note: For a real hackathon, add your GEMINI_API_KEY in .env.local
    // If no key is present, we'll simulate a slight delay and return VALID for demo purposes.
    if (!process.env.GEMINI_API_KEY) {
      console.warn("No GEMINI_API_KEY found, simulating AI verification.");
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { status: "VALID" };
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `You are an elite civic moderator for JanSetu Bhopal. 
    Your goal is to prevent spam and ensure the report is accurate.
    
    STEP 1: CROSS-VERIFY
    Does the image provided actually match the user's description? 
    - If the user describes a pothole but the image is a selfie, a pet, or a random scene: It is SPAM.
    - If the image is a screenshot, meme, or non-photographic evidence: It is INVALID.
    - If the image and description both clearly show a valid civic infrastructure or public service problem: It is VALID.
    
    STEP 2: FORMALIZE (Only if VALID)
    - Create a SPECIFIC, formal title (3-5 words).
    - Rewrite the description into a formal technical report.
    - Categorize: [Roads, Sanitation, Electricity, Water, Public Safety].
    
    OUTPUT FORMAT:
    Line 1: VALID / SPAM / INVALID
    Line 2: [Formal Title] OR [Reason for rejection if not VALID]
    Line 3: [Formal Description]
    Line 4: [Category]
    
    User Raw Description: ${description}`;
    
    // The base64 string from the frontend might include the data URI prefix (e.g., "data:image/jpeg;base64,...")
    const match = imageBase64.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
    let base64Data = imageBase64;
    let mimeType = "image/jpeg";

    if (match) {
      mimeType = match[1];
      base64Data = match[2];
    } else {
      // Fallback if no prefix
      base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    }
    
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const lines = response.text().trim().split('\n').filter(l => l.trim() !== "");
    const status = lines[0]?.toUpperCase() || "INVALID";
    const aiTitleOrReason = lines[1] || "Unspecified issue";
    const aiDescription = lines[2] || description;
    const aiCategory = lines[3] || "General";
    
    const finalStatus: "VALID" | "SPAM" | "INVALID" = 
      (status.includes("VALID") && !status.includes("INVALID") && !status.includes("SPAM")) ? "VALID" : 
      status.includes("SPAM") ? "SPAM" : "INVALID";
    
    return { 
      status: finalStatus,
      title: aiTitleOrReason.replace(/[\[\]]/g, '').trim(),
      description: aiDescription.trim(),
      category: aiCategory.replace(/[\[\]]/g, '').trim()
    };
  } catch (error) {
    console.error("Error verifying issue with Gemini:", error);
    return { 
      status: "VALID" as const, 
      title: "Civic Report", 
      description: description,
      category: "General"
    };
  }
}
