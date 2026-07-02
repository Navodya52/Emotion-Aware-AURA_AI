const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

const URL = "https://openrouter.ai/api/v1/chat/completions";

export async function sendMessage(messages) {
  const response = await fetch(URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:5173",
      "X-Title": "AURA AI",
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-chat-v3.1",
      messages,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "OpenRouter Error");
  }

  return data.choices[0].message.content;
}
export async function analyzeImage(base64Image, prompt) {
  const response = await fetch(URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:5173",
      "X-Title": "AURA AI",
    },
    body: JSON.stringify({
      model: "qwen/qwen2.5-vl-72b-instruct:free",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt || "Describe this image.",
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image,
              },
            },
          ],
        },
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Image Analysis Error");
  }

  return data.choices[0].message.content;
}