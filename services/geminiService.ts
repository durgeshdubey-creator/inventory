import { GoogleGenAI, Type } from "@google/genai";
import { LogParsingResult, NetworkInterface } from "../types";

// Initialize Gemini API Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Simulates an SSH connection by generating synthetic raw server logs.
 * This is used for demonstration purposes if the user doesn't have real logs to paste.
 */
export const generateSyntheticServerLogs = async (type: 'AMD' | 'Intel'): Promise<string> => {
  const prompt = `
    Generate a realistic, raw text output that looks like a combination of Linux commands:
    'dmidecode -t system', 'lscpu', and 'ip addr'.
    
    The server should be a high-frequency trading server.
    
    Requirements:
    - Manufacturer: Dell, HP, or Supermicro.
    - CPU: ${type === 'AMD' ? 'AMD EPYC 9004 series' : 'Intel Xeon Platinum 8400 series'}. Dual Socket.
    - RAM: High amount (e.g., 512GB or 1TB).
    - Network: Include a standard 1G management interface, and at least one high-performance card (ExaNIC or Solarflare) with 10G or 25G IPs.
    
    Output ONLY the raw text log, nothing else.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Failed to generate logs.";
  } catch (error) {
    console.error("Error generating logs:", error);
    throw new Error("Failed to connect to AI for log generation.");
  }
};

/**
 * Parses raw server logs (lscpu, dmidecode, ip addr) into structured JSON.
 */
export const parseServerLogs = async (rawLogs: string): Promise<LogParsingResult> => {
  const prompt = `
    Analyze the following raw server logs (which may contain output from lscpu, dmidecode, ip addr, etc.).
    Extract the hardware inventory details.

    Raw Logs:
    ${rawLogs}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            manufacturer: { type: Type.STRING, description: "Server OEM (e.g., Dell, HP)" },
            model: { type: Type.STRING, description: "Server Model Name" },
            cpuModel: { type: Type.STRING, description: "Full CPU Model Name" },
            cpuCount: { type: Type.INTEGER, description: "Number of physical CPUs (sockets)" },
            ramGb: { type: Type.INTEGER, description: "Total RAM in GB" },
            interfaces: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Interface name (eth0, p1p1)" },
                  ip: { type: Type.STRING, description: "IP Address (IPv4)" },
                  speed: { type: Type.STRING, description: "Link Speed (1G, 10G, etc.)" },
                  type: { type: Type.STRING, description: "Type: Management, ExaNIC, Solarflare, or Standard" }
                }
              }
            }
          },
          required: ["manufacturer", "model", "cpuModel", "cpuCount", "ramGb", "interfaces"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const parsed = JSON.parse(text) as LogParsingResult;
    return parsed;
  } catch (error) {
    console.error("Error parsing logs:", error);
    throw new Error("Failed to parse server logs.");
  }
};