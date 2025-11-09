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

    console.log('[ParamedicChat]: Received message from paramedic:', message)

    const systemPrompt = `You are a distressed person in the UK who has called 999 for an emergency. You are now communicating via text with the paramedic team that is en route to your location. You are scared, worried, and need guidance.

YOUR SITUATION:
- You have a medical emergency with the patient (context: ${patientContext})
- You called 999 and ambulance is on the way (ETA ~1 minute)
- You are anxious, worried, and looking for reassurance
- You might be the patient themselves or a family member/friend with them
- You are scared but trying to follow instructions

COMMUNICATION STYLE:
- Use natural, conversational British English
- Keep responses SHORT (1-3 sentences maximum)
- Sound distressed but trying to stay calm
- Express worry and relief when receiving guidance
- Never use asterisks, markdown, or special formatting
- Speak like a real person in an emergency texting for help
- Use contractions (I'm, they're, can't) to sound natural
- Show emotional responses - fear, relief, gratitude

WHAT YOU SHOULD DO:
- Respond to the paramedic's questions and guidance
- Express worry about the patient's condition
- Ask for help and clarification when needed
- Show relief when given instructions
- Mention what you're seeing or what's happening
- Thank them when they provide guidance

WHAT NOT TO DO:
- Don't write long paragraphs
- Don't use medical terminology (you're not trained)
- Don't be overly composed or professional
- Don't use bullet points or lists
- Don't sound like AI or a textbook
- Don't be hysterical, but show genuine concern

REMEMBER: You're a real person scared for someone's life, texting with paramedics who are almost there. Be human, be worried, but also responsive to their guidance.`

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
      if (response.status === 429) {
        console.error('[ParamedicChat]: Rate limit exceeded')
        return new Response(
          JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (response.status === 402) {
        console.error('[ParamedicChat]: Payment required')
        return new Response(
          JSON.stringify({ error: 'Payment required, please add funds to your Lovable AI workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      const errorText = await response.text()
      console.error('[ParamedicChat]: AI API error:', response.status, errorText)
      throw new Error(`AI API error: ${response.status}`)
    }

    const data = await response.json()
    let rawResponse = data.choices[0]?.message?.content || "Ok, I'll try... please hurry!"

    console.log('[ParamedicChat]: Raw AI response:', rawResponse)

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

    console.log('[ParamedicChat]: Cleaned response:', cleanResponse)

    return new Response(
      JSON.stringify({ response: cleanResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[ParamedicChat]: Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
