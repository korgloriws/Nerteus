import type { Metadata } from "next";
import { LegalPage } from "../../components/LegalPage";
import { getMonetizationConfig } from "../../lib/monetization";

export const metadata: Metadata = {
  title: "Ética editorial",
  description: "Princípios editoriais e de monetização do Nerteus.",
};

export default function EticaPage() {
  const { contactEmail } = getMonetizationConfig();

  return (
    <LegalPage title="Ética editorial" eyebrow="Transparência" updatedAt="09/11/2026">
      <p>
        Esta página deixa claro como o Nerteus separa conteúdo, opinião, publicidade e afiliados —
        requisito importante para confiança do leitor e para programas de monetização.
      </p>

      <h2>1. Independência editorial</h2>
      <p>
        A escolha e a edição dos posts seguem critérios de relevância e qualidade. Anúncios não
        compram a pauta.
      </p>

      <h2>2. Publicidade</h2>
      <p>
        Anúncios (incluindo Google AdSense) são identificados como tal. Não criamos conteúdo só
        para enganar cliques ou violar políticas de anúncios.
      </p>

      <h2>3. Afiliados</h2>
      <p>
        Produtos na loja ou recomendações podem gerar comissão. Isso não altera o compromisso de
        indicar apenas o que faz sentido para a audiência.
      </p>

      <h2>4. Conteúdo original e fontes</h2>
      <p>
        Buscamos conteúdo próprio ou devidamente creditado. Erros factuais corrigidos quando
        identificados.
      </p>

      <h2>5. Comentários</h2>
      <p>
        Moderamos comentários abusivos, spam e conteúdo ilegal. O Nerteus não endossa todas as
        opiniões dos leitores.
      </p>

      <h2>6. Contato</h2>
      <p>
        Questões éticas ou denúncias: <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
      </p>
    </LegalPage>
  );
}
