import CostBreakdown from './CostBreakdown';

export default function UnitDetailModal({ unit, qty, resources, awayMap, open, onClose }) {
  if (!open || !unit) return null;

  const idle = unit.idle ?? unit.count ?? 0;

  return (
    <div className="unit-detail-modal-root" role="presentation" onClick={onClose}>
      <div
        className="unit-detail-modal panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="unit-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="unit-detail-modal__head">
          <div className="unit-detail-modal__icon" aria-hidden="true">
            {unit.image}
          </div>
          <div>
            <h2 id="unit-detail-title" className="unit-detail-modal__title">
              {unit.name}
            </h2>
            {(unit.designationCode || unit.designation) && (
              <p className="unit-detail-modal__designation">
                {unit.designationCode ?? unit.designation}
              </p>
            )}
          </div>
          <button type="button" className="unit-detail-modal__close" onClick={onClose} aria-label="Kapat">
            ×
          </button>
        </header>

        <p className="unit-detail-modal__desc">{unit.desc}</p>

        <dl className="unit-detail-modal__stats">
          <div>
            <dt>Saldırı</dt>
            <dd>{unit.attack}</dd>
          </div>
          <div>
            <dt>Savunma</dt>
            <dd>{unit.defense}</dd>
          </div>
          <div>
            <dt>Boşta</dt>
            <dd>{idle.toLocaleString('tr-TR')}</dd>
          </div>
          <div>
            <dt>Üretim süresi</dt>
            <dd>{unit.time}</dd>
          </div>
        </dl>

        <div className="unit-detail-modal__cost">
          <p className="unit-detail-modal__cost-label">Birim maliyeti</p>
          <p>{unit.cost}</p>
          {resources && qty > 0 && (
            <CostBreakdown costStr={unit.cost} qty={qty} resources={resources} />
          )}
        </div>

        {awayMap && (
          <p className="unit-detail-modal__note">
            Seferde olan birlikler üretim ve MAX hesabına dahil edilmez.
          </p>
        )}
      </div>
    </div>
  );
}
