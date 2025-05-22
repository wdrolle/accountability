'use client';

import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button
} from "@heroui/react"

interface VoiceOption {
  name: string
  description: string
  value: string
}

const KOKORO_VOICES: VoiceOption[] = [
  {
    name: "Bella",
    description: "African Female",
    value: "af_bella"
  },
  {
    name: "Sarah",
    description: "African Female", 
    value: "af_sarah"
  },
  {
    name: "Adam",
    description: "American Male",
    value: "am_adam"
  },
  {
    name: "Michael", 
    description: "American Male",
    value: "am_michael"
  },
  {
    name: "Emma",
    description: "British Female",
    value: "bf_emma"
  },
  {
    name: "Isabella",
    description: "British Female",
    value: "bf_isabella"
  },
  {
    name: "George",
    description: "British Male",
    value: "bm_george"
  },
  {
    name: "Lewis",
    description: "British Male",
    value: "bm_lewis"
  },
  {
    name: "Nicole",
    description: "African Female",
    value: "af_nicole"
  },
  {
    name: "Sky",
    description: "African Female",
    value: "af_sky"
  }
];

interface KokoroVoiceSelectorProps {
  onChange: (voice: string) => void;
  currentVoice: string;
}

export function KokoroVoiceSelector({ onChange, currentVoice }: KokoroVoiceSelectorProps) {
  const currentVoiceOption = KOKORO_VOICES.find(voice => voice.value === currentVoice);

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button 
          variant="bordered"
          className="capitalize min-w-[140px] bg-white dark:bg-gray-800"
        >
          {currentVoiceOption?.name || 'Select Voice'}
        </Button>
      </DropdownTrigger>
      <DropdownMenu 
        aria-label="Voice Selection"
        variant="flat"
        selectionMode="single"
        className="bg-white dark:bg-black text-black dark:text-white"
        selectedKeys={[currentVoice]}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as string;
          onChange(selected);
        }}
      >
        {KOKORO_VOICES.map((voice) => (
          <DropdownItem
            key={voice.value}
            description={voice.description}
          >
            {voice.name}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
} 