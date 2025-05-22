// src/app/(site)/ai/zoe/page.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import Breadcrumb from "@/components/Breadcrumb";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Mic, MicOff, Volume2, VolumeX, ChevronDown, Send, Mail, MessageSquare, Settings } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Countdown } from '@/components/Countdown';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure, 
  Slider,
  Tooltip,
  Spinner
} from "@heroui/react";
import VoiceSelectorPolly from '@/components/VoiceSelector/Polly';

type SpeechRecognitionEvent = {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
        confidence: number;
      };
    };
    length: number;
  };
};

type SpeechRecognitionErrorEvent = {
  error: string;
  message: string;
};

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

type SpeechRecognitionConstructor = {
  new (): SpeechRecognition;
};

declare global {
  var SpeechRecognition: SpeechRecognitionConstructor | undefined;
  var webkitSpeechRecognition: SpeechRecognitionConstructor | undefined;
}

interface Voice {
  id: string;
  gender: string;
  neural: boolean;
}

interface VoiceGroup {
  language: string;
  voices: Voice[];
}

interface VoiceData {
  [language: string]: VoiceGroup;
}

export default function AssistantPage() {
  const [prompt, setPrompt] = useState("");
  const [contextFiles, setContextFiles] = useState<string[]>([]);
  const [scratchPad, setScratchPad] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingText, setIsSendingText] = useState(false);
  const [transcript, setTranscript] = useState("");
  const { data: session } = useSession();
  const [showCountdown, setShowCountdown] = useState(false);
  const [isRecognitionSupported, setIsRecognitionSupported] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const isProcessingRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startingRef = useRef(false);

  const speechStateRef = useRef<{
    isStarting: boolean;
    currentUtterance: SpeechSynthesisUtterance | null;
  }>({
    isStarting: false,
    currentUtterance: null
  });

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Add state for voice selection
  const [selectedVoice, setSelectedVoice] = useState('Joanna');
  const [availableVoices, setAvailableVoices] = useState<VoiceData>({});

  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  const [speechRate, setSpeechRate] = useState(1.0); // 100% default speed

  // Add useEffect to fetch available voices
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await fetch('/api/tts');
        if (response.ok) {
          const data = await response.json();
          setAvailableVoices(data.voices);
        }
      } catch (error) {
        console.error('Failed to fetch voices:', error);
      }
    };

    fetchVoices();
  }, []);

  const initializeSpeechRecognition = () => {
    if (typeof window === 'undefined') {
      setIsRecognitionSupported(false);
      return null;
    }
    
    // Check if the browser supports speech recognition
    const SpeechRecognitionAPI = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      console.warn('Speech recognition is not supported in this browser');
      setIsRecognitionSupported(false);
      return null;
    }

    try {
      setIsRecognitionSupported(true);
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const currentTranscript = Array.from({ length: event.results.length }, (_, i) => 
          event.results[i][0].transcript
        ).join(' ');
        
        setTranscript(currentTranscript);

        // Only process final results and complete sentences
        const latestResult = event.results[event.results.length - 1];
        if (latestResult[0] && !isProcessingRef.current) {
          // Check if the transcript ends with sentence-ending punctuation
          const endsWithPunctuation = /[.!?]$/.test(currentTranscript.trim());
          if (endsWithPunctuation) {
            handleVoiceCommand(currentTranscript);
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === 'not-allowed') {
          console.error('Microphone access denied');
          toast.error("Microphone access denied");
          setIsListening(false);
        } else if (event.error === 'no-speech') {
          // Don't log or show error for no-speech, just restart if needed
          if (isListening && !document.hidden && !startingRef.current) {
            startingRef.current = true;
            setTimeout(() => {
              try {
                recognition.start();
              } catch (error) {
                console.error('Error restarting recognition:', error);
                setIsListening(false);
              } finally {
                startingRef.current = false;
              }
            }, 200);
          }
        } else if (event.error === 'aborted') {
          // Don't show error for intentional stops
          setIsListening(false);
        } else {
          // Only log and show errors for other unexpected issues
          console.error('Speech recognition error:', event.error);
          toast.error("Speech recognition error. Please try again.");
          setIsListening(false);
        }
        startingRef.current = false;
      };

      recognition.onend = () => {
        // Only try to restart if we're supposed to be listening and not currently starting
        if (isListening && !document.hidden && !startingRef.current) {
          startingRef.current = true;
          setTimeout(() => {
            try {
              recognition.start();
            } catch (error) {
              // Only log restart errors if they're not due to already listening
              if (!(error instanceof Error) || !error.message.includes('already started')) {
                console.error('Error restarting recognition:', error);
              }
              setIsListening(false);
            } finally {
              startingRef.current = false;
            }
          }, 200);
        } else {
          setIsListening(false);
        }
      };

      return recognition;
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
      setIsRecognitionSupported(false);
      return null;
    }
  };

  useEffect(() => {
    const processTranscript = async () => {
      if (transcript && !isProcessingRef.current && /[.!?]$/.test(transcript.trim())) {
        await handleVoiceCommand(transcript);
      }
    };

    processTranscript();
  }, [transcript, session]);

  useEffect(() => {
    let mounted = true;

    const initializeAudio = async () => {
      try {
        // Initialize audio context for voice activity detection
        if (typeof window !== 'undefined') {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        // Initialize speech recognition
        recognitionRef.current = initializeSpeechRecognition();

        // Request microphone permission early
        if (session && mounted && recognitionRef.current) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (stream) {
              stream.getTracks().forEach(track => track.stop()); // Stop the stream after permission check
            }
          } catch (error) {
            console.error('Microphone permission denied:', error);
            toast.error("Please allow microphone access to use voice commands");
          }
        }
      } catch (error) {
        console.error('Error initializing audio:', error);
        setIsRecognitionSupported(false);
      }
    };

    initializeAudio();

    return () => {
      mounted = false;
      stopListening();
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [session]);

  const startListening = async () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported in your browser");
      return;
    }

    if (speechStateRef.current.isStarting) {
      return;
    }

    speechStateRef.current.isStarting = true;

    try {
      // Stop any existing streams
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Get new stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Make sure recognition is stopped
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore stop errors
      }

      // Wait for previous recognition to fully stop
      await new Promise(resolve => setTimeout(resolve, 200));

      try {
        recognitionRef.current.start();
        setIsListening(true);
        setTranscript("");
      } catch (error) {
        if (!(error instanceof Error) || !error.message.includes('already started')) {
          console.error('Error starting recognition:', error);
          toast.error("Failed to start voice input");
          setIsListening(false);
        }
      }
    } catch (error) {
      console.error('Error starting voice input:', error);
      toast.error("Failed to access microphone");
      setIsListening(false);
    } finally {
      speechStateRef.current.isStarting = false;
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current || startingRef.current) {
      return;
    }

    try {
      recognitionRef.current.stop();
    } catch (e) {
      // Ignore errors from stopping
    }
    
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsListening(false);
    setTranscript("");
  };

  const handleVoiceCommand = async (transcript: string) => {
    if (!transcript.trim()) return;
    
    if (!session) {
      toast.error("Please sign in to use voice commands");
      stopListening();
      return;
    }
    
    try {
      isProcessingRef.current = true;
      setPrompt(transcript);

      const response = await fetch("/api/ai/zoe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: transcript,
        }),
      });

      if (response.status === 401) {
        toast.error("Please sign in to continue");
        stopListening();
        return;
      }

      setShowCountdown(true);
      
      // Read the response as a readable stream
      const reader = response.body?.getReader();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          // Convert the Uint8Array to text
          const chunk = new TextDecoder().decode(value);
          try {
            const data = JSON.parse(chunk);
            if (data.markdown) {
              fullResponse = data.markdown;
              setResponse(fullResponse);
            }
          } catch (e) {
            console.error('Error parsing chunk:', e);
          }
        }
      } else {
        // Fallback for browsers that don't support streaming
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        fullResponse = data.markdown;
        setResponse(data.markdown);
      }

      setShowCountdown(false);
      
      if (fullResponse) {
        try {
          if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current = null;
            setIsSpeaking(false);
          }
          await speakResponse(fullResponse);
        } catch (error) {
          console.error('TTS error with the handleVoiceCommand:', error);
        }
      }

    } catch (error) {
      if (error instanceof Error && error.message === 'Cancelled by user') {
        console.log('Voice command cancelled by user');
      } else {
        console.error('Error processing voice command:', error);
        toast.error("Failed to process voice command. Please try again.");
      }
      stopListening();
    } finally {
      isProcessingRef.current = false;
      setTranscript("");
      if (!isListening && session) {
        startListening();
      }
    }
  };

  const speakResponse = async (text: string) => {
    if (!text) return;

    try {
      // Stop any existing audio playback
      if (currentAudioRef.current) {
        console.log('Stopping current audio playback');
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }

      setIsSpeaking(true);
      console.log('Starting TTS request...');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text,
          voice: selectedVoice 
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('TTS response received:', {
        status: response.status,
        contentType: response.headers.get('Content-Type')
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('TTS error response:', errorData);
        if (response.status === 503) {
          toast.error(errorData.error);
          console.error('TTS installation required:', errorData.details);
          return;
        }
        throw new Error(errorData.error || 'TTS request failed');
      }

      // Check content type to determine how to handle the response
      const contentType = response.headers.get('Content-Type');
      console.log('Response content type:', contentType);

      if (contentType?.includes('audio')) {
        const audioBlob = await response.blob();
        console.log('Audio blob created, size:', audioBlob.size, 'bytes');
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;

        // Start loading the audio immediately
        console.log('Loading audio...');
        audio.load();

        // Set up event handlers
        const playAudio = () => {
          console.log('Audio loaded, starting playback');
          const playPromise = audio.play();
          if (playPromise) {
            playPromise.catch(error => {
              console.error('Audio play error:', error);
              setIsSpeaking(false);
              toast.error('Failed to play audio. Please try again.');
            });
          }
        };

        audio.oncanplaythrough = playAudio;
        audio.onended = () => {
          console.log('Audio playback completed');
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
        };

        audio.onerror = (e) => {
          console.error('Audio error:', e);
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
          toast.error('Failed to play audio');
        };

        // Add volume and playback monitoring
        audio.onvolumechange = () => {
          console.log('Volume changed:', audio.volume);
        };

        audio.onpause = () => {
          console.log('Audio paused');
        };

        audio.onplay = () => {
          console.log('Audio started playing');
        };

      } else {
        // Handle error response
        const errorData = await response.json();
        console.error('Unexpected response type:', errorData);
        throw new Error(errorData.error || 'TTS request failed');
      }

    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('TTS request timed out');
          toast.error('Speech generation timed out. Please try again.');
        } else {
          console.error('TTS error:', error);
          toast.error(error.message || 'Failed to generate speech');
        }
      } else {
        console.error('Unknown TTS error:', error);
        toast.error('Failed to generate speech');
      }
      setIsSpeaking(false);
      if (currentAudioRef.current) {
        currentAudioRef.current = null;
      }
    }
  };

  const toggleSpeaking = () => {
    if (isSpeaking && currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setIsSpeaking(false);
    } else if (response) {
      // If there's a response but we're not speaking, try speaking it again
      speakResponse(response);
    }
  };

  const handleSubmit = async (voicePrompt?: string) => {
    try {
      const finalPrompt = voicePrompt || prompt;
      if (!finalPrompt.trim()) {
        toast.error("Please enter a message");
        return;
      }

      setIsLoading(true);
      setShowCountdown(true);
      
      // Update to handle streaming response
      const response = await fetch("/api/ai/zoe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: finalPrompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      // Read the response as a readable stream
      const reader = response.body?.getReader();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          // Convert the Uint8Array to text
          const chunk = new TextDecoder().decode(value);
          try {
            const data = JSON.parse(chunk);
            if (data.markdown) {
              fullResponse = data.markdown;
              setResponse(fullResponse);
            }
          } catch (e) {
            console.error('Error parsing chunk:', e);
          }
        }
      } else {
        // Fallback for browsers that don't support streaming
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        fullResponse = data.markdown;
        setResponse(data.markdown);
      }

      setShowCountdown(false);
      
      if (isSpeaking && fullResponse) {
        await speakResponse(fullResponse);
      }

      setPrompt("");
      setTranscript("");
      
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to process request");
    } finally {
      setIsLoading(false);
      setShowCountdown(false);
    }
  };

  const handleMicToggle = async () => {
    if (!session) {
      toast.error("Please sign in to use voice commands");
      return;
    }

    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported in your browser");
      return;
    }

    if (isListening) {
      stopListening();
      // Also stop speaking when mic is turned off
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    } else {
      await startListening();
    }
  };

  const [emailSent, setEmailSent] = useState(false);
  const [textSent, setTextSent] = useState(false);

  const handleSendEmail = async () => {
    if (!response) {
      toast.error("No message to send. Please generate a response first.");
      return;
    }

    try {
      setIsSendingEmail(true);
      setEmailSent(false);
      const res = await fetch("/api/messages/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: response,
          subject: "Message from Zoe",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to send email");
      }

      setEmailSent(true);
      toast.success("Email sent! Check your inbox for the message.");
      // Clear email sent status after 3 seconds
      setTimeout(() => setEmailSent(false), 3000);
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Failed to send email. Please try again later.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendText = async () => {
    if (!response) {
      toast.error("No message to send. Please generate a response first.");
      return;
    }

    try {
      setIsSendingText(true);
      setTextSent(false);
      const res = await fetch("/api/messages/text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: response,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send text");
      }

      setTextSent(true);
      toast.success(data.message || "Text message sent! Check your phone for the message.");
      // Clear text sent status after 3 seconds
      setTimeout(() => setTextSent(false), 3000);
    } catch (error) {
      console.error("Error sending text:", error);
      const message = error instanceof Error ? error.message : "Failed to send text";
      toast.error(message + ". Please try again later.");
    } finally {
      setIsSendingText(false);
    }
  };

  // Add state for countdown handlers
  const [countdownHandlers, setCountdownHandlers] = useState({
    onComplete: () => {},
    onCancel: () => {}
  });

  // Update prepareSSML to use the speech rate
  const prepareSSML = (text: string): string => {
    text = text.replace(/<[^>]*>/g, '');
    text = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
    
    return `<speak><prosody rate="${speechRate * 100}%">${text}</prosody></speak>`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Breadcrumb
        pageTitle="AI Assistant"
        items={[
          { label: "AI", href: "/ai" },
          { label: "Assistant", href: "/ai/assistant" }
        ]}
      />

      <div className="w-full px-4 sm:px-8 py-8">
        <div className="grid gap-8 md:grid-cols-[40%_60%] px-10">
          <Card className="p-6 bg-card text-card-foreground shadow-lg border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-primary">AI Assistant</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Ask any question or request assistance. The AI will respond with helpful, accurate information.
            </p>

            {transcript && (
              <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                <p className="text-sm font-medium text-primary">Listening:</p>
                <p className="text-sm text-muted-foreground">{transcript}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2 text-primary">Context Files</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Add file paths or content that provides additional context for the AI's responses. 
                  This helps the assistant understand specific documents or references you want to discuss.
                </p>
                <Textarea
                  placeholder="Add context files here..."
                  value={contextFiles.join("\n")}
                  onChange={(e) => setContextFiles(e.target.value.split("\n"))}
                  className="min-h-[100px] dark:bg-background light:text-dark dark:text-foreground placeholder:text-black/60 dark:placeholder:text-white/60"
                />
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2 text-primary">Scratch Pad</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Use this area for temporary notes or additional information you want to reference 
                  during your conversation. This content persists across interactions.
                </p>
                <Textarea
                  placeholder="Add notes or temporary content here..."
                  value={scratchPad}
                  onChange={(e) => setScratchPad(e.target.value)}
                  className="min-h-[100px] dark:bg-background light:text-dark dark:text-foreground placeholder:text-black/60 dark:placeholder:text-white/60"
                />
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2 text-primary">Text Input</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Type your questions or requests here, or use voice commands. 
                  Your voice input will appear here automatically.
                </p>
                <Textarea
                  placeholder="Ask a question or request assistance..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[100px] dark:bg-background light:text-dark dark:text-foreground placeholder:text-black/60 dark:placeholder:text-white/60"
                />
              </div>

              <Button 
                onClick={() => handleSubmit()}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={!session || isLoading}
              >
                {!session ? "Please sign in to continue" : isLoading ? "Processing..." : "Send Request"}
              </Button>
            </div>
          </Card>

          <Card className="p-6 bg-card text-card-foreground shadow-lg border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-primary">Response</h2>
              {(isLoading || isSpeaking || isSendingEmail || isSendingText || emailSent || textSent) && (
                <div className="animate-pulse-blue bg-blue-900/50 dark:bg-blue-900/50 text-blue-100 dark:text-blue-100 px-4 py-1.5 rounded-md text-sm font-medium border border-blue-800 dark:border-blue-800">
                  {isLoading ? "AI is thinking..." : 
                  isSpeaking ? "Speaking..." :
                  isSendingEmail ? "Sending email..." :
                  isSendingText ? "Sending text..." :
                  emailSent ? "Email sent successfully!" :
                  textSent ? "Text sent successfully!" : null}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleSpeaking}
                  className={cn(
                    "border-primary hover:bg-primary/10",
                    isSpeaking && "bg-primary/20"
                  )}
                  title={isSpeaking ? "Stop Speaking" : "Speak Response"}
                >
                  {isSpeaking ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleMicToggle}
                  disabled={!isRecognitionSupported || !session}
                  className={cn(
                    "border-primary hover:bg-primary/10",
                    isListening && "bg-primary/20",
                    (!isRecognitionSupported || !session) && "opacity-50 cursor-not-allowed"
                  )}
                  title={
                    !session 
                      ? "Please sign in to use voice commands" 
                      : !isRecognitionSupported 
                        ? "Speech recognition is not supported in your browser" 
                        : isListening 
                          ? "Stop Listening" 
                          : "Start Listening"
                  }
                >
                  {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onOpen}
                  className="border-primary hover:bg-primary/10"
                  title="Settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mb-4 dark:bg-dark bg-white light:text-dark dark:text-foreground">
              <VoiceSelectorPolly onVoiceChange={(voice) => {
                setSelectedVoice(voice.id);
                if (response && isSpeaking) {
                  speakResponse(response);
                }
              }} />
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              <span className="text-black dark:text-white">
                The AI's responses will appear here. You can use the volume button to hear the response 
                spoken aloud, or click it again to replay the last response. The response will include 
                explanations as appropriate.
              </span>
            </p>
            
            <div className="border rounded-lg p-4 bg-muted min-h-[200px] overflow-auto">
              <div 
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: response || '<span class="text-muted-foreground">AI response will appear here...</span>'
                }}
              />
            </div>
          </Card>
        </div>
      </div>

      <Countdown 
        isActive={showCountdown}
        onComplete={countdownHandlers.onComplete}
        onCancel={countdownHandlers.onCancel}
      />

      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange}
        placement="center"
        hideCloseButton
        className="dark:bg-dark bg-white p-4"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col text-xl gap-1 px-6 py-4 dark:text-zinc-100 text-zinc-900 border-b dark:border-zinc-700 border-zinc-200">
                Voice Settings
              </ModalHeader>
              <ModalBody className="px-6 py-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4 dark:text-zinc-100 text-zinc-900">Speech Rate</h3>
                    <div className="w-full max-w-md pb-3">
                      <Slider
                        size="lg"
                        step={0.1}
                        color="primary"
                        label="Speed"
                        showTooltip
                        defaultValue={speechRate}
                        value={speechRate}
                        onChange={(value: number | number[]) => {
                          const newValue = Array.isArray(value) ? value[0] : value;
                          requestAnimationFrame(() => setSpeechRate(newValue));
                        }}
                        minValue={0.4}
                        maxValue={2.0}
                        marks={[
                          { value: 0.5, label: "50%" },
                          { value: 1.0, label: "100%" },
                          { value: 1.5, label: "150%" },
                          { value: 2.0, label: "200%" }
                        ]}
                        formatOptions={{ style: "percent" }}
                        classNames={{
                          base: "gap-3",
                          track: "bg-default-500/30 dark:bg-zinc-700",
                          filler: "bg-primary dark:bg-purple-500",
                          thumb: "bg-primary dark:bg-purple-900 shadow-lg w-6 h-6 py-5 rounded",
                          mark: "bg-primary dark:bg-secondary pt-6",
                        }}
                      />
                    </div>
                  </div>

                  <div className="border-t dark:border-zinc-700 border-zinc-200 my-6 pt-4"></div>

                  <div>
                    <h3 className="text-xl font-medium mb-4 dark:text-zinc-100 text-zinc-900">Available Voices</h3>
                    <div className="grid gap-4 max-h-[300px] overflow-y-auto">
                      {Object.entries(availableVoices).map(([language, data]) => (
                        <div key={language} className="space-y-2">
                          <h4 className="font-semibold dark:text-zinc-100 text-zinc-900 border-b dark:border-zinc-700 border-zinc-200 pb-2">{language}</h4>
                          <div className="grid gap-2">
                            {data.voices.map((voice) => (
                              <button
                                key={voice.id}
                                onClick={() => {
                                  setSelectedVoice(voice.id);
                                  if (response && isSpeaking) {
                                    speakResponse(response);
                                  }
                                }}
                                className={cn(
                                  "flex items-center justify-between p-2 rounded-lg",
                                  selectedVoice === voice.id 
                                    ? "dark:bg-zinc-700/50 bg-zinc-100" 
                                    : "dark:hover:bg-zinc-800 hover:bg-zinc-50",
                                  "dark:text-zinc-100 text-zinc-900"
                                )}
                              >
                                <span className="font-medium">{voice.id}</span>
                                <span className="text-sm dark:text-zinc-400 text-zinc-500">
                                  {voice.gender} {voice.neural ? "• Neural" : ""}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1 dark:bg-zinc-800 bg-zinc-100 dark:hover:bg-zinc-700 hover:bg-zinc-200 dark:text-zinc-100 text-zinc-900"
                      onClick={() => {
                        handleSendEmail();
                        onClose();
                      }}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email Response
                    </Button>
                    <Button
                      className="flex-1 dark:bg-zinc-800 bg-zinc-100 dark:hover:bg-zinc-700 hover:bg-zinc-200 dark:text-zinc-100 text-zinc-900"
                      onClick={() => {
                        handleSendText();
                        onClose();
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Text Response
                    </Button>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button 
                  className="dark:bg-zinc-800 bg-zinc-100 dark:hover:bg-zinc-700 hover:bg-zinc-200 dark:text-zinc-100 text-zinc-900"
                  onClick={onClose}
                >
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
} 