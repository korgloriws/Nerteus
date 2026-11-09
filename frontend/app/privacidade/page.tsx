import type { Metadata } from "next";
import { LegalPage } from "../../components/LegalPage";
import { getMonetizationConfig } from "../../lib/monetization";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Como o Nerteus coleta, usa e protege dados pessoais.",
};

export default function PrivacidadePage() {
  const { contactEmail, siteUrl } = getMonetizationConfig();

  return (
    <LegalPage title="Política de Privacidade" updatedAt="09/11/2026">
      <p>
        Esta política descreve como o Nerteus ({siteUrl}) trata dados pessoais, em conformidade com a
        Lei Geral de Proteção de Dados (LGPD) e com as exigências de serviços de monetização e
        medição, como Google Analytics e Google AdSense.
      </p>

      <h2>1. Quem somos</h2>
      <p>
        O Nerteus é um portal de posts com curadoria em formato de streaming. Contato:{" "}
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
      </p>

      <h2>2. Dados que podemos tratar</h2>
      <ul>
        <li>Dados de navegação (páginas visitadas, dispositivo, idioma aproximado).</li>
        <li>Identificadores de cookies e armazenamento local do navegador (histórico de leitura, preferências, listas).</li>
        <li>Dados fornecidos por você em comentários ou formulário de contato.</li>
        <li>Dados de publicidade e medição processados por parceiros (Google), quando houver consentimento.</li>
      </ul>

      <h2>3. Finalidades</h2>
      <ul>
        <li>Funcionamento do site e da experiência de leitura.</li>
        <li>Melhoria de conteúdo e desempenho (Analytics).</li>
        <li>Exibição de anúncios personalizados ou não personalizados (AdSense), conforme sua escolha.</li>
        <li>Atendimento de solicitações enviadas por e-mail/contato.</li>
      </ul>

      <h2>4. Cookies e tecnologias semelhantes</h2>
      <p>
        Usamos cookies necessários ao serviço e, com consentimento, cookies de Analytics e
        publicidade. Detalhes em nossa <a href="/cookies">Política de Cookies</a>.
      </p>

      <h2>5. Compartilhamento</h2>
      <p>
        Podemos compartilhar dados com provedores de infraestrutura e com o Google (Analytics /
        AdSense), nos limites do consentimento e dos contratos desses serviços. Links de afiliados
        (ex.: loja) levam a sites de terceiros com políticas próprias.
      </p>

      <h2>6. Seus direitos (LGPD)</h2>
      <p>
        Você pode solicitar confirmação de tratamento, acesso, correção, anonimização, portabilidade
        ou eliminação de dados pessoais que tenhamos, pelo e-mail {contactEmail}. Também pode
        gerenciar cookies no banner do site.
      </p>

      <h2>7. Alterações</h2>
      <p>Esta política pode ser atualizada. A data no topo indica a versão vigente.</p>
    </LegalPage>
  );
}
