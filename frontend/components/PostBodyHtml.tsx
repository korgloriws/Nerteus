/**
 * Corpo do post renderizado no servidor — garante o texto no HTML inicial
 * (SEO/AdSense), mesmo quando a ficha Netflix esconde a leitura no visual.
 */
export function PostBodyHtml({ html }: { html: string }) {
  return (
    <div
      className="prose rich-content max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-li:text-foreground prose-a:text-primary dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
