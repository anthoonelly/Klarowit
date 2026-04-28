import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';

export default async function HomePage() {
  const user = await getSessionUser();
  if (user) redirect('/workspace');

  return (
    <div className="landing">
      <header className="landing__top">
        <div className="topbar__brand">
          <div className="brand__mark" aria-hidden>
            <svg viewBox="0 0 32 32" width="22" height="22">
              <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="1.2" />
              <path d="M9 16h14M16 9v14" stroke="currentColor" strokeWidth="1.2" />
              <circle cx="16" cy="16" r="3" fill="currentColor" />
            </svg>
          </div>
          <div className="brand__text">
            <div className="brand__name">Memoist</div>
            <div className="brand__tag">transcript → document</div>
          </div>
        </div>
        <nav className="landing__nav">
          <Link href="/signin">Zaloguj się</Link>
          <Link href="/signup" className="btn btn--primary btn--small">
            Załóż konto
          </Link>
        </nav>
      </header>

      <main className="landing__hero">
        <div className="landing__hero-eyebrow">Memoist · profesjonalne dokumenty z transkrypcji</div>
        <h1 className="landing__hero-title">
          Z mglistego spotkania
          <br />
          do gotowych dokumentów.
        </h1>
        <p className="landing__hero-copy">
          Wgraj nagranie z omówienia projektu, zaznacz potrzebne dokumenty, a model
          wygeneruje je w formacie firmowym — opis projektu, dokumentacja B+R z
          odwołaniem do art. 4a CIT, kosztorys, harmonogram, rejestr ryzyk, SOW i
          brief executive.
        </p>
        <div className="landing__cta">
          <Link href="/signup" className="btn btn--primary">
            Zacznij za darmo · 5 tokenów na start
          </Link>
          <Link href="/signin" className="btn btn--ghost">
            Mam już konto
          </Link>
        </div>

        <div className="landing__features">
          <div className="landing__feature">
            <div className="landing__feature-num">01</div>
            <div className="landing__feature-title">7 typów dokumentów</div>
            <div className="landing__feature-desc">
              Każdy z dedykowanym promptem. B+R z odwołaniem do art. 4a CIT.
            </div>
          </div>
          <div className="landing__feature">
            <div className="landing__feature-num">02</div>
            <div className="landing__feature-title">Twój kontekst</div>
            <div className="landing__feature-desc">
              Dodaj własne instrukcje i wzorce firmowe, model się dostosuje.
            </div>
          </div>
          <div className="landing__feature">
            <div className="landing__feature-num">03</div>
            <div className="landing__feature-title">Eksport do Worda</div>
            <div className="landing__feature-desc">
              Pełnoprawny .docx z hierarchią nagłówków i polskimi znakami.
            </div>
          </div>
        </div>
      </main>

      <footer className="landing__foot">
        Memoist · zasilane przez OpenAI · v1.0
      </footer>
    </div>
  );
}
