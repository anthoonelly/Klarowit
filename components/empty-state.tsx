'use client';

export function EmptyState() {
  return (
    <div className="empty">
      <div className="empty__mark" aria-hidden>
        <span>A</span>
        <em>→</em>
        <span>B</span>
      </div>
      <h2 className="empty__title">Z transkrypcji do dokumentów</h2>
      <p className="empty__copy">
        Wgraj nagranie z omówienia projektu, zaznacz jakie dokumenty potrzebujesz,
        a model wygeneruje je w formacie firmowym — gotowe do edycji i eksportu.
      </p>
      <ol className="empty__steps">
        <li>
          <span>01</span> Wklej lub upuść transkrypcję
        </li>
        <li>
          <span>02</span> Zaznacz typy dokumentów do wygenerowania
        </li>
        <li>
          <span>03</span> (Opcjonalnie) dodaj instrukcje i wzorce w „Kontekst AI"
        </li>
        <li>
          <span>04</span> Generujesz · regenerujesz · eksportujesz
        </li>
      </ol>
    </div>
  );
}
