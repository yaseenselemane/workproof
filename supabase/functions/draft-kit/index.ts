// Drafts a WorkProof kit (abilities, a 45-minute test, a 4-level scoring sheet) from a job ad's duties.
// The browser falls back to its rules kit if this returns anything but a valid kit.
// Uses Groq's free tier (OpenAI-compatible API) with a strict JSON schema.
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

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
  const key = Deno.env.get("GROQ_API_KEY");
  if (!key) return json({ error: "GROQ_API_KEY is not set" }, 503);

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

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_completion_tokens: 8192,
        response_format: { type: "json_schema", json_schema: { name: "kit", strict: true, schema: SCHEMA } },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Role: ${title}\n\nDuties:\n${tasks.map((t) => `- ${t}`).join("\n")}` },
        ],
      }),
      signal: AbortSignal.timeout(40_000),
    });
    if (!res.ok) return json({ error: `Groq API ${res.status}` }, 502);
    const message = (await res.json()).choices?.[0]?.message;
    if (message?.refusal) return json({ error: "declined" }, 502);
    if (!message?.content) return json({ error: "no kit returned" }, 502);
    const kit = JSON.parse(message.content);

    // The schema can't express counts, so check them here; the browser falls back if this fails.
    const ids = kit.abilities?.map((a: { id: string }) => a.id) ?? [];
    const ok = ids.length >= 1 && ids.length <= 3 && new Set(ids).size === ids.length &&
      kit.rubric?.length === ids.length &&
      kit.rubric.every((r: { ability: string; levels: string[] }) => ids.includes(r.ability) && r.levels?.length === 4);
    if (!ok) return json({ error: "kit failed validation" }, 502);
    return json({ ...kit, test: { ...kit.test, minutes: 45, gets: [] } });
  } catch {
    return json({ error: "drafting failed" }, 500);
  }
});
