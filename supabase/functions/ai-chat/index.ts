const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const API_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages, language } = await req.json();

    const systemPrompt = language === "ms"
      ? `Anda adalah EduBot, pembantu belajar AI untuk pelajar Malaysia Tingkatan 1–5. Jawab dalam Bahasa Malaysia. Berikan jawapan yang tepat, mesra, dan sesuai dengan kurikulum Malaysia (KSSM/KBSM). Gunakan emoji untuk menjadikan pembelajaran menyeronokkan. Jika pelajar bertanya di luar topik akademik, arahkan mereka kembali ke pembelajaran dengan cara yang positif.`
      : `You are EduBot, an AI study assistant for Malaysian Forms 1–5 students. Respond in English. Provide accurate, friendly, and age-appropriate answers aligned with the Malaysian curriculum (KSSM/KBSM). Use emojis to make learning fun. If students ask off-topic questions, gently guide them back to learning.`;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("AI API error:", err);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
