import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Uygulama hatası:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="app-error-fallback" role="alert">
        <h1>Bir şeyler ters gitti</h1>
        <p>Sayfa yüklenirken beklenmeyen bir hata oluştu.</p>
        <pre className="app-error-detail">
          {error.message}
          {error.componentStack ? `\n${error.componentStack}` : ''}
        </pre>
        <button type="button" className="btn btn-primary" onClick={this.handleReload}>
          Sayfayı Yenile
        </button>
      </div>
    );
  }
}
