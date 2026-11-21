import { getStore } from "@netlify/blobs";

const OK = /^[a-z0-9_-]{3,20}$/;
const json = (o, s = 200) =>
  new Response(JSON.stringify(o), {
    status: s,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export default async (req) => {
  try {
    const store = getStore("progress");
    if (req.method === "GET") {
      const name = (new URL(req.url).searchParams.get("name") || "").trim().toLowerCase();
      if (!OK.test(name)) return json({ error: "bad name" }, 400);
      const data = await store.get("user-" + name, { type: "json" });
      return json({ data: data || {} });
    }
    if (req.method === "PUT") {
      const raw = await req.text();
      if (raw.length > 100000) return json({ error: "too large" }, 413);
      const body = JSON.parse(raw);
      const name = String(body.name || "").trim().toLowerCase();
      const data = body.data;
      if (!OK.test(name) || typeof data !== "object" || data === null || Array.isArray(data))
        return json({ error: "bad request" }, 400);
      await store.setJSON("user-" + name, data);
      return json({ ok: true });
    }
    return json({ error: "method not allowed" }, 405);
  } catch (e) {
    return json({ error: "server error" }, 500);
  }
};

export const config = { path: "/api/progress" };
