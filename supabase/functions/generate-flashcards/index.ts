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
    const { notes, subject, formLevel, language, count } = await req.json();

    const langInstruction = language === "ms"
      ? "Generate ALL flashcards in Bahasa Malaysia."
      : "Generate ALL flashcards in English.";

    const systemPrompt = `You are a flashcard generator for Malaysian curriculum (KSSM/KBSM) students.
Generate exactly ${count || 10} flashcards from the given notes or topic.

${langInstruction}

Subject: ${subject || "General"}
Form Level: ${formLevel || 1}

CRITICAL: Respond with ONLY valid JSON. No markdown, no code blocks.

The JSON must be an object with a "flashcards" array. Each flashcard object must have:
- "front": the question or term (concise)
- "back": the answer or definition (clear and brief)
- "difficulty": "easy", "medium", or "hard"

Example: {"flashcards":[{"front":"What is photosynthesis?","back":"The process by which plants convert sunlight, water, and CO2 into glucose and oxygen.","difficulty":"easy"}]}`;

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
          { role: "user", content: notes || `Generate flashcards about ${subject} for Form ${formLevel}` },
        ],
        response_format: { type: "json_object" },
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
      return new Response(JSON.stringify({ error: "Failed to generate flashcards" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "{}";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(content);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
