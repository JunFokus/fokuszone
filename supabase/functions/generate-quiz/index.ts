const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const API_URL = "https://api.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { prompt, subject, formLevel, difficulty, questionType, numQuestions, language } = await req.json();

    const typeMap: Record<string, string> = {
      mcq: "multiple-choice with 4 options (A, B, C, D)",
      true_false: "true/false with options ['True', 'False']",
      short_answer: "short answer (1-3 words)",
      fill_blank: "fill-in-the-blank (the question should have a blank indicated by ___)",
    };

    const langInstruction = language === "ms"
      ? "Generate ALL questions, options, answers, and explanations in Bahasa Malaysia."
      : "Generate ALL questions, options, answers, and explanations in English.";

    const topicDesc = prompt
      ? `Topic: ${prompt}`
      : `Subject: ${subject}, Form/Level: ${formLevel}`;

    const systemPrompt = `You are a quiz generator for Malaysian curriculum (KSSM/KBSM) students. Generate exactly ${numQuestions} ${typeMap[questionType] || "multiple-choice"} questions.

${langInstruction}

${topicDesc}
Difficulty: ${difficulty}
Form Level: ${formLevel}

CRITICAL: Respond with ONLY valid JSON. No markdown, no code blocks, no explanation outside JSON.

The JSON must be an object with a "questions" array. Each question object must have:
- "question": the question text
- "type": "${questionType}"
- "options": array of options (for mcq/true_false only, omit for short_answer/fill_blank)
- "correct_answer": the exact correct answer string (must match one of the options for mcq/true_false)
- "explanation": brief explanation of why the answer is correct

Example format:
{"questions":[{"question":"What is 2+2?","type":"mcq","options":["3","4","5","6"],"correct_answer":"4","explanation":"2+2 equals 4."}]}`;

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
          { role: "user", content: `Generate the quiz now.` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("AI API error:", err);
      return new Response(JSON.stringify({ error: "Failed to generate quiz" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "{}";

    // Clean potential markdown wrapping
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const parsed = JSON.parse(content);

    return new Response(JSON.stringify(parsed), {
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
