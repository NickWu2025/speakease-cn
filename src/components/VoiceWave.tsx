interface VoiceWaveProps {
  active: boolean;
}

const VoiceWave = ({ active }: VoiceWaveProps) => {
  if (!active) return null;

  return (
    <div className="flex items-center justify-center gap-[3px] h-7 px-4 py-1.5 rounded-full bg-primary/8">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="voice-bar w-[2.5px] bg-primary/70 rounded-full"
          style={{ height: 8 }}
        />
      ))}
    </div>
  );
};

export default VoiceWave;
