const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

export const fetchAiAnalysis = async (prompt: string): Promise<string> => {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;
  const payload = { contents: [{ parts: [{ text: prompt }] }] };
  
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok)
    throw new Error("Failed to get analysis from AI. The model may be overloaded.");

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) throw new Error("No analysis content received from AI.");
  
  return text;
};
