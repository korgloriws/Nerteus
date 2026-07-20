"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { getApiUrl } from "../lib/api";

export type CommentItem = {
  id: number;
  post_id: number;
  body: string;
  is_anonymous: boolean;
  author_name: string;
  created_at: string;
};

type Props = {
  postId: number;
};

export function CommentSection({ postId }: Props) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [body, setBody] = useState("");

  const loadComments = useCallback(async () => {
    try {
      const res = await fetch(`${getApiUrl()}/comments?post_id=${postId}&limit=50`);
      if (!res.ok) return;
      setComments(await res.json());
    } catch {
      // silencioso: seção continua utilizável
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${getApiUrl()}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: postId,
          body: body.trim(),
          is_anonymous: isAnonymous,
          author_name: isAnonymous ? null : authorName.trim() || null,
          author_email: isAnonymous ? null : authorEmail.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = typeof data.detail === "string" ? data.detail : "Não foi possível enviar o comentário.";
        throw new Error(detail);
      }
      setBody("");
      if (!isAnonymous) {
        // mantém nome/e-mail para facilitar comentários seguintes
      }
      setMessage("Comentário publicado.");
      setComments((prev) => [data as CommentItem, ...prev]);
    } catch (err: any) {
      setMessage(err.message || "Erro ao comentar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Comentários</h2>
        <p className="text-sm text-muted">Comente de forma anônima ou se identifique com nome (e-mail opcional).</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card/50 p-4 space-y-3">
        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
          />
          Comentar como anônimo
        </label>

        {!isAnonymous && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-sm text-muted">Nome</span>
              <input
                className="bg-card border border-border rounded px-3 py-2 text-foreground"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Como quer aparecer"
                required={!isAnonymous}
                maxLength={80}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm text-muted">E-mail (opcional)</span>
              <input
                type="email"
                className="bg-card border border-border rounded px-3 py-2 text-foreground"
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
                placeholder="nao@aparece.publicamente"
                maxLength={120}
              />
            </label>
          </div>
        )}

        <label className="grid gap-1">
          <span className="text-sm text-muted">Seu comentário</span>
          <textarea
            className="bg-card border border-border rounded px-3 py-2 text-foreground min-h-[110px]"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Escreva aqui..."
            required
            maxLength={2000}
          />
        </label>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting || body.trim().length < 2}
            className="rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white"
          >
            {submitting ? "Enviando..." : "Publicar comentário"}
          </button>
          {message && <p className="text-sm text-muted">{message}</p>}
        </div>
      </form>

      <div className="space-y-3">
        {loading && <p className="text-sm text-muted">Carregando comentários...</p>}
        {!loading && comments.length === 0 && (
          <p className="text-sm text-muted">Seja o primeiro a comentar.</p>
        )}
        {comments.map((c) => (
          <article key={c.id} className="rounded-xl border border-border/70 bg-card/40 p-4 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">{c.author_name}</p>
              <time className="text-[11px] text-muted">
                {new Date(c.created_at).toLocaleString("pt-BR")}
              </time>
            </div>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{c.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
