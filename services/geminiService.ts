
import { GoogleGenAI } from "@google/genai";

export async function generateBlogHelper(prompt: string, task: 'summary' | 'title' | 'proofread') {
  // 严格遵守指南：必须使用 named parameter 初始化，并直接使用 process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstructions = {
    summary: "你是一个专业的文学编辑，请为这段博文内容生成一段 100 字以内的精炼摘要。",
    title: "你是一个标题党专家，请根据内容生成 3 个吸引人的博客标题。",
    proofread: "你是一个专业的校对员，请检查并修正这段文字的错别字和语法问题，保持语气自然。"
  };

  try {
    // 必须直接使用 ai.models.generateContent 调用模型
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstructions[task] || "You are a helpful assistant.",
        temperature: 0.7,
      }
    });
    
    // response.text 是一个属性，直接访问即可获取生成的文本
    return response.text || "AI 无法生成内容。";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI 服务暂时不可用。";
  }
}
