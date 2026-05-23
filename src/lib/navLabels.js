/** Nav öğesi etiketini aktif dile göre döndürür. */
export function getNavItemLabel(item, t) {
  if (item?.labelKey) return t(item.labelKey);
  return item?.label ?? '';
}
