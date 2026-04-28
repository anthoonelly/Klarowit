import type { ContextExample } from './types';

export const SAMPLE_TRANSCRIPT = `[00:00:12] Marek (PM): Dobrze, więc spotykamy się dzisiaj, żeby omówić projekt SmartFlow — system optymalizacji procesów produkcyjnych w oparciu o uczenie maszynowe. Mamy kontrakt z klientem, fabryka komponentów elektronicznych pod Wrocławiem.

[00:00:48] Anna (CTO): Tak, krótko o zakresie technicznym. Chcemy zbudować platformę, która zbiera dane z czujników IoT — temperatura, wibracje, pobór prądu — i przewiduje awarie maszyn z wyprzedzeniem co najmniej 48 godzin. Trzeba opracować nowy algorytm hybrydowy: LSTM plus model fizyczny maszyny. Tego nie ma na rynku w takiej formie.

[00:01:35] Marek: Czyli klasyczne predictive maintenance, ale...

[00:01:38] Anna: Nie, nie klasyczne. Klasyczne podejścia mają 60–70% trafności na tej klasie maszyn. My celujemy w 92%. To wymaga badań — testowania kilku architektur sieci, walidacji na danych historycznych, prawdopodobnie publikacji.

[00:02:14] Tomek (Lead ML): Dorzucę — planuję zrobić co najmniej trzy iteracje modelu. Pierwsza to baseline, druga z atencją czasową, trzecia hybryda fizyczno-uczeniowa. Każda iteracja po dwa miesiące, w tym A/B testy na linii produkcyjnej.

[00:03:01] Marek: Budżet jaki rozważamy?

[00:03:05] Anna: Około 1.8 miliona złotych przez 14 miesięcy. Z czego 60% to praca badawcza, reszta wdrożenie i integracja z systemem MES klienta.

[00:03:42] Tomek: Ważne — będziemy potrzebować zatrudnić jeszcze jednego doktoranta do części badawczej. I współpraca z Politechniką Wrocławską jest już wstępnie ustalona, profesor Kowalczyk.

[00:04:20] Marek: Ryzyka?

[00:04:23] Anna: Główne ryzyko to jakość danych historycznych klienta — pierwsze trzy miesiące to czyszczenie i etykietowanie. Drugie ryzyko: model może nie osiągnąć 92% i wtedy trzeba renegocjować KPI.

[00:05:10] Tomek: I jeszcze jedno — chcemy to potem skomercjalizować jako produkt SaaS dla innych fabryk. Więc architektura od początku multi-tenant.

[00:05:48] Marek: OK, podsumowując: SmartFlow, predictive maintenance hybrydowy, 14 miesięcy, 1.8 mln, partner naukowy PWr, cel komercjalizacji. Robimy?

[00:06:02] Anna: Robimy.`;

export const DEFAULT_INSTRUCTIONS = `Jesteś analitykiem projektowym specjalizującym się w dokumentacji projektów B+R w polskim systemie podatkowym.

Zasady:
• Pisz w polskim języku formalnym, ale bez korporacyjnego żargonu.
• Trzymaj się faktów z transkrypcji — nie wymyślaj liczb, dat ani nazwisk.
• Używaj nawiasów [domniemane] gdy uzupełniasz luki na podstawie kontekstu.
• Każdą kwotę i każdy KPI cytuj zgodnie z transkrypcją.
• W dokumentacji B+R ZAWSZE odwołuj się do art. 4a pkt 26–28 ustawy o CIT i wskazuj 4 elementy: nowość, twórczość, systematyczność, niepewność.
• Format: krótkie sekcje z nagłówkami, listy punktowane gdzie to naturalne.

Ton: rzeczowy, zwięzły, zorientowany na decydenta.`;

export const DEFAULT_EXAMPLES: ContextExample[] = [
  {
    id: 'ex-1',
    name: 'Wzorzec — opis projektu (wewnętrzny szablon firmowy)',
    body: `# Nazwa projektu
[Krótka, mocna nazwa robocza + tagline jednolinijkowy]

# Streszczenie (max 4 zdania)
Co robimy, dla kogo, jaki problem rozwiązujemy, jaka technologia.

# Cele biznesowe (3–5 punktów)
Wymierne, z liczbami gdzie się da.

# Zakres prac (faza-po-fazie z miesiącami)

# Zespół i partnerzy

# Budżet i harmonogram (jednoakapitowo)

# Kluczowe ryzyka (z mitygacjami)`,
  },
];
