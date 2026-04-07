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
    const { text, language, format } = await req.json();

    if (!text || text.trim().length < 10) {
      return new Response(JSON.stringify({ error: "Text too short to summarize" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const langInstruction = language === "ms"
      ? "Respond entirely in Bahasa Malaysia."
      : "Respond entirely in English.";

    const formatInstruction = format === "bullets"
      ? "Format as concise bullet points with key concepts highlighted."
      : format === "outline"
      ? "Format as a structured outline with main topics and subtopics."
      : "Format as a brief paragraph summary.";

    const systemPrompt = `You are a study summary assistant for Malaysian students (KSSM/KBSM curriculum).
${langInstruction}

Summarize the following text for studying purposes.
${formatInstruction}

Keep it concise, clear, and exam-focused. Highlight key terms, formulas, and important concepts.
Use markdown formatting for better readability.`;

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
          { role: "user", content: text },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("AI API error:", err);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Failed to generate summary" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || "Could not generate summary.";

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
