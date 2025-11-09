import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symptoms, videoFilename, conversationHistory = [] } = await req.json();
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('[TriageAgent]: Analyzing patient data - Symptoms:', symptoms, 'Video:', videoFilename);

    // Build conversation messages
    const messages = [
      {
        role: 'system',
        content: `You are an expert medical triage AI agent. Your role is to quickly and decisively assess patient severity.

CRITICAL INSTRUCTIONS:
- Ask AT MOST ONE clarifying question, and ONLY if absolutely critical for safety
- In most cases, make your assessment immediately without asking questions
- Be decisive - don't over-question the patient
- Prioritize speed while maintaining accuracy`
      },
      {
        role: 'user',
        content: `Patient Information:
- Symptoms: ${symptoms}
- Video assessment: ${videoFilename}

${conversationHistory.length > 0 ? `Previous conversation:\n${conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}\n\n` : ''}

Assess severity (1-10):
- 1-3: Minor (sprains, minor cuts)
- 4-6: Moderate (fractures, severe pain)
- 7-9: Serious (deep lacerations, suspected internal injuries)
- 10: Critical/Life-threatening (stroke, heart attack, severe trauma)

Provide detailed triage notes and recommendations for the patient.

If you MUST ask a clarifying question (only if critical), ask ONE specific question.

Respond in JSON format:
{
  "severity": number,
  "triageNotes": "detailed assessment notes",
  "recommendations": "specific advice to patient (e.g., keep limb elevated, apply pressure, stay still)",
  "needsMoreInfo": boolean,
  "question": "your question if needsMoreInfo is true, otherwise omit this field"
}`
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', data);
      throw new Error(`OpenAI API error: ${JSON.stringify(data)}`);
    }

    let responseText = data.choices[0].message.content;
    
    // Strip markdown code blocks if present
    if (responseText.includes('```')) {
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }
    
    const result = JSON.parse(responseText);
    
    console.log('[TriageAgent]: Assessment complete - Severity:', result.severity);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in triage-assessment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
