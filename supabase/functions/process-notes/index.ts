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
    const { text, images, language, subject, formLevel } = await req.json();

    if ((!text || text.trim().length < 10) && (!images || images.length === 0)) {
      return new Response(JSON.stringify({ error: "Provide text or images to process" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const langInstruction = language === "ms"
      ? "Respond entirely in Bahasa Malaysia."
      : "Respond entirely in English.";

    const systemPrompt = `You are a study assistant for Malaysian curriculum (KSSM/KBSM) students.
${langInstruction}

Analyze the provided notes (text and/or images of handwritten/printed notes) and produce a comprehensive study package.

${subject ? `Subject: ${subject}` : ""}
${formLevel ? `Form Level: ${formLevel}` : ""}

CRITICAL: Respond with ONLY valid JSON. No markdown, no code blocks.

The JSON must have this exact shape:
{
  "summary": "A concise markdown-formatted summary (3-6 short paragraphs or bullet sections) covering the main ideas",
  "keyPoints": ["array", "of", "5-10 short key takeaways as plain strings"],
  "flashcards": [
    {"front": "question/term", "back": "answer/definition", "difficulty": "easy|medium|hard"}
  ],
  "quiz": [
    {"question": "...", "type": "mcq", "options": ["A","B","C","D"], "correct_answer": "exact option", "explanation": "..."}
  ]
}

Generate exactly 8 flashcards and exactly 5 multiple-choice quiz questions. Make them exam-focused.`;

    // Build user content (multimodal if images present)
    const userContent: any[] = [];
    if (text && text.trim()) {
      userContent.push({ type: "text", text: `Notes:\n${text}` });
    } else {
      userContent.push({ type: "text", text: "Extract content from the attached image(s) and produce the study package." });
    }
    if (images && Array.isArray(images)) {
      for (const img of images) {
        userContent.push({ type: "image_url", image_url: { url: img } });
      }
    }

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("AI API error:", response.status, err);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Failed to process notes" }), {
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
