import { useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';

function LevelTable({ rows, effectLabel }) {
  if (!rows?.length) return null;
  return (
    <div className="content-info-modal__section">
      <h3 className="content-info-modal__section-title">Kademeli üretim tablosu</h3>
      <p className="content-info-modal__section-hint">
        Sv.1 — Sv.{rows.length}: {effectLabel}
      </p>
      <div className="content-info-modal__table-wrap">
        <table className="content-info-modal__table">
          <thead>
            <tr>
              <th>Sv.</th>
              <th>{effectLabel}</th>
              <th>Maliyet</th>
              <th>Süre</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.level}>
                <td>{row.level}</td>
                <td className="content-info-modal__mono">{row.output}</td>
                <td className="content-info-modal__mono content-info-modal__dim">{row.cost}</td>
                <td className="content-info-modal__mono content-info-modal__dim">{row.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PrereqTree({ lines }) {
  if (!lines?.length) return null;
  return (
    <div className="content-info-modal__section">
      <h3 className="content-info-modal__section-title">Gereksinim ağacı</h3>
      <ul className="content-info-modal__prereq-list">
        {lines.map((line, i) => (
          <li
            key={i}
            className={line.met ? 'content-info-modal__prereq--ok' : 'content-info-modal__prereq--bad'}
          >
            <span className="content-info-modal__mono">{line.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MatchupPanel({ title, items, variant }) {
  if (!items?.length) return null;
  return (
    <div className={`content-info-modal__matchup content-info-modal__matchup--${variant}`}>
      <h4 className="content-info-modal__matchup-title">{title}</h4>
      <ul>
        {items.map((m, i) => (
          <li key={i}>
            <span className="content-info-modal__matchup-pct">%{m.pct}</span>
            <span>{m.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BuildingResearchBody({ data }) {
  return (
    <>
      <p className="content-info-modal__lore">{data.lore}</p>
      {data.kbrnLocked && data.kbrnGate?.trim() && (
        <p className="content-info-modal__alert">{data.kbrnGate}</p>
      )}
      <LevelTable rows={data.levelRows} effectLabel={data.effectLabel} />
      <PrereqTree lines={data.prerequisites} />
    </>
  );
}

function UnitBody({ data }) {
  return (
    <>
      <p className="content-info-modal__lore">{data.lore}</p>
      <dl className="content-info-modal__tactical-grid">
        <div>
          <dt>MIL kodu</dt>
          <dd className="content-info-modal__mono">{data.milCode}</dd>
        </div>
        <div>
          <dt>Hız endeksi</dt>
          <dd>{data.speed} u/h</dd>
        </div>
        <div>
          <dt>Taşıma</dt>
          <dd>{data.cargo} birim</dd>
        </div>
        <div>
          <dt>Petrol / sefer</dt>
          <dd>{data.fuelPerSortie}</dd>
        </div>
        <div>
          <dt>Saldırı</dt>
          <dd>{data.attack}</dd>
        </div>
        <div>
          <dt>Savunma</dt>
          <dd>{data.defense}</dd>
        </div>
        <div>
          <dt>Üretim maliyeti</dt>
          <dd className="content-info-modal__mono">{data.cost}</dd>
        </div>
        <div>
          <dt>Üretim süresi</dt>
          <dd className="content-info-modal__mono">{data.time}</dd>
        </div>
      </dl>
      <div className="content-info-modal__matchup-row">
        <MatchupPanel title="[ AVANTAJLI ]" items={data.advantages} variant="advantage" />
        <MatchupPanel title="[ DEZAVANTAJLI ]" items={data.disadvantages} variant="disadvantage" />
      </div>
    </>
  );
}

export default function ContentInfoModal() {
  const data = useGameStore((s) => s.contentInfoPayload);
  const closeContentInfo = useGameStore((s) => s.closeContentInfo);

  useEffect(() => {
    if (!data) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeContentInfo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [data, closeContentInfo]);

  if (!data) return null;

  const isUnit = data.kind === 'unit';

  return (
    <div
      className="content-info-modal-root"
      role="presentation"
      onClick={closeContentInfo}
    >
      <div
        className={['content-info-modal', 'hud-panel-border', isUnit && 'content-info-modal--unit'].filter(Boolean).join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby="content-info-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="content-info-modal__head">
          <div className="content-info-modal__visual">
            {data.image && !isUnit ? (
              <img src={data.image} alt="" className="content-info-modal__img" />
            ) : (
              <span className="content-info-modal__emoji" aria-hidden="true">
                {data.emoji}
              </span>
            )}
          </div>
          <div className="content-info-modal__titles">
            <span className="content-info-modal__tag">[ ANSİKLOPEDİ ]</span>
            <h2 id="content-info-title">{data.title}</h2>
            {data.subtitle && (
              <p className="content-info-modal__subtitle content-info-modal__mono">{data.subtitle}</p>
            )}
            <span className="content-info-modal__category">{data.category}</span>
          </div>
          <button
            type="button"
            className="content-info-modal__close"
            onClick={closeContentInfo}
            aria-label="Kapat"
          >
            [ X ]
          </button>
        </header>

        <div className="content-info-modal__body">
          {isUnit ? <UnitBody data={data} /> : <BuildingResearchBody data={data} />}
        </div>
      </div>
    </div>
  );
}
