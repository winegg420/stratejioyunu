/** Store/hydrate — null veya bozuk JSON sonrası .map çökmesini önler */
export function asArray(value) {
  return Array.isArray(value) ? value : [];
}
