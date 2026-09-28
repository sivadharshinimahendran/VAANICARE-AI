import { AppMode } from '../types';

interface AudioVisualizerProps {
  isRecording: boolean;
  audioLevel: number;
  mode?: AppMode;
}

export function AudioVisualizer({ isRecording, audioLevel, mode }: AudioVisualizerProps) {
  if (!isRecording) return null;

  // Generate 7 sound wave bars with dynamic heights based on volume level
  const baseHeights = [14, 26, 42, 60, 42, 26, 14];

  return (
    <div className="flex items-center justify-center gap-1.5 h-16 py-2 px-4 bg-pink-50/80 rounded-2xl border border-pink-100 shadow-inner">
      {baseHeights.map((base, idx) => {
        // Calculate dynamic height with slight oscillation
        const variance = Math.sin(Date.now() / 200 + idx) * 10;
        const dynamicHeight = Math.max(
          8,
          Math.min(54, base * (0.4 + audioLevel * 1.6) + variance)
        );

        let barColor = 'bg-gradient-to-t from-pink-400 to-purple-400';
        if (mode === 'child') {
          barColor = 'bg-gradient-to-t from-amber-400 via-pink-400 to-purple-400';
        } else if (mode === 'elderly') {
          barColor = 'bg-gradient-to-t from-indigo-600 to-blue-600';
        }

        return (
          <div
            key={idx}
            className={`w-2.5 rounded-full transition-all duration-75 ${barColor}`}
            style={{
              height: `${dynamicHeight}px`,
            }}
          />
        );
      })}
    </div>
  );
}
