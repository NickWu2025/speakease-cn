interface VoiceWaveProps {
  active: boolean;
}

const VoiceWave = ({ active }: VoiceWaveProps) => {
  if (!active) return null;

  return (
    <div className="flex items-center justify-center gap-[3px] h-8">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="voice-bar w-[3px] bg-primary rounded-full"
          style={{ height: 12 }}
        />
      ))}
    </div>
  );
};

export default VoiceWave;
