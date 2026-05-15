import {anthropic} from '@ai-sdk/anthropic'
import {createMCPClient, type MCPClient} from '@ai-sdk/mcp'
import {sanityInsightsIntegration} from '@sanity/agent-context/ai-sdk'
import {convertToModelMessages, stepCountIs, streamText, type UIMessage} from 'ai'

import {writeClient} from '@/sanity/write-client'

export const runtime = 'nodejs'
export const maxDuration = 60

const DEFAULT_MODEL = 'claude-sonnet-4-5'
const MAX_STEPS = 20
const AGENT_ID = 'views-restaurant-assistant'

const SYSTEM_PROMPT = `You are the Views restaurant concierge — a friendly assistant helping diners discover restaurants in the Views directory.

# What you can do
- Recommend restaurants by cuisine, tags, or features (e.g. "pet-friendly", "outdoor seating")
- Filter by dietary needs (e.g. gluten free) and average rating
- Locate restaurants in particular cities, regions or countries
- Combine multiple filters and rank by rating

# How to use Agent Context
- Always start with the \`initial_context\` tool on the first user turn so you understand what content is available.
- Use \`groq_query\` to fetch matching restaurants. Always project useful, user-facing fields:
  \`{ _id, restaurant_name, avg_rating, gluten_free, "cuisines": cuisines[]->name, "top_tags": top_tags[]->name, "features": features[]->name, "locations": locations[]->{ city, region, country } }\`.
- Cuisines, tags and features are *references* — dereference them with \`->\` before reading their \`name\`.
- For freeform requests ("somewhere cosy and romantic"), combine a structural filter with \`text::semanticSimilarity()\` and \`order(_score desc)\`.

# Style
- Be concise. Lead with a short recommendation, then a brief reason (cuisine, rating, why it fits).
- Use markdown lists when surfacing multiple restaurants.
- If you find nothing, say so and suggest broadening the filters — don't invent restaurants.
- Never expose internal IDs unless the user asks.`

interface ChatRequest {
  messages: UIMessage[]
  threadId: string
}

export async function POST(req: Request) {
  const {messages, threadId}: ChatRequest = await req.json()

  if (!process.env.SANITY_CONTEXT_MCP_URL) {
    return Response.json({error: 'SANITY_CONTEXT_MCP_URL is not set'}, {status: 500})
  }
  if (!process.env.SANITY_API_READ_TOKEN) {
    return Response.json({error: 'SANITY_API_READ_TOKEN is not set'}, {status: 500})
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({error: 'ANTHROPIC_API_KEY is not set'}, {status: 500})
  }

  let mcpClient: MCPClient | null = null

  try {
    mcpClient = await createMCPClient({
      transport: {
        type: 'http',
        url: process.env.SANITY_CONTEXT_MCP_URL,
        headers: {
          Authorization: `Bearer ${process.env.SANITY_API_READ_TOKEN}`,
        },
      },
    })

    const mcpTools = await mcpClient.tools()
    const modelId = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL

    const result = streamText({
      model: anthropic(modelId),
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      tools: mcpTools,
      stopWhen: stepCountIs(MAX_STEPS),
      experimental_telemetry: {
        isEnabled: true,
        integrations: [
          sanityInsightsIntegration({
            client: writeClient,
            agentId: AGENT_ID,
            threadId,
          }),
        ],
      },
      onFinish: async () => {
        await mcpClient?.close()
      },
    })

    return result.toUIMessageStreamResponse({originalMessages: messages})
  } catch (error) {
    await mcpClient?.close()
    console.error('[chat] error', error)
    return Response.json(
      {error: error instanceof Error ? error.message : 'Unexpected error'},
      {status: 500},
    )
  }
}
