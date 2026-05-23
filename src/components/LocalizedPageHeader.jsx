import PageHeader from './PageHeader';
import { usePageT } from '../context/LanguageContext';

/**
 * Sayfa başlığı ve alt yazısını seçili dile göre gösterir.
 * @param {string} pageKey — i18n pages.* anahtarı (ör. "market")
 */
export default function LocalizedPageHeader({
  pageKey,
  action,
  hideStatus,
  feedPending,
  className,
  typewriterSubtitle,
  feedKey,
  /** Dinamik içerik için isteğe bağlı geçersiz kılmalar */
  title: titleOverride,
  subtitle: subtitleOverride,
  status: statusOverride,
  feedLine: feedLineOverride,
}) {
  const copy = usePageT(pageKey);
  const feedFromCopy = feedKey
    ? copy.feed
    : (copy.feed && !String(copy.feed).startsWith('pages.') ? copy.feed : undefined);

  return (
    <PageHeader
      className={className}
      title={titleOverride ?? copy.title}
      subtitle={
        subtitleOverride
        ?? (typewriterSubtitle === false ? undefined : copy.subtitle)
      }
      status={statusOverride ?? (hideStatus ? undefined : copy.status)}
      feedLine={feedLineOverride ?? feedFromCopy ?? undefined}
      feedPending={feedPending}
      hideStatus={hideStatus}
      action={action}
    />
  );
}
