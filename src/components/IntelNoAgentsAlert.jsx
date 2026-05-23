import { Link } from 'react-router-dom';

export default function IntelNoAgentsAlert() {
  return (
    <div className="intel-no-agents-alert" role="alert">
      <span className="intel-no-agents-alert__tag">[ SİSTEM UYARISI ]</span>
      <p className="intel-no-agents-alert__text">
        SİSTEMDE AKTİF AJAN BULUNAMADI — ÖNCE AJAN İSTİHDAM EDİN
      </p>
      <Link to="/binalar" className="intel-no-agents-alert__link">
        İstihbarat Merkezi → Binalar
      </Link>
    </div>
  );
}
