export type SpeechVoice = 'male' | 'female';

export type GenerateSpeechInput = {
  text: string;
  voice: SpeechVoice;
  speed: number;
  volume: number;
  pitch: number;
};

export type GeneratedSpeech = {
  id: string;
  duration: number;
  audioUrl: string | null;
  provider: 'placeholder';
};

export async function generateSpeech(input: GenerateSpeechInput): Promise<GeneratedSpeech> {
  const words = input.text.trim().split(/\s+/).filter(Boolean).length;
  const wordsPerMinute = 150 * input.speed;
  const duration = Math.max(4, Math.round((words / wordsPerMinute) * 60));

  await new Promise((resolve) => setTimeout(resolve, 700));

  return {
    id: `speech-${Date.now()}-${input.voice}-${Math.round(input.pitch * 100)}-${Math.round(input.volume * 100)}`,
    duration,
    audioUrl: null,
    provider: 'placeholder',
  };
}
