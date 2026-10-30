import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getApiCandidates(): string[] {
  const configured = process.env.API_URL_INTERNAL?.replace(/\/$/, "");
  const candidates = [
    configured,
    "http://127.0.0.1:8000",
    "http://localhost:8000",
    "http://api:8000",
  ].filter(Boolean) as string[];

  return [...new Set(candidates)];
}

async function forwardLogin(password: string) {
  let lastError = "Não foi possível conectar à API.";

  for (const base of getApiCandidates()) {
    try {
      const res = await fetch(`${base}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
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
  const payload = await req.json().catch(() => null);
  if (!payload?.password) {
    return NextResponse.json({ detail: "Senha é obrigatória." }, { status: 400 });
  }
  return forwardLogin(String(payload.password));
}
