import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getApiCandidates(): string[] {
  const configured = process.env.API_URL_INTERNAL?.replace(/\/$/, "");
  const candidates = [
    configured,
    "http://host.docker.internal:8000",
    "http://api:8000",
    "http://nerteus-api:8000",
  ].filter(Boolean) as string[];

  return [...new Set(candidates)];
}

async function forwardAuthToken(body: URLSearchParams) {
  let lastError = "Não foi possível conectar à API.";

  for (const base of getApiCandidates()) {
    try {
      const res = await fetch(`${base}/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(data, { status: res.status });
    } catch (err: any) {
      lastError = err?.message || lastError;
    }
  }

  return NextResponse.json({ detail: lastError }, { status: 502 });
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const payload = await req.json().catch(() => null);
    if (!payload?.email || !payload?.password) {
      return NextResponse.json({ detail: "Email e senha são obrigatórios." }, { status: 400 });
    }
    const body = new URLSearchParams();
    body.append("username", String(payload.email));
    body.append("password", String(payload.password));
    return forwardAuthToken(body);
  }

  const raw = await req.text();
  const body = new URLSearchParams(raw);
  if (!body.get("username") || !body.get("password")) {
    return NextResponse.json({ detail: "Email e senha são obrigatórios." }, { status: 400 });
  }
  return forwardAuthToken(body);
}
