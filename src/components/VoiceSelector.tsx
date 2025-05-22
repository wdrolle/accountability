'use client';

const KOKORO_VOICES = {
  'Bella (African Female)': 'af_bella',
  'Sarah (African Female)': 'af_sarah',
  'Adam (American Male)': 'am_adam',
  'Michael (American Male)': 'am_michael',
  'Emma (British Female)': 'bf_emma',
  'Isabella (British Female)': 'bf_isabella',
  'George (British Male)': 'bm_george',
  'Lewis (British Male)': 'bm_lewis',
  'Nicole (African Female)': 'af_nicole',
  'Sky (African Female)': 'af_sky'
} as const;

export function VoiceSelector({ onChange }: { onChange: (voice: string) => void }) {
  return (
    <select 
      onChange={(e) => onChange(e.target.value)}
      className="form-select rounded-md border-gray-300"
    >
      {Object.entries(KOKORO_VOICES).map(([label, value]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
} 

