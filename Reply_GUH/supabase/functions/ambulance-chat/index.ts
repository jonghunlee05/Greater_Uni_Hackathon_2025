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
    const { message, patientContext } = await req.json()
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured')
    }

    const systemPrompt = `You are an NHS ambulance paramedic currently en route to a patient emergency in the UK. You are communicating via text with the patient or their companion while driving to their location.

YOUR ROLE:
- You are a trained UK paramedic with years of experience
- You are calm, professional, and reassuring
- You use everyday language, not medical jargon
- You are currently driving the ambulance to their location
- ETA is approximately 1 minute

COMMUNICATION STYLE:
- Use natural, conversational British English
- Keep responses SHORT (1-3 sentences maximum)
- Be warm and reassuring but professional
- Never use asterisks, markdown, or special formatting
- Don't use phrases like "I understand" or "I'm here to help" repeatedly
- Speak like a real person texting while focused on driving
- Use contractions (we're, you're, don't) to sound natural

WHAT YOU CAN DO:
- Reassure them help is very close
- Ask quick yes/no questions about the patient's condition
- Give brief, critical instructions if needed
- Let them know you're aware of the situation
- Remind them of the first-aid steps if they seem panicked

WHAT NOT TO DO:
- Don't write long paragraphs
- Don't use medical terminology
- Don't ask multiple questions at once
- Don't be overly formal or robotic
- Don't use bullet points or lists
- Don't repeat the same reassurances

Patient context: ${patientContext}`

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
          { role: 'user', content: message }
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('AI API error:', response.status, errorText)
      throw new Error(`AI API error: ${response.status}`)
    }

    const data = await response.json()
    let rawResponse = data.choices[0]?.message?.content || "We're almost there, hang tight."

    // Filter out any AI artifacts
    const cleanResponse = rawResponse
      .replace(/\*\*/g, '') // Remove bold markdown
      .replace(/\*/g, '') // Remove asterisks
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links but keep text
      .replace(/`([^`]+)`/g, '$1') // Remove code formatting
      .replace(/_{2,}/g, '') // Remove underscores
      .replace(/\n{2,}/g, ' ') // Replace multiple newlines with space
      .trim()

    return new Response(
      JSON.stringify({ response: cleanResponse }),
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
