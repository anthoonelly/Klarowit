'use client';

import { Icon } from './icons';

const STAGES = [
  {
    id: 'parse',
    label: 'Parsowanie transkrypcji',
    desc: 'Identyfikacja mówców i znaczników czasu',
  },
  {
    id: 'extract',
    label: 'Ekstrakcja faktów',
    desc: 'Cele, budżet, zespół, ryzyka, KPI',
  },
  {
    id: 'classify',
    label: 'Klasyfikacja prac B+R',
    desc: 'Mapowanie na art. 4a pkt 26–28',
  },
  {
    id: 'compose',
    label: 'Komponowanie dokumentów',
    desc: 'Generowanie sekcji w formacie firmowym',
  },
  {
    id: 'review',
    label: 'Kontrola spójności',
    desc: 'Walidacja kwot, dat i odniesień prawnych',
  },
];

interface Props {
  progress: number;
}

export function GeneratingView({ progress }: Props) {
  const stagePos = (progress / 100) * STAGES.length;

  return (
    <div className="generating">
      <div className="generating__head">
        <div className="generating__eyebrow">Generowanie · w toku</div>
        <h2 className="generating__title">
          Czytam i rozumiem
          <br />
          twoją transkrypcję.
        </h2>
      </div>
      <div
        className="generating__bar"
        role="progressbar"
        aria-valuenow={Math.floor(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="generating__bar-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="generating__pct">{Math.floor(progress)}%</div>
      <ul className="stages">
        {STAGES.map((s, i) => {
          const isDone = i < Math.floor(stagePos);
          const isActive = i === Math.floor(stagePos);
          return (
            <li
              key={s.id}
              className={`stage ${isDone ? 'is-done' : ''} ${
                isActive ? 'is-active' : ''
              }`}
            >
              <div className="stage__dot">
                {isDone ? (
                  <Icon.Check />
                ) : isActive ? (
                  <span className="stage__pulse" />
                ) : (
                  <span />
                )}
              </div>
              <div className="stage__body">
                <div className="stage__label">{s.label}</div>
                <div className="stage__desc">{s.desc}</div>
              </div>
              <div className="stage__num">
                {String(i + 1).padStart(2, '0')}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
