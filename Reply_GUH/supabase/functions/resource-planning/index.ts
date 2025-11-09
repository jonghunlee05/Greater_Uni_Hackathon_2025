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
    const { patient, hospitalCapacity } = await req.json();
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('[OpsAgent]: Generating resource plan for patient', patient.nhs_number);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert hospital operations AI agent. Your role is to optimize patient flow and resource allocation. Generate detailed operational plans for incoming emergency patients.`
          },
          {
            role: 'user',
            content: `Create a comprehensive resource allocation plan for this incoming patient:

Patient Details:
- Name: ${patient.patient_name}
- NHS Number: ${patient.nhs_number}
- Severity: ${patient.severity}/10
- Triage Notes: ${patient.triage_notes}
- ETA: ${patient.eta_minutes} minutes

Hospital Context:
- Current capacity: ${hospitalCapacity.current}/${hospitalCapacity.max}
- Available specialties: Emergency Medicine, Trauma Surgery, Neurology, Cardiology

Based on the severity and condition, provide:
1. Which ambulance entrance to use (Ambulance Bay A, B, Z, or Main Entrance)
2. Which room/bay to prepare (specific bay numbers like "Trauma Room 3", "Stroke Bay 2", "General Pod")
3. Which specialists need to be paged (be specific)
4. What equipment needs to be prepared
5. Which staff should be contacted for tool preparation
6. Which areas need to be cleared for smooth flow from ambulance to treatment area

Respond in JSON format:
{
  "entrance": "specific entrance name",
  "roomAssignment": "specific room/bay",
  "specialistsNeeded": ["list of specialists"],
  "equipmentRequired": ["list of equipment"],
  "staffToContact": ["list of staff roles"],
  "areasToClear": ["list of areas/corridors"],
  "planText": "step-by-step plan in numbered list format",
  "priority": "HIGH/MEDIUM/LOW"
}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1000,
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
    
    console.log('[OpsAgent]: Resource plan generated -', result.entrance);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in resource-planning:', error);
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
