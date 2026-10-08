// Netlify Function. The key is read from the GEMINI_API_KEY environment variable (set in Netlify settings).
export const config = { path: "/api/generate" };

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });

export default async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  let body = {};
  try { body = await req.json(); } catch (e) {}
  const t = String(body.topic || "").slice(0, 60).trim();
  if (!t) return json({ error: "Missing topic" }, 400);

  const kind = body.type === "caption" ? "caption" : "poem";
  const mood = ["funny", "romantic", "sad", "motivational"].includes(body.tone) ? body.tone : "funny";

  const prompt =
    kind === "poem"
      ? `Write a short, original ${mood} poem (4 to 8 lines, rhyming) about: "${t}". Output only the poem.`
      : `Write one catchy, original ${mood} social media caption about: "${t}". Max 20 words. Output only the caption.`;

  try {
    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    const data = await r.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) return json({ error: "No text returned" }, 502);
    return json({ text });
  } catch (e) {
    return json({ error: "Server error" }, 500);
  }
};
