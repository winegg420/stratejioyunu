import { useGameStore } from '../stores/gameStore';
import { getActiveMilAiQuest, getMilAiRewardLabel } from '../lib/milAiTutorial';

export default function MilAiAdvisor() {
  const quest = useGameStore((s) => getActiveMilAiQuest(s));
  const completeMilAiQuest = useGameStore((s) => s.completeMilAiQuest);

  if (!quest) {
    return (
      <aside className="mil-ai-advisor mil-ai-advisor--done">
        <span className="mil-ai-advisor__badge">MIL-AI</span>
        <p>Temel brifing tamamlandı. Üs hazır — stratejik kararlar sizde, Başkanım.</p>
      </aside>
    );
  }

  const ready = quest.check(useGameStore.getState());

  return (
    <aside className="mil-ai-advisor">
      <div className="mil-ai-advisor__head">
        <span className="mil-ai-advisor__badge">MIL-AI Assistant</span>
        <span className="mil-ai-advisor__pulse" aria-hidden="true" />
      </div>
      <h3 className="mil-ai-advisor__title">{quest.title}</h3>
      <p className="mil-ai-advisor__hint">{quest.hint}</p>
      <p className="mil-ai-advisor__reward">
        Ödül: <span className="font-hud-data">{getMilAiRewardLabel(quest.reward)}</span>
      </p>
      {ready ? (
        <button
          type="button"
          className="btn btn-primary mil-ai-advisor__btn"
          onClick={() => completeMilAiQuest(quest.id)}
        >
          Görevi tamamla
        </button>
      ) : (
        <span className="mil-ai-advisor__pending">Görev devam ediyor…</span>
      )}
    </aside>
  );
}
