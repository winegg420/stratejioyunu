import { useLayoutEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function SidebarActiveBeam({ listRef }) {
  const { pathname } = useLocation();
  const [beam, setBeam] = useState({ opacity: 0, transform: 'translateY(0)', height: 0 });

  useLayoutEffect(() => {
    const list = listRef?.current;
    if (!list) return undefined;

    const update = () => {
      const active = list.querySelector('.nav-link.active');
      if (!active) {
        setBeam((s) => ({ ...s, opacity: 0 }));
        return;
      }
      const listRect = list.getBoundingClientRect();
      const linkRect = active.getBoundingClientRect();
      setBeam({
        opacity: 1,
        transform: `translateY(${linkRect.top - listRect.top}px)`,
        height: linkRect.height,
      });
    };

    update();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    ro?.observe(list);
    window.addEventListener('resize', update);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [pathname, listRef]);

  return (
    <span
      className="sidebar-active-beam"
      aria-hidden="true"
      style={{
        opacity: beam.opacity,
        transform: beam.transform,
        height: beam.height ? `${beam.height}px` : 0,
      }}
    />
  );
}
