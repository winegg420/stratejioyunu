import { Component } from 'react';
import { LanguageContext } from '../context/LanguageContext';

/**
 * Harita paneli — React render hatasında tüm uygulama çökmez.
 */
export default class MapErrorBoundary extends Component {
  static contextType = LanguageContext;

  constructor(props) {
    super(props);
    this.state = { error: null, rebootKey: 0 };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[MAP_RENDER]', error, info);
  }

  handleReboot = () => {
    this.setState((s) => ({
      error: null,
      rebootKey: s.rebootKey + 1,
    }));
  };

  render() {
    const { error, rebootKey } = this.state;
    const { children, className = '' } = this.props;
    const t = this.context?.t ?? ((key) => key);

    if (error) {
      return (
        <div
          className={['map-error-boundary', className].filter(Boolean).join(' ')}
          role="alert"
          onClick={this.handleReboot}
          onKeyDown={(e) => {
            if (e.key === 'Escape') this.handleReboot();
          }}
        >
          <div
            className="map-error-boundary__frame"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <p className="map-error-boundary__tag font-hud-data">{t('components.mapError.tag')}</p>
            <h2 className="map-error-boundary__title font-hud-data">
              {t('components.mapError.title')}
            </h2>
            <p className="map-error-boundary__sub font-hud-data">
              {t('components.mapError.subtitle')}
            </p>
            <pre className="map-error-boundary__detail">{error.message}</pre>
            <button
              type="button"
              className="btn btn-primary map-error-boundary__reboot"
              onClick={this.handleReboot}
            >
              {t('components.mapError.reload')}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div key={rebootKey} className={['map-error-boundary__host', className].filter(Boolean).join(' ')}>
        {children}
      </div>
    );
  }
}
