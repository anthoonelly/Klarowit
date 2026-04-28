import type { DocType, DocTypeId } from './types';

export const DOC_TYPES: DocType[] = [
  {
    id: 'opis',
    name: 'Opis projektu',
    desc: 'Karta projektu — cele, zakres, zespół, budżet, ryzyka',
    est: '~30s',
    recommended: true,
    sections: [
      'Nazwa projektu',
      'Streszczenie',
      'Cele biznesowe',
      'Zakres prac',
      'Zespół i partnerzy',
      'Budżet i harmonogram',
      'Kluczowe ryzyka',
    ],
    guidance: `Stwórz formalną kartę projektu zgodnie ze standardem PMI/PMBOK, dostosowanym do polskich realiów.
- "Streszczenie" powinno być zwięzłe (3–5 zdań), zawierać kluczową propozycję wartości i odbiorcę.
- "Cele biznesowe" — wymierne, z liczbami gdzie się da (preferuj listę).
- "Zakres prac" — fazami, z miesiącami / kamieniami milowymi (lista).
- "Zespół i partnerzy" — imiona, role, partnerzy zewnętrzni (lista).
- "Budżet i harmonogram" — krótko jako akapit, z konkretami z transkrypcji.
- "Kluczowe ryzyka" — z mitygacjami (lista).`,
  },
  {
    id: 'br',
    name: 'Dokumentacja B+R',
    desc: 'Uzasadnienie kwalifikacji wg art. 4a pkt 26–28 ustawy o CIT',
    est: '~45s',
    recommended: true,
    sections: [
      'Klasyfikacja prac',
      'Element nowości',
      'Element twórczy',
      'Element systematyczności',
      'Niepewność badawcza',
      'Planowane rezultaty B+R',
      'Zaangażowanie naukowe',
      'Kwalifikowalność kosztów',
    ],
    guidance: `Generujesz dokument uzasadniający kwalifikację projektu jako prac badawczo-rozwojowych w rozumieniu polskiego prawa podatkowego.

KRYTYCZNE WYMAGANIA:
- ZAWSZE odwołuj się do art. 4a pkt 26–28 ustawy o podatku dochodowym od osób prawnych (CIT).
- W "Klasyfikacji prac" rozróżnij: badania podstawowe (pkt 26), badania przemysłowe / aplikacyjne (pkt 27), prace rozwojowe (pkt 28). Wskaż proporcje.
- "Element nowości" — co nie jest dostępne w stanie techniki / wiedzy. Przyrost stanu wiedzy.
- "Element twórczy" — nieoczywiste rozwiązania, autorskie podejścia (lista).
- "Element systematyczności" — zaplanowane iteracje, punkty kontrolne, dokumentacja.
- "Niepewność badawcza" — czego nie wiemy a priori, jakie są ryzyka badawcze (lista).
- "Planowane rezultaty B+R" — publikacje, patenty, prototypy, TRL (lista).
- "Zaangażowanie naukowe" — partnerzy naukowi, doktoranci, ośrodki.
- "Kwalifikowalność kosztów" — rozbicie kosztów kwalifikowanych z przybliżonymi kwotami z transkrypcji (lista).

Ton: rzeczowy, formalny, z odwołaniami prawnymi. To dokument do organów podatkowych.`,
  },
  {
    id: 'harmo',
    name: 'Harmonogram',
    desc: 'Plan etapów, kamieni milowych i odpowiedzialności',
    est: '~20s',
    sections: ['Faza 1', 'Faza 2', 'Faza 3', 'Kamienie milowe'],
    guidance: `Zaplanuj realizację projektu w fazach.
- Każda faza jako oddzielna sekcja z body lub bullets, z miesiącami / okresami.
- Nazwy faz dostosuj do kontekstu projektu (np. "Faza 1 — Przygotowanie danych").
- "Kamienie milowe" — lista M1, M2, M3... z miesiącem i kryterium akceptacji.
Jeśli projekt wymaga więcej niż 3 faz, użyj nazw "Faza 1 — ...", "Faza 2 — ..." itd.`,
  },
  {
    id: 'budzet',
    name: 'Kosztorys',
    desc: 'Rozbicie kosztów kwalifikowanych i nie-kwalifikowanych',
    est: '~25s',
    sections: [
      'Podsumowanie',
      'Koszty kwalifikowane B+R',
      'Koszty wdrożeniowe',
      'Źródła finansowania',
    ],
    guidance: `Przygotuj rozbicie kosztów projektu.
- "Podsumowanie" — krótki akapit z budżetem całkowitym i podziałem B+R / wdrożenie.
- "Koszty kwalifikowane B+R" — lista pozycji kosztowych z kwotami w PLN. Uwzględnij: wynagrodzenia, amortyzację sprzętu, usługi obce, materiały.
- "Koszty wdrożeniowe" — lista pozycji niezwiązanych z B+R.
- "Źródła finansowania" — kapitał własny, dotacje, ulga B+R (200% odliczenia kosztów kwalifikowanych).
Wszystkie kwoty cytuj zgodnie z transkrypcją; szacunki oznaczaj "~".`,
  },
  {
    id: 'ryzyka',
    name: 'Rejestr ryzyk',
    desc: 'Macierz ryzyk z mitygacjami i właścicielami',
    est: '~15s',
    sections: ['R-01', 'R-02', 'R-03', 'R-04', 'R-05'],
    guidance: `Zidentyfikuj kluczowe ryzyka projektu w formacie macierzy ryzyk.
- Każde ryzyko jako osobna sekcja z heading "R-XX · [krótka nazwa ryzyka]".
- Body każdej sekcji zawiera: "Prawdopodobieństwo: [NISKIE/ŚREDNIE/WYSOKIE]. Wpływ: [NISKI/ŚREDNI/WYSOKI/KRYTYCZNY]. Mitygacja: [opis działań]. Właściciel: [rola]."
- Stwórz 4–6 ryzyk pokrywających: ryzyka techniczne, biznesowe, prawne, zasobowe.
- Heading dostosuj do faktycznego ryzyka, nie używaj generycznych nazw.`,
  },
  {
    id: 'sow',
    name: 'Statement of Work',
    desc: 'Zakres prac w wersji formalnej dla klienta',
    est: '~30s',
    sections: [
      'Strony umowy',
      'Przedmiot umowy',
      'Zobowiązania wykonawcy',
      'Akceptacja',
    ],
    guidance: `Sformalizowany dokument SOW (Statement of Work) dla klienta.
- "Strony umowy" — wykonawca i zamawiający (jeśli z transkrypcji nie wynika nazwa klienta, użyj [Klient]).
- "Przedmiot umowy" — krótki, formalny opis dostarczanej usługi.
- "Zobowiązania wykonawcy" — lista konkretnych deliverables.
- "Akceptacja" — kryteria odbioru, audyt, KPI.
Ton: kontraktowy, rzeczowy, bez marketingu.`,
  },
  {
    id: 'brief',
    name: 'Brief executive',
    desc: 'Jednostronicowe streszczenie dla zarządu',
    est: '~10s',
    sections: ['TL;DR', 'Dlaczego teraz', 'Co potrzebujemy'],
    guidance: `Bardzo zwięzły dokument dla zarządu (executive summary, max 1 strona).
- "TL;DR" — kluczowa propozycja wartości w 3–4 zdaniach. Liczba, wartość, czas, technologia.
- "Dlaczego teraz" — uzasadnienie momentu, okno rynkowe, przewaga konkurencyjna.
- "Co potrzebujemy" — konkretne decyzje / zasoby / zatwierdzenia od zarządu.
Każda sekcja jako body (akapit, nie lista). Maksymalna zwięzłość.`,
  },
];

export const DOC_TYPE_BY_ID: Record<DocTypeId, DocType> = Object.fromEntries(
  DOC_TYPES.map((d) => [d.id, d])
) as Record<DocTypeId, DocType>;
