import { countryNameMatchesQuery } from './countryDisplayNames';

/** Harita / arama seçimini istihbarat hedef listesindeki kanonik şehir adına çevirir. */
export function resolveIntelTargetName(rawName, targets = []) {
  const name = String(rawName ?? '').trim();
  if (!name || !targets.length) return name;

  const exact = targets.find((t) => t.name === name);
  if (exact) return exact.name;

  const byProvince = targets.find((t) => t.provinceName === name);
  if (byProvince) return byProvince.name;

  const norm = (s) => String(s ?? '').trim().toLocaleLowerCase('tr');
  const q = norm(name);
  const byNorm = targets.find(
    (t) => norm(t.name) === q || norm(t.provinceName) === q,
  );
  if (byNorm) return byNorm.name;

  const fuzzy = targets.find((t) => countryNameMatchesQuery(t.name, name));
  return fuzzy?.name ?? name;
}
