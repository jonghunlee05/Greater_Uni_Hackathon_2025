import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, formType } = await req.json();
    
    if (!text) {
      throw new Error('No text provided');
    }

    if (!formType || !['patient', 'responder'].includes(formType)) {
      throw new Error('Invalid form type. Must be "patient" or "responder"');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`[StructureText]: Processing ${formType} form text...`);

    let systemPrompt = '';
    
    if (formType === 'patient') {
      systemPrompt = `You are a medical assistant helping to structure patient symptom descriptions. 
Take the provided text and structure it into a clear, concise medical symptom description suitable for triage assessment.
Focus on:
- Main symptoms and their severity
- Duration and onset
- Any relevant medical history mentioned
- Location of pain or injury if applicable

Format the output as a single paragraph, 2-4 sentences maximum. Be precise and medical in tone.
Do not add information that wasn't mentioned. Only restructure what was said.`;
    } else {
      systemPrompt = `You are a medical assistant helping first responders document their assessments.
Take the provided text and structure it into three separate sections:

1. CURRENT SYMPTOMS: Clear description of observed symptoms and patient condition
2. ACTIONS TAKEN: Medical interventions and procedures performed
3. ADDITIONAL NOTES: Any other relevant information

Format each section clearly. Be concise but thorough. Use medical terminology where appropriate.
Do not add information that wasn't mentioned. Only restructure what was said into the three sections.

Return in JSON format:
{
  "symptoms": "...",
  "actions": "...",
  "notes": "..."
}`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[StructureText]: AI API error:', errorText);
      throw new Error(`AI API error: ${errorText}`);
    }

    const data = await response.json();
    const structuredText = data.choices[0].message.content;
    
    console.log('[StructureText]: Text structured successfully');

    // For responder type, parse JSON response
    if (formType === 'responder') {
      try {
        const parsed = JSON.parse(structuredText);
        return new Response(
          JSON.stringify({ 
            structured: parsed,
            type: 'responder'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (e) {
        console.error('[StructureText]: Failed to parse JSON response, returning as single text');
      }
    }

    return new Response(
      JSON.stringify({ 
        structured: structuredText,
        type: 'patient'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[StructureText]: Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
