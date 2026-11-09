import type { Metadata } from "next";
import { LegalPage } from "../../components/LegalPage";
import { getMonetizationConfig } from "../../lib/monetization";

export const metadata: Metadata = {
  title: "Política de Cookies",
  description: "Tipos de cookies usados no Nerteus e como gerenciar o consentimento.",
};

export default function CookiesPage() {
  const { contactEmail } = getMonetizationConfig();

  return (
    <LegalPage title="Política de Cookies" updatedAt="09/11/2026">
      <p>
        Cookies e tecnologias semelhantes ajudam o Nerteus a funcionar, medir uso e — com sua
        permissão — exibir anúncios.
      </p>

      <h2>1. Cookies necessários</h2>
      <p>
        Mantêm preferências básicas (tema, idioma, consentimento) e a experiência de leitura no
        navegador. Sem eles o site pode falhar.
      </p>

      <h2>2. Cookies de Analytics</h2>
      <p>
        Quando aceitos, permitem entender quais conteúdos são lidos (ex.: Google Analytics 4 /
        Tag Manager), de forma agregada.
      </p>

      <h2>3. Cookies de publicidade</h2>
      <p>
        Quando aceitos, o Google AdSense e parceiros podem usar cookies para exibir e medir
        anúncios. Você pode recusar essa categoria e continuar usando o site.
      </p>

      <h2>4. Como gerenciar</h2>
      <ul>
        <li>Pelo banner de cookies na primeira visita.</li>
        <li>Limpando dados do site no navegador (isso reinicia a escolha).</li>
        <li>Configurações do próprio navegador ou das preferências de anúncios do Google.</li>
      </ul>

      <h2>5. Contato</h2>
      <p>
        Dúvidas: <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
      </p>
    </LegalPage>
  );
}
