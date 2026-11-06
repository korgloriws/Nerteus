type Props = {
  className?: string;
  /** on-dark: livro claro sobre a capa. on-light: livro escuro no botão branco. */
  tone?: "on-dark" | "on-light";
};

/** Livro aberto padrão, com as páginas se afastando no hover. */
export function OpenBookIcon({ className = "h-5 w-6", tone = "on-dark" }: Props) {
  const line = tone === "on-dark" ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.75)";

  return (
    <svg viewBox="0 0 24 24" className={`open-book ${className}`} aria-hidden="true">
      <g className="open-book__page open-book__page--left">
        <path
          fill="currentColor"
          d="M11.2 4.6c-1.8-.7-3.7-1-5.6-.8H3.2c-.5 0-.9.4-.9.9v13.1c0 .5.4.9.9.9h2.2c1.9 0 3.8.4 5.5 1.2.2.1.4 0 .4-.2V4.8c0-.1 0-.2-.1-.2z"
        />
        <path fill={line} d="M4.1 8h5.1v.9H4.1zm0 2.2h5.1v.9H4.1zm0 2.2h3.6v.9H4.1z" />
      </g>
      <g className="open-book__page open-book__page--right">
        <path
          fill="currentColor"
          d="M12.8 4.6c1.8-.7 3.7-1 5.6-.8h2.4c.5 0 .9.4.9.9v13.1c0 .5-.4.9-.9.9h-2.2c-1.9 0-3.8.4-5.5 1.2-.2.1-.4 0-.4-.2V4.8c0-.1 0-.2.1-.2z"
        />
        <path fill={line} d="M14.8 8H20v.9h-5.2zm0 2.2H20v.9h-5.2zm0 2.2h3.6v.9h-3.6z" />
      </g>
    </svg>
  );
}
