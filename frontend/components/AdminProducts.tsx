"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { getApiUrl } from "../lib/api";
import type { AffiliateProduct } from "./ProductCard";

type Props = {
  token: string;
};

type ProductForm = {
  name: string;
  affiliate_url: string;
  price: string;
  size: string;
  color: string;
  image: string;
  description: string;
  coupon: string;
  validity_days: string; // "30" | "0" | custom
  never_expires: boolean;
  post_id: string;
  status: "active" | "inactive";
};

type PostOption = { id: number; title: string };

const emptyForm: ProductForm = {
  name: "",
  affiliate_url: "",
  price: "",
  size: "",
  color: "",
  image: "",
  description: "",
  coupon: "",
  validity_days: "30",
  never_expires: false,
  post_id: "",
  status: "active",
};

export function AdminProducts({ token }: Props) {
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [posts, setPosts] = useState<PostOption[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const imageFileRef = useRef<HTMLInputElement | null>(null);

  const loadProducts = useCallback(async () => {
    const res = await fetch(`${getApiUrl()}/products?status_filter=all&include_expired=true&limit=100`);
    if (!res.ok) return;
    setProducts(await res.json());
  }, []);

  const loadPosts = useCallback(async () => {
    const res = await fetch(`${getApiUrl()}/posts?limit=100&status_filter=all`);
    if (!res.ok) return;
    const data = await res.json();
    setPosts(data.map((p: any) => ({ id: p.id, title: p.title })));
  }, []);

  useEffect(() => {
    void loadProducts();
    void loadPosts();
  }, [loadProducts, loadPosts]);

  function updateField<K extends keyof ProductForm>(key: K, value: ProductForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handlePreview() {
    if (!form.affiliate_url.trim()) {
      setMessage("Cole o link afiliado primeiro.");
      return;
    }
    setPreviewLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${getApiUrl()}/products/preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: form.affiliate_url.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.detail || `Falha ao ler o link (HTTP ${res.status})`);
      }
      setForm((prev) => ({
        ...prev,
        name: data.name || prev.name,
        price: data.price || prev.price,
        image: data.image || prev.image,
        description: data.description || prev.description,
        affiliate_url: data.affiliate_url || prev.affiliate_url,
      }));
      setMessage(data.note || "Dados preenchidos a partir do link. Você pode editar antes de salvar.");
    } catch (err: any) {
      setMessage(err.message || "Erro ao buscar metadados.");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.affiliate_url.trim()) {
      setMessage("Nome e link afiliado são obrigatórios.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const validity_days = form.never_expires ? 0 : Math.max(0, parseInt(form.validity_days || "30", 10) || 0);
      const payload = {
        name: form.name.trim(),
        affiliate_url: form.affiliate_url.trim(),
        price: form.price.trim() || null,
        size: form.size.trim() || null,
        color: form.color.trim() || null,
        image: form.image.trim() || null,
        description: form.description.trim() || null,
        coupon: form.coupon.trim() || null,
        validity_days,
        post_id: form.post_id ? Number(form.post_id) : null,
        status: form.status,
      };
      const url = editingId ? `${getApiUrl()}/products/${editingId}` : `${getApiUrl()}/products`;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.detail || `Erro ao salvar (HTTP ${res.status})`);
      }
      setMessage(editingId ? "Produto atualizado." : "Produto cadastrado.");
      setForm(emptyForm);
      setEditingId(null);
      await loadProducts();
    } catch (err: any) {
      setMessage(err.message || "Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(p: AffiliateProduct) {
    setEditingId(p.id);
    setForm({
      name: p.name || "",
      affiliate_url: p.affiliate_url || "",
      price: p.price || "",
      size: p.size || "",
      color: p.color || "",
      image: p.image || "",
      description: p.description || "",
      coupon: p.coupon || "",
      validity_days: String(p.validity_days ?? 30),
      never_expires: (p.validity_days ?? 30) <= 0,
      post_id: p.post_id ? String(p.post_id) : "",
      status: (p.status as "active" | "inactive") || "active",
    });
    setMessage(`Editando: ${p.name}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Apagar este produto?")) return;
    try {
      const res = await fetch(`${getApiUrl()}/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || "Erro ao apagar");
      }
      setMessage("Produto apagado.");
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
      }
      await loadProducts();
    } catch (err: any) {
      setMessage(err.message);
    }
  }

  function onImageFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") updateField("image", reader.result);
    };
    reader.readAsDataURL(file);
  }

  function formatExpiry(p: AffiliateProduct) {
    if ((p.validity_days ?? 0) <= 0 || !p.expires_at) return "Não expira";
    return `Expira ${new Date(p.expires_at).toLocaleDateString("pt-BR")}`;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="bg-card border border-border rounded-xl p-6 space-y-4 text-foreground">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{editingId ? "Editar produto" : "Novo produto afiliado"}</h2>
            <p className="text-sm text-muted">Cole o link (ex.: meli.la), busque os dados e ajuste o que quiser.</p>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
                setMessage(null);
              }}
              className="text-sm text-muted hover:text-foreground"
            >
              Cancelar
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="grid gap-3">
          <label className="grid gap-1">
            <span className="text-sm text-muted">Link afiliado</span>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-card border border-border rounded px-3 py-2"
                placeholder="https://meli.la/2k3f1fF"
                value={form.affiliate_url}
                onChange={(e) => updateField("affiliate_url", e.target.value)}
              />
              <button
                type="button"
                onClick={handlePreview}
                disabled={previewLoading}
                className="rounded px-3 py-2 text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-60 whitespace-nowrap"
              >
                {previewLoading ? "Buscando..." : "Preencher"}
              </button>
            </div>
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-muted">Nome</span>
            <input
              className="bg-card border border-border rounded px-3 py-2"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1">
              <span className="text-sm text-muted">Preço</span>
              <input
                className="bg-card border border-border rounded px-3 py-2"
                placeholder="R$ 199,90"
                value={form.price}
                onChange={(e) => updateField("price", e.target.value)}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm text-muted">Tamanho</span>
              <input
                className="bg-card border border-border rounded px-3 py-2"
                value={form.size}
                onChange={(e) => updateField("size", e.target.value)}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm text-muted">Cor</span>
              <input
                className="bg-card border border-border rounded px-3 py-2"
                value={form.color}
                onChange={(e) => updateField("color", e.target.value)}
              />
            </label>
          </div>

          <label className="grid gap-1">
            <span className="text-sm text-muted">Foto (URL ou upload)</span>
            <input
              className="bg-card border border-border rounded px-3 py-2"
              value={form.image}
              onChange={(e) => updateField("image", e.target.value)}
              placeholder="https://..."
            />
            <input
              ref={imageFileRef}
              type="file"
              accept="image/*"
              className="text-sm text-muted"
              onChange={(e) => onImageFile(e.target.files?.[0] || null)}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-muted">Descrição</span>
            <textarea
              className="bg-card border border-border rounded px-3 py-2 min-h-[80px]"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-muted">Cupom de desconto</span>
            <input
              className="bg-card border border-border rounded px-3 py-2"
              placeholder="NERTEUS10"
              value={form.coupon}
              onChange={(e) => updateField("coupon", e.target.value)}
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-sm text-muted">Validade (dias)</span>
              <input
                type="number"
                min={0}
                className="bg-card border border-border rounded px-3 py-2 disabled:opacity-50"
                value={form.validity_days}
                disabled={form.never_expires}
                onChange={(e) => updateField("validity_days", e.target.value)}
              />
              <span className="text-[11px] text-muted">Padrão: 30 dias. Depois some da loja.</span>
            </label>
            <label className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                checked={form.never_expires}
                onChange={(e) => updateField("never_expires", e.target.checked)}
              />
              <span className="text-sm">Não expira nunca (livros / itens eternos)</span>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-sm text-muted">Vincular a um post</span>
              <select
                className="bg-card border border-border rounded px-3 py-2"
                value={form.post_id}
                onChange={(e) => updateField("post_id", e.target.value)}
              >
                <option value="">Nenhum</option>
                {posts.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.id} — {p.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-sm text-muted">Status</span>
              <select
                className="bg-card border border-border rounded px-3 py-2"
                value={form.status}
                onChange={(e) => updateField("status", e.target.value as "active" | "inactive")}
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded px-4 py-2 font-semibold"
          >
            {loading ? "Salvando..." : editingId ? "Atualizar produto" : "Cadastrar produto"}
          </button>
          {message && <p className="text-sm text-muted">{message}</p>}
        </form>
      </section>

      <section className="bg-card border border-border rounded-xl p-6 space-y-4 text-foreground">
        <h2 className="text-xl font-semibold">Produtos cadastrados</h2>
        {!products.length && <p className="text-sm text-muted">Nenhum produto ainda.</p>}
        <ul className="space-y-3 max-h-[70vh] overflow-y-auto">
          {products.map((p) => (
            <li key={p.id} className="border border-border rounded-lg p-3 flex gap-3">
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-border/40">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm line-clamp-1">{p.name}</p>
                <p className="text-xs text-muted">
                  {p.price || "Sem preço"} · {formatExpiry(p)}
                  {p.coupon ? ` · Cupom ${p.coupon}` : ""}
                </p>
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => startEdit(p)} className="text-xs text-primary hover:underline">
                    Editar
                  </button>
                  <button type="button" onClick={() => handleDelete(p.id)} className="text-xs text-red-400 hover:underline">
                    Apagar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
