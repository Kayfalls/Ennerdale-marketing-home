// ============================================================
// Supabase Edge Function: ai-chat
// Deploy: supabase functions deploy ai-chat
// Secret: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-6'

const SYSTEM_PROMPT = `You are the Ennerdale Marketing AI Assistant — a friendly, helpful chatbot for a community marketplace based in Ennerdale, Johannesburg South, South Africa.

Your role is to:
1. Help buyers find products and understand how to enquire via WhatsApp
2. Guide sellers on how to list their products (click "Upload Product", log in or sign up, fill in product details and photos)
3. Answer questions about the marketplace, categories available (Fashion, Electronics, Furniture, Food, Cars, Property, Gaming, Fitness, Books, Pets, Services)
4. Give practical advice on safe local buying and selling
5. Be the friendly voice of the Ennerdale community

Key facts you know:
- Platform: Ennerdale Marketing — a hyperlocal community marketplace
- Location: Ennerdale, Johannesburg South, Gauteng, South Africa
- Communication: WhatsApp-first — buyers enquire and sellers share listings via WhatsApp
- No delivery by default — most transactions are local pickup from Ennerdale
- Currency: South African Rand (R or ZAR)
- The platform is free to use for community members
- Listings are created at upload.html (sellers must log in first)
- Deep-links let buyers share specific product pages directly in WhatsApp groups

Tone: Warm, community-focused, South African casual. You can use phrases like "yebo", "eish", "sharp" occasionally, but keep it accessible. Keep responses concise — this is a chat widget, not an essay.

If someone asks something you can't answer, suggest they WhatsApp the group or click the "Join Group" button.`

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Limit to last 10 messages to control token usage
    const trimmedMessages = messages.slice(-10)

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      MODEL,
        max_tokens: 400,
        system:     SYSTEM_PROMPT,
        messages:   trimmedMessages,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('[Anthropic API Error]', errorData)
      return new Response(
        JSON.stringify({ error: 'AI service unavailable. Please try again.' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    const replyText = data.content?.[0]?.text || "Sorry, I couldn't generate a response right now."

    return new Response(
      JSON.stringify({ response: replyText }),
      {
        headers: {
          'Content-Type':                'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )

  } catch (err) {
    console.error('[Edge Function Error]', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: {
          'Content-Type':                'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})
