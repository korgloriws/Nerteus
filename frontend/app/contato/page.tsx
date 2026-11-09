import type { Metadata } from "next";
import { LegalPage } from "../../components/LegalPage";
import { getMonetizationConfig } from "../../lib/monetization";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com o Nerteus.",
};

export default function ContatoPage() {
  const { contactEmail } = getMonetizationConfig();

  return (
    <LegalPage title="Contato" eyebrow="Fale conosco">
      <p>
        Para dúvidas, parcerias, correções ou solicitações de privacidade (LGPD), escreva para:
      </p>
      <p>
        <a className="text-base font-semibold text-foreground" href={`mailto:${contactEmail}`}>
          {contactEmail}
        </a>
      </p>
      <p className="text-sm">
        Respondemos pelo próprio e-mail. Não pedimos senha, códigos de acesso ou dados bancários
        por mensagem.
      </p>
    </LegalPage>
  );
}
