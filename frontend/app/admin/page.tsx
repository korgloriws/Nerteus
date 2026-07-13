"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { ReactQuillProps } from "react-quill";
import React, { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getApiUrl } from "../../lib/api";
import { ThemeToggle } from "../../components/ThemeToggle";

const ReactQuill: any = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";

function CustomToolbar() {
  return (
    <div id="post-editor-toolbar" className="flex flex-wrap items-center gap-2 border border-[#1f2430] rounded-t px-2 py-2 bg-[#0f1115]">
      <select className="ql-header" defaultValue="" aria-label="Cabeçalho">
        <option value="1" />
        <option value="2" />
        <option value="3" />
        <option value="" />
      </select>
      <select className="ql-size" defaultValue="" aria-label="Tamanho da fonte">
        <option value="small" />
        <option value="" />
        <option value="large" />
        <option value="huge" />
      </select>
      <select className="ql-color" aria-label="Cor do texto" />
      <select className="ql-background" aria-label="Cor de fundo do texto" />
      <button className="ql-bold" aria-label="Negrito" />
      <button className="ql-italic" aria-label="Itálico" />
      <button className="ql-underline" aria-label="Sublinhado" />
      <button className="ql-strike" aria-label="Tachado" />
      <button className="ql-blockquote" aria-label="Citação" />
      <button className="ql-link" aria-label="Link" />
      <button className="ql-list" value="ordered" aria-label="Lista ordenada" />
      <button className="ql-list" value="bullet" aria-label="Lista não ordenada" />
      <button className="ql-clean" aria-label="Limpar formatação" />
    </div>
  );
}

type PostInput = {
  title: string;
  slug: string;
  summary: string;
  content: string;
  tags: string;
  hero_image?: string;
  status: "published" | "draft";
  weekday: string;
  day_theme: string;
};

type PostListItem = {
  id: number;
  title: string;
  slug: string;
  summary?: string | null;
  content: string;
  tags: string[];
  hero_image?: string | null;
  status?: "published" | "draft";
};

const emptyPost: PostInput = {
  title: "",
  slug: "",
  summary: "",
  content: "",
  tags: "",
  hero_image: "",
  status: "published",
  weekday: "",
  day_theme: "",
};

export default function AdminPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [token, setToken] = useState<string | null>(null);
  const [post, setPost] = useState<PostInput>(emptyPost);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 15;
  const [hasNext, setHasNext] = useState(false);
  const [view, setView] = useState<"editor" | "lista">("editor");
  const [listStatus, setListStatus] = useState<"all" | "published" | "draft">("all");
  const quillRef = useRef<any>(null); // ReactQuill component
  const heroFileRef = useRef<HTMLInputElement | null>(null);
  const [dirty, setDirty] = useState(false);

  const setPostAndDirty = useCallback((updater: (prev: PostInput) => PostInput) => {
    setPost((prev) => updater(prev));
    setDirty(true);
  }, []);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);
      const res = await fetch(`${getApiUrl()}/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || "Falha ao autenticar");
      }
      setToken(data.access_token);
      setMessage("Login ok. Token carregado.");
    } catch (err: any) {
      setMessage(err?.message || "Não foi possível conectar à API. Verifique se a API está online.");
    }
  }

  function handleLogout() {
    setToken(null);
    setMessage(null);
    router.push("/");
  }

  const quillFormats = useMemo(
    () => [
      "header",
      "size",
      "color",
      "background",
      "bold",
      "italic",
      "underline",
      "strike",
      "blockquote",
      "list",
      "bullet",
      "link",
      "image",
    ],
    []
  );

  async function loadPosts(targetPage = page, statusFilter = listStatus) {
    try {
      const offset = targetPage * pageSize;
      const res = await fetch(
        `${getApiUrl()}/posts?limit=${pageSize + 1}&offset=${offset}&order_by=-created_at&status_filter=${statusFilter}`
      );
      if (!res.ok) return;
      const data = (await res.json()) as PostListItem[];
      setHasNext(data.length > pageSize);
      setPosts(data.slice(0, pageSize));
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    void loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, listStatus]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const handleHeroFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setPostAndDirty((prev) => ({ ...prev, hero_image: base64 }));
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [setPostAndDirty]
  );

  const quillModules = useMemo(
    () => ({
      toolbar: {
        container: "#post-editor-toolbar",
      },
    }),
    []
  );

  // Permite colar imagens (clipboard) direto no editor
  useEffect(() => {
    const editor = quillRef.current;
    if (!editor || !editor.root) return;

    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = Array.from(e.clipboardData.items);
      const imageItem = items.find((it) => it.type.startsWith("image/"));
      if (!imageItem) return;
      const file = imageItem.getAsFile();
      if (!file) return;
      e.preventDefault();
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const range = editor.getSelection(true);
        const index = range ? range.index : editor.getLength();
        editor.insertEmbed(index, "image", base64, "user");
        editor.setSelection(index + 1);
      };
      reader.readAsDataURL(file);
    };

    editor.root.addEventListener("paste", handlePaste);
    return () => {
      editor.root.removeEventListener("paste", handlePaste);
    };
  }, [quillRef]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!token) {
      setMessage("Faça login para criar posts.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const payload = {
        title: post.title,
        slug: post.slug,
        summary: post.summary,
        content: post.content,
        tags: post.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        hero_image: post.hero_image || null,
        status: post.status,
        weekday: post.weekday || null,
        day_theme: post.day_theme || null,
      };
      const url = editingId ? `${getApiUrl()}/posts/${editingId}` : `${getApiUrl()}/posts`;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Erro ao criar post");
      }
      setMessage(editingId ? `Post atualizado: ${data.title}` : `Post criado: ${data.title}`);
      setPost(emptyPost);
      setDirty(false);
      setEditingId(null);
      setPage(0);
      void loadPosts(0);
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(item: PostListItem) {
    setEditingId(item.id);
    setPost({
      title: item.title,
      slug: item.slug,
      summary: item.summary || "",
      content: item.content,
      tags: item.tags.join(", "),
      hero_image: item.hero_image || "",
      status: (item as any).status ?? "published",
      weekday: (item as any).weekday ?? "",
      day_theme: (item as any).day_theme ?? "",
    });
    setDirty(false);
    setMessage(`Editando: ${item.title}`);
  }

  async function handleDelete(id: number) {
    if (!token) {
      setMessage("Faça login para deletar posts.");
      return;
    }
    const confirmed = window.confirm("Apagar este post? Esta ação não pode ser desfeita.");
    if (!confirmed) return;
    try {
      const res = await fetch(`${getApiUrl()}/posts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const detail = await res.text();
        throw new Error(detail || "Erro ao apagar");
      }
      setMessage("Post apagado.");
      // Se remover o último da página, retrocede uma página se necessário
      if (posts.length === 1 && page > 0) {
        setPage((p) => Math.max(0, p - 1));
        await loadPosts(Math.max(0, page - 1), listStatus);
      } else {
        await loadPosts(page, listStatus);
      }
    } catch (err: any) {
      setMessage(err.message);
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setPost(emptyPost);
    setMessage(null);
    setDirty(false);
  }

  function newPost() {
    setEditingId(null);
    setPost(emptyPost);
    setMessage("Pronto para um novo post.");
    setView("editor");
    setDirty(false);
  }

  const weekdayOptions = [
    { value: "mon", label: "Segunda · Tech", theme: "tech" },
    { value: "tue", label: "Terça · Otaku", theme: "otaku" },
    { value: "wed", label: "Quarta · Games", theme: "games" },
    { value: "thu", label: "Quinta · Pop", theme: "pop" },
    { value: "fri", label: "Sexta · Básica", theme: "basica" },
  ];

  return (
    <main className="space-y-8 admin-surface">
      {!token && (
        <section className="bg-card border border-border rounded-xl p-6 space-y-4 text-foreground">
          <h1 className="text-2xl font-semibold">Área do editor</h1>
          <form onSubmit={handleLogin} className="grid gap-3 max-w-md">
            <label className="grid gap-1">
              <span className="text-sm text-muted">Email</span>
              <input
                className="bg-card border border-border rounded px-3 py-2 text-foreground"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm text-muted">Senha</span>
              <input
                type="password"
                className="bg-card border border-border rounded px-3 py-2 text-foreground"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded px-4 py-2 font-semibold"
            >
              Entrar
            </button>
            {token && <p className="text-sm text-green-400">Token carregado.</p>}
          </form>
        </section>
      )}

      {token && (
        <>
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setView("editor")}
                className={`rounded px-4 py-2 text-sm font-semibold ${
                  view === "editor" ? "bg-indigo-600 text-white" : "bg-border text-foreground hover:bg-border/80"
                }`}
              >
                Editor
              </button>
              <button
                type="button"
                onClick={() => {
                  setView("lista");
                  void loadPosts(page);
                }}
                className={`rounded px-4 py-2 text-sm font-semibold ${
                  view === "lista" ? "bg-indigo-600 text-white" : "bg-border text-foreground hover:bg-border/80"
                }`}
              >
                Lista
              </button>
              <button
                type="button"
                onClick={newPost}
                className="rounded px-4 py-2 text-sm font-semibold bg-border text-foreground hover:bg-border/80"
              >
                Novo
              </button>
            </div>
            <ThemeToggle />
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm text-indigo-300 hover:text-white"
            >
              Sair
            </button>
          </div>

          {view === "editor" && (
            <section className="force-card rounded-xl p-6 space-y-4 text-foreground">
              <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
                <form onSubmit={handleSave} className="grid gap-3 force-card rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{editingId ? "Editar post" : "Criar novo post"}</h2>
                    <span className="text-xs text-muted">Campos rápidos</span>
                  </div>
                  <div className="grid gap-1">
                    <label className="text-sm text-muted" htmlFor="title">
                      Título
                    </label>
                    <input
                      id="title"
                      className="bg-card border border-border rounded px-3 py-2 text-foreground"
                      value={post.title}
                    onChange={(e) => setPostAndDirty((prev) => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-sm text-muted" htmlFor="slug">
                      Slug
                    </label>
                    <input
                      id="slug"
                      className="bg-card border border-border rounded px-3 py-2 text-foreground"
                      value={post.slug}
                    onChange={(e) => setPostAndDirty((prev) => ({ ...prev, slug: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-sm text-muted" htmlFor="summary">
                      Resumo
                    </label>
                    <input
                      id="summary"
                      className="bg-card border border-border rounded px-3 py-2 text-foreground"
                      value={post.summary}
                    onChange={(e) => setPostAndDirty((prev) => ({ ...prev, summary: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-sm text-muted" htmlFor="tags">
                      Tags (separadas por vírgula)
                    </label>
                    <input
                      id="tags"
                      className="bg-card border border-border rounded px-3 py-2 text-foreground"
                      value={post.tags}
                    onChange={(e) => setPostAndDirty((prev) => ({ ...prev, tags: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-sm text-muted" htmlFor="hero_image">
                      URL da imagem (opcional)
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="hero_image"
                        className="flex-1 bg-card border border-border rounded px-3 py-2 text-foreground"
                        value={post.hero_image}
                        onChange={(e) => setPostAndDirty((prev) => ({ ...prev, hero_image: e.target.value }))}
                        placeholder="Cole a URL da capa"
                      />
                      <input
                        ref={heroFileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleHeroFileChange}
                        title="Selecionar imagem do dispositivo"
                        aria-label="Selecionar imagem do dispositivo"
                      />
                      <button
                        type="button"
                        className="bg-border text-foreground hover:bg-border/80 rounded px-3 py-2 text-sm"
                        onClick={() => heroFileRef.current?.click()}
                        title="Enviar imagem do dispositivo"
                        aria-label="Enviar imagem do dispositivo"
                      >
                        Upload
                      </button>
                    </div>
                  </div>
              <div className="grid gap-1">
                    <label className="text-sm text-muted" htmlFor="weekday">
                  Dia / Tema do dia
                </label>
                <select
                  id="weekday"
                      className="bg-card border border-border rounded px-3 py-2 text-foreground"
                  value={post.weekday}
                  onChange={(e) => {
                    const selected = weekdayOptions.find((opt) => opt.value === e.target.value);
                      setPostAndDirty((prev) => ({
                        ...prev,
                        weekday: e.target.value,
                        day_theme: selected?.theme ?? "",
                      }));
                  }}
                >
                  <option value="">Selecione</option>
                  {weekdayOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
                  <div className="grid gap-1">
                    <label className="text-sm text-muted" htmlFor="status">
                      Status
                    </label>
                    <select
                      id="status"
                      className="bg-card border border-border rounded px-3 py-2 text-foreground"
                      value={post.status}
                    onChange={(e) => setPostAndDirty((prev) => ({ ...prev, status: e.target.value as "published" | "draft" }))}
                    >
                      <option value="published">Publicado</option>
                      <option value="draft">Rascunho</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white rounded px-4 py-2 font-semibold"
                  >
                    {loading ? "Salvando..." : editingId ? "Atualizar" : "Publicar"}
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={(e) => {
                      e.preventDefault();
                      setPost(emptyPost);
                      setEditingId(null);
                      setDirty(false);
                      setMessage("Formulário limpo.");
                    }}
                    className="bg-border text-foreground hover:bg-border/80 disabled:opacity-60 rounded px-4 py-2 font-semibold"
                  >
                    Limpar
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={(e) => {
                      e.preventDefault();
                      setPost((prev) => ({ ...prev, status: "draft" }));
                      void handleSave(e as unknown as FormEvent);
                    }}
                    className="bg-[#1f2430] hover:bg-[#272d3a] disabled:opacity-60 text-white rounded px-4 py-2 font-semibold"
                  >
                    Salvar como rascunho
                  </button>
                  {message && <p className="text-sm text-yellow-300">{message}</p>}
                </form>

                <div className="force-card rounded-xl p-3 min-h-[420px]">
                  <label className="text-sm text-muted" htmlFor="content">
                    Conteúdo
                  </label>
                  <div className="mt-2 force-card rounded">
                    <CustomToolbar />
                    <ReactQuill
                      ref={(instance: any) => {
                        if (instance?.getEditor) {
                          quillRef.current = instance.getEditor();
                        }
                      }}
                      theme="snow"
                      value={post.content}
                      onChange={(value: string) => {
                        setPostAndDirty((prev) => ({ ...prev, content: value }));
                      }}
                      modules={quillModules}
                      formats={quillFormats}
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {view === "lista" && (
            <section className="force-card rounded-xl p-6 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold">Posts existentes</h2>
                <div className="flex items-center gap-2">
                  {(["all", "published", "draft"] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setListStatus(opt);
                        setPage(0);
                      }}
                      className={`rounded px-3 py-1 text-sm font-semibold ${
                        listStatus === opt ? "bg-indigo-600 text-white" : "bg-border text-foreground hover:bg-border/80"
                      }`}
                    >
                      {opt === "all" ? "Todos" : opt === "published" ? "Publicados" : "Rascunhos"}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => void loadPosts(page, listStatus)}
                    className="text-sm text-indigo-300 hover:text-white"
                  >
                    Atualizar lista
                  </button>
                </div>
              </div>
              <div className="grid gap-3">
                {posts.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded border px-3 py-2 force-card"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{p.title}</p>
                      <p className="text-xs text-muted">/{p.slug}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          startEdit(p);
                          setView("editor");
                        }}
                        className="text-sm rounded bg-indigo-600 px-3 py-1 text-white hover:bg-indigo-500"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="text-sm rounded bg-red-700 px-3 py-1 text-white hover:bg-red-600"
                      >
                        Apagar
                      </button>
                    </div>
                  </div>
                ))}
                {posts.length === 0 && <p className="text-sm text-[#c1c5d0]">Nenhum post ainda.</p>}
              </div>
              <div className="flex items-center justify-between text-sm text-[#c1c5d0]">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded border border-[#1f2430] px-3 py-1 disabled:opacity-50 hover:border-indigo-500 hover:text-white"
                >
                  Anterior
                </button>
                <span>Página {page + 1}</span>
                <button
                  type="button"
                  onClick={() => hasNext && setPage((p) => p + 1)}
                  disabled={!hasNext}
                  className="rounded border border-[#1f2430] px-3 py-1 disabled:opacity-50 hover:border-indigo-500 hover:text-white"
                >
                  Próxima
                </button>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}

