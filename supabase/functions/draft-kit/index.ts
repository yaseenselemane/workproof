// Drafts a WorkProof kit (abilities, a 45-minute test, a 4-level scoring sheet) from a job ad's duties.
// The browser falls back to its rules kit if this returns anything but a valid kit.
import Anthropic from "npm:@anthropic-ai/sdk";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["role", "abilities", "test", "rubric"],
  properties: {
    role: { type: "string" },
    abilities: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "name", "fromDuty"],
        properties: { id: { type: "string", enum: ["A", "B", "C"] }, name: { type: "string" }, fromDuty: { type: "string" } },
      },
    },
    test: {
      type: "object",
      additionalProperties: false,
      required: ["minutes", "gets", "task"],
      properties: { minutes: { type: "integer" }, gets: { type: "array", items: { type: "string" } }, task: { type: "string" } },
    },
    rubric: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["ability", "levels"],
        properties: { ability: { type: "string", enum: ["A", "B", "C"] }, levels: { type: "array", items: { type: "string" } } },
      },
    },
  },
};

const SYSTEM = `You design short work-sample tests that let an employer judge a graduate by what they can do, not by their background.

From the duties given, produce:
- abilities: one to three, ids A, B, C in order. Each is an observable ability, written as a short third-person phrase ("Reconciles a bank statement accurately"). fromDuty must be copied exactly, character for character, from one of the duties.
- test: minutes is 45. gets is an empty array; put any material the candidate needs (figures, a short scenario, a sample record) directly in the task text. The task must be doable on a phone in 45 minutes, must exercise every ability, and must have answers a scorer can check.
- rubric: one entry per ability, each with exactly four levels from weakest (score 1) to strongest (score 4). Each level describes what the scorer would see in the answer, specific enough that two scorers agree.

Never test years of experience, qualifications, school marks, transport, age, language background or anything else about who the candidate is. Plain South African English.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  if (!Deno.env.get("ANTHROPIC_API_KEY")) return json({ error: "ANTHROPIC_API_KEY is not set" }, 503);

  // Trust boundary: this endpoint is public, so cap what it will send to the model.
  let title: string, tasks: string[];
  try {
    const body = await req.json();
    title = String(body.title ?? "").slice(0, 200);
    tasks = Array.isArray(body.tasks) ? body.tasks.map((t: unknown) => String(t).slice(0, 300)).filter(Boolean).slice(0, 12) : [];
  } catch {
    return json({ error: "body must be JSON" }, 400);
  }
  if (!tasks.length) return json({ error: "no duties given" }, 400);

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
      system: SYSTEM,
      messages: [{ role: "user", content: `Role: ${title}\n\nDuties:\n${tasks.map((t) => `- ${t}`).join("\n")}` }],
    });
    if (response.stop_reason === "refusal") return json({ error: "declined" }, 502);
    const text = response.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") return json({ error: "no kit returned" }, 502);
    const kit = JSON.parse(text.text);

    // The schema can't express counts, so check them here; the browser falls back if this fails.
    const ids = kit.abilities?.map((a: { id: string }) => a.id) ?? [];
    const ok = ids.length >= 1 && ids.length <= 3 && new Set(ids).size === ids.length &&
      kit.rubric?.length === ids.length &&
      kit.rubric.every((r: { ability: string; levels: string[] }) => ids.includes(r.ability) && r.levels?.length === 4);
    if (!ok) return json({ error: "kit failed validation" }, 502);
    return json({ ...kit, test: { ...kit.test, minutes: 45, gets: [] } });
  } catch (e) {
    if (e instanceof Anthropic.APIError) return json({ error: `Claude API ${e.status}` }, 502);
    return json({ error: "drafting failed" }, 500);
  }
});
