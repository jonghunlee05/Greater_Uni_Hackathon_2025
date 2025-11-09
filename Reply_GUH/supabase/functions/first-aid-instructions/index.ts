import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { symptoms } = await req.json()
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured')
    }

    const systemPrompt = `You are a UK NHS first-aid assistant providing simple, clear instructions to civilians (NOT medical professionals) to help stabilize a patient until emergency services arrive.

CRITICAL RULES:
- This is for the UNITED KINGDOM - use NHS guidelines and UK medical terminology
- Keep instructions EXTREMELY simple and actionable
- Use short sentences and bullet points
- Focus on preventing deterioration, not diagnosis
- Prioritize safety for both patient and helper
- Give 3-5 key immediate actions
- Remind them that the ambulance (999) is on the way
- DO NOT use medical jargon
- Be calm and reassuring
- Reference UK-specific procedures where relevant (e.g., recovery position, calling 999)`

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
          { role: 'user', content: `Patient symptoms: ${symptoms}\n\nProvide simple first-aid instructions while waiting for ambulance.` }
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('AI API error:', response.status, errorText)
      throw new Error(`AI API error: ${response.status}`)
    }

    const data = await response.json()
    const instructions = data.choices[0]?.message?.content || 'Stay calm. Help is on the way.'

    return new Response(
      JSON.stringify({ instructions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
