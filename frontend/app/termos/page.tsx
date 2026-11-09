import type { Metadata } from "next";
import { LegalPage } from "../../components/LegalPage";
import { getMonetizationConfig } from "../../lib/monetization";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Regras de uso do portal Nerteus.",
};

export default function TermosPage() {
  const { contactEmail, siteUrl } = getMonetizationConfig();

  return (
    <LegalPage title="Termos de Uso" updatedAt="09/11/2026">
      <p>
        Ao acessar {siteUrl}, você concorda com estes termos. Se não concordar, não utilize o
        serviço.
      </p>

      <h2>1. O serviço</h2>
      <p>
        O Nerteus publica posts e conteúdos curatoriais. Podemos alterar, pausar ou remover
        conteúdos e recursos a qualquer momento.
      </p>

      <h2>2. Uso aceitável</h2>
      <ul>
        <li>Não use o site para spam, ataques ou coleta automatizada abusiva.</li>
        <li>Não publique comentários ilegais, ofensivos ou que violem direitos de terceiros.</li>
        <li>Não tente burlar medidas de segurança ou áreas administrativas.</li>
      </ul>

      <h2>3. Conteúdo e propriedade</h2>
      <p>
        Textos, marcas e layout do Nerteus são protegidos. Não reproduza o conteúdo em escala
        comercial sem autorização. Fontes e imagens de terceiros seguem seus respectivos direitos.
      </p>

      <h2>4. Publicidade e afiliados</h2>
      <p>
        O site pode exibir anúncios e links de afiliados. Transações feitas em sites de terceiros
        são de responsabilidade desses sites.
      </p>

      <h2>5. Isenção</h2>
      <p>
        O conteúdo é informativo e de entretenimento. Não garantimos ausência de erros ou
        disponibilidade ininterrupta.
      </p>

      <h2>6. Contato</h2>
      <p>
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
      </p>
    </LegalPage>
  );
}
