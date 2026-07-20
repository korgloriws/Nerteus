"use client";

import { useEffect, useState } from "react";

export type UiLang = "pt" | "en" | "es";

export function readUiLang(): UiLang {
  if (typeof document === "undefined") return "pt";
  const match = document.cookie.match(/(?:^|;\s*)googtrans=\/[^/]+\/([^;]+)/);
  const code = match?.[1];
  if (code === "en" || code === "es") return code;
  return "pt";
}

export function useUiLang(): UiLang {
  const [lang, setLang] = useState<UiLang>("pt");
  useEffect(() => {
    setLang(readUiLang());
  }, []);
  return lang;
}

const themeCopy = {
  pt: { light: "Claro", dark: "Escuro", aria: "Alternar tema" },
  en: { light: "Light", dark: "Dark", aria: "Toggle theme" },
  es: { light: "Claro", dark: "Oscuro", aria: "Cambiar tema" },
} as const;

export function themeLabels(lang: UiLang) {
  return themeCopy[lang];
}

const commentCopy = {
  pt: {
    title: "Comentários",
    subtitle: "Comente de forma anônima ou se identifique com nome (e-mail opcional).",
    anonymous: "Comentar como anônimo",
    name: "Nome",
    namePlaceholder: "Como quer aparecer",
    email: "E-mail (opcional)",
    emailPlaceholder: "nao@aparece.publicamente",
    body: "Seu comentário",
    bodyPlaceholder: "Escreva aqui...",
    submit: "Publicar comentário",
    submitting: "Enviando...",
    published: "Comentário publicado.",
    sendError: "Não foi possível enviar o comentário.",
    genericError: "Erro ao comentar.",
    loading: "Carregando comentários...",
    empty: "Seja o primeiro a comentar.",
    anonymousName: "Anônimo",
  },
  en: {
    title: "Comments",
    subtitle: "Comment anonymously or identify yourself with a name (optional email).",
    anonymous: "Comment as anonymous",
    name: "Name",
    namePlaceholder: "How you want to appear",
    email: "Email (optional)",
    emailPlaceholder: "not@shown.publicly",
    body: "Your comment",
    bodyPlaceholder: "Write here...",
    submit: "Post comment",
    submitting: "Sending...",
    published: "Comment published.",
    sendError: "Could not submit the comment.",
    genericError: "Error while commenting.",
    loading: "Loading comments...",
    empty: "Be the first to comment.",
    anonymousName: "Anonymous",
  },
  es: {
    title: "Comentarios",
    subtitle: "Comenta de forma anónima o identifícate con un nombre (email opcional).",
    anonymous: "Comentar como anónimo",
    name: "Nombre",
    namePlaceholder: "Cómo quieres aparecer",
    email: "Email (opcional)",
    emailPlaceholder: "no@aparece.publicamente",
    body: "Tu comentario",
    bodyPlaceholder: "Escribe aquí...",
    submit: "Publicar comentario",
    submitting: "Enviando...",
    published: "Comentario publicado.",
    sendError: "No se pudo enviar el comentario.",
    genericError: "Error al comentar.",
    loading: "Cargando comentarios...",
    empty: "Sé el primero en comentar.",
    anonymousName: "Anónimo",
  },
} as const;

export function commentLabels(lang: UiLang) {
  return commentCopy[lang];
}

export function dateLocale(lang: UiLang) {
  if (lang === "en") return "en-US";
  if (lang === "es") return "es-ES";
  return "pt-BR";
}
