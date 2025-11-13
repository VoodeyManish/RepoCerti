
import { GoogleGenAI, Type } from "@google/genai";
import { CertificateData } from "../types";

// Ensure the API key is available from environment variables
if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = async (file: File) => {
    const base64EncodedData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });

    return {
        inlineData: {
            data: base64EncodedData,
            mimeType: file.type,
        },
    };
};

export const generateReportSection = async (topic: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: `Generate a professional, well-structured report section about the following topic: "${topic}". The section should be detailed, insightful, and ready for inclusion in a business or academic document.`,
            config: {
                temperature: 0.7,
                topP: 0.95,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error generating report section:", error);
        throw new Error("Failed to communicate with the AI model.");
    }
};

export const improveReportText = async (text: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: `Please review and improve the following text for clarity, grammar, and professional tone. Keep the original meaning intact but enhance the overall quality of the writing. Here is the text:\n\n---\n\n${text}`,
            config: {
                temperature: 0.5,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error improving report text:", error);
        throw new Error("Failed to communicate with the AI model.");
    }
};

export const extractCertificateInfo = async (file: File): Promise<CertificateData> => {
    const imagePart = await fileToGenerativePart(file);

    const certificateSchema = {
        type: Type.OBJECT,
        properties: {
            recipientName: { type: Type.STRING, description: "Full name of the person who received the certificate." },
            certificateId: { type: Type.STRING, description: "The unique identifier or serial number of the certificate." },
            courseTitle: { type: Type.STRING, description: "The name of the course, program, or achievement being certified." },
            issuingAuthority: { type: Type.STRING, description: "The organization, company, or institution that issued the certificate." },
            issueDate: { type: Type.STRING, description: "The date the certificate was issued (e.g., 'YYYY-MM-DD' or 'Month Day, YYYY')." },
        },
        required: ["recipientName", "courseTitle", "issuingAuthority", "issueDate"],
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { text: "Extract the key details from this certificate image and provide the output in the specified JSON format. If a piece of information like 'certificateId' is not present, return an empty string for that field." },
                    imagePart
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: certificateSchema,
            },
        });

        const jsonString = response.text.trim();
        // Sometimes the model might wrap the JSON in markdown backticks, so we clean it.
        const cleanedJsonString = jsonString.replace(/^```json\s*|```$/g, '');
        const parsedData = JSON.parse(cleanedJsonString);
        
        // Ensure all keys are present, even if empty
        const finalData: CertificateData = {
            recipientName: parsedData.recipientName || '',
            certificateId: parsedData.certificateId || '',
            courseTitle: parsedData.courseTitle || '',
            issuingAuthority: parsedData.issuingAuthority || '',
            issueDate: parsedData.issueDate || '',
        };

        return finalData;

    } catch (error) {
        console.error("Error extracting certificate info:", error);
        throw new Error("Failed to parse certificate information from the AI model.");
    }
};
