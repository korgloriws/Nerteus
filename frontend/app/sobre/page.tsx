import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "../../components/LegalPage";
import { getMonetizationConfig } from "../../lib/monetization";

export const metadata: Metadata = {
  title: "Sobre o Nerteus",
  description:
    "Nerteus é streaming de leitura: posts de tech, anime, games, pop e cultura nerd, no ritmo de quem vive no celular.",
};

export default function SobrePage() {
  const { contactEmail } = getMonetizationConfig();

  return (
    <LegalPage title="Sobre o Nerteus" eyebrow="Quem somos">
      <p className="text-base text-foreground sm:text-lg">
        O Nerteus nasceu de uma ideia simples: e se ler na internet tivesse a mesma vontade de
        “só mais um” que a gente sente ao abrir um streaming?
      </p>
      <p>
        Aqui os posts não ficam perdidos numa lista fria. Eles entram em faixas —{" "}
        <strong className="text-foreground">Tech, Otaku, Games, Pop e Básica</strong> —, com capa,
        introdução e o botão de seguir a leitura. Tem continue lendo, leia novamente, minha lista,
        gostei / não gostei e recomendações que aprendem o seu gosto. Tudo pensado primeiro para o
        celular, porque é ali que a maior parte da gente realmente consome conteúdo.
      </p>

      <h2>Para quem é</h2>
      <p>
        Para quem curte cultura nerd sem culpa, acompanha anime e games, mexe com tecnologia ou só
        quer um texto bom no intervalo do dia. Se você já passou horas numa maratona e gostaria que
        a leitura tivesse o mesmo fluxo — abrir, mergulhar, continuar depois — o Nerteus foi feito
        pra você.
      </p>

      <h2>O que você encontra</h2>
      <ul>
        <li>Posts com vibe de catálogo, não de blog antigo.</li>
        <li>Temas da semana claros, para achar rápido o que combina com o humor do dia.</li>
        <li>Uma experiência instalável no celular, quase como um app de streaming.</li>
        <li>Loja e parcerias que ajudam a manter o portal no ar, com transparência.</li>
      </ul>

      <h2>Nossa intenção</h2>
      <p>
        Criar um lugar em que a leitura seja entretenimento de verdade: visual forte, navegação
        leve e conteúdo que dá vontade de voltar. Sem enrolação, sem parecer um site genérico — só
        o ritmo de quem vive entre telas, fandoms e curiosidade.
      </p>
      <p>
        Se isso te representa,{" "}
        <Link href="/" className="font-semibold text-foreground underline-offset-2 hover:underline">
          começa pela home
        </Link>
        , escolhe uma faixa e entra na próxima leitura.
      </p>

      <h2>Fala com a gente</h2>
      <p>
        Dúvidas, ideias, parcerias ou só um “achei isso aqui”:{" "}
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
      </p>
    </LegalPage>
  );
}
