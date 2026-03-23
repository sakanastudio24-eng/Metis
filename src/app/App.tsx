import { PhaseOneShell } from "./components/PhaseOneShell";
import { useMetisState } from "./useMetisState";

export default function App() {
  const { panelMode, setPanelMode } = useMetisState();

  return (
    <div className="relative">
      <PhaseOneShell panelMode={panelMode} setPanelMode={setPanelMode} />
    </div>
  );
}
