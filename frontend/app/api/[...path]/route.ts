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

async function proxy(req: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join("/");
  const query = req.nextUrl.search;
  let lastError = "Não foi possível conectar à API.";

  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const authorization = req.headers.get("authorization");
  if (authorization) headers.set("authorization", authorization);

  let body: ArrayBuffer | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.arrayBuffer();
  }

  for (const base of getApiCandidates()) {
    try {
      const target = `${base}/${path}${query}`;
      const res = await fetch(target, {
        method: req.method,
        headers,
        body,
      });

      const responseHeaders = new Headers();
      const resContentType = res.headers.get("content-type");
      if (resContentType) responseHeaders.set("content-type", resContentType);

      return new NextResponse(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
      });
    } catch (err: any) {
      lastError = err?.message || lastError;
    }
  }

  return NextResponse.json({ detail: lastError }, { status: 502 });
}

type RouteContext = { params: { path: string[] } };

export async function GET(req: NextRequest, { params }: RouteContext) {
  return proxy(req, params.path);
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  return proxy(req, params.path);
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  return proxy(req, params.path);
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  return proxy(req, params.path);
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  return proxy(req, params.path);
}
