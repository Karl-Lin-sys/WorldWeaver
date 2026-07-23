import React, { useState, useRef } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';

interface ReadAloudButtonProps {
  text: string;
}

export function ReadAloudButton({ text }: ReadAloudButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const handlePlayStop = async () => {
    if (isPlaying) {
      sourceNodeRef.current?.stop();
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      
      const data = await res.json();
      if (!data.audio) throw new Error('No audio received');

      if (!audioContextRef.current) {
         audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      }

      // Convert base64 to array buffer
      const binaryString = atob(data.audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Decode audio (Wait, Gemini Live API output is raw PCM, but TTS standard might be encoded or raw.
      // The TTS example uses base64 and says "sample rate 24000". Wait, if it is raw PCM we need to decode manually.
      // Let's assume it is PCM since the example says "sample rate 24000" and Live API does. Wait, the example says:
      // "Return this base64 audio to the client for playback (sample rate 24000)"
      // Let's try raw PCM first, or wav. The `audio/wav` blob is safer.
      // Ah! The example doesn't show how to play it for TTS, only for Lyria.
      // But we can play raw PCM. I will use a simple Blob with audio/wav assuming it might be returned, or I can use the same code as Live API.
      
      // Wait, let's just make it a blob of type audio/pcm and let browser try to play, or we can use the AudioContext decodeAudioData if it has headers.
      // Actually, if it's raw PCM, it won't decode via decodeAudioData without WAV headers.
      // Let's add a WAV header just in case, or we can use the HTML Audio element with a data URI if we don't know.
      // Let's try decodeAudioData, if it fails, it's raw PCM.)
      
      let audioBuffer;
      try {
        audioBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer.slice(0));
      } catch (err) {
        // If it's raw PCM (16-bit little endian)
        const numSamples = bytes.length / 2;
        audioBuffer = audioContextRef.current.createBuffer(1, numSamples, 24000);
        const channelData = audioBuffer.getChannelData(0);
        const dataView = new DataView(bytes.buffer);
        for (let i = 0; i < numSamples; i++) {
          // Int16 to Float32 (-1.0 to 1.0)
          channelData[i] = dataView.getInt16(i * 2, true) / 32768;
        }
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsPlaying(false);
      source.start();
      sourceNodeRef.current = source;
      setIsPlaying(true);
    } catch (error) {
      console.error(error);
      alert('Failed to play audio');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePlayStop}
      disabled={isLoading}
      className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        isPlaying
          ? 'bg-red-50 text-red-700 hover:bg-red-100'
          : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
      }`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isPlaying ? (
        <>
          <VolumeX className="w-4 h-4" />
          <span>Stop reading</span>
        </>
      ) : (
        <>
          <Volume2 className="w-4 h-4" />
          <span>Read aloud</span>
        </>
      )}
    </button>
  );
}
