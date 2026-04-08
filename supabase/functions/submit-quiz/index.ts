import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the user with anon client
    const supabaseUser = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { questions, answers, subject, formLevel, difficulty, questionType } = body;

    // Validate input
    if (!Array.isArray(questions) || !questions.length || questions.length > 50) {
      return new Response(JSON.stringify({ error: "Invalid questions array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof answers !== "object" || answers === null) {
      return new Response(JSON.stringify({ error: "Invalid answers object" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!subject || typeof subject !== "string" || subject.length > 255) {
      return new Response(JSON.stringify({ error: "Invalid subject" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const fl = Number(formLevel);
    if (!Number.isInteger(fl) || fl < 1 || fl > 5) {
      return new Response(JSON.stringify({ error: "Invalid form level" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Server-side grading: compute correct answers independently
    let correctCount = 0;
    const gradedData = questions.map((q: any, i: number) => {
      const userAnswer = (answers[String(i)] || "").toLowerCase().trim();
      const correctAnswer = (q.correct_answer || "").toLowerCase().trim();
      const isCorrect = userAnswer === correctAnswer;
      if (isCorrect) correctCount++;
      return {
        question: q.question,
        type: q.type,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        user_answer: answers[String(i)] || "",
      };
    });

    const totalQuestions = questions.length;
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);

    // Insert using service role (bypasses RLS since we removed INSERT policy)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { error: insertError } = await supabaseAdmin.from("quiz_results").insert({
      user_id: user.id,
      subject: subject.slice(0, 255),
      form_level: fl,
      difficulty: (difficulty || "medium").slice(0, 20),
      question_type: (questionType || "mcq").slice(0, 20),
      total_questions: totalQuestions,
      correct_answers: correctCount,
      score_percentage: scorePercentage,
      quiz_data: gradedData,
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to save quiz result" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        correct_answers: correctCount,
        total_questions: totalQuestions,
        score_percentage: scorePercentage,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
