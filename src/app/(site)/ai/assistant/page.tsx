"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Breadcrumb from "@/components/Breadcrumb";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Mic, MicOff, Send, Volume2, VolumeX, Settings, X } from "lucide-react";
import {
  Button,
  Card,
  CardBody,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Slider,
  Spinner,
} from "@heroui/react";
import { cn } from "@/lib/utils";
import { appApiUrl } from "@/lib/journal";

type ThreadMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

const DISCLAIMER = "AI can make mistakes. Check important info. This is not therapy — in a crisis, call or text 988.";

const VOICES = [
  { id: "Joanna", label: "Joanna — English (US), Female" },
  { id: "Matthew", label: "Matthew — English (US), Male" },
  { id: "Amy", label: "Amy — English (UK), Female" },
  { id: "Emma", label: "Emma — English (UK), Female" },
  { id: "Stephen", label: "Stephen — English (US), Male" },
];

function clampSpeechRate(value: number) {
  return Math.min(2, Math.max(0.4, Math.round(value * 10) / 10));
}

export default function AssistantPage() {
  const { data: session, status } = useSession();
  const [prompt, setPrompt] = useState("");
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const submittingRef = useRef(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("Joanna");
  const [speechRate, setSpeechRate] = useState(1.0);
  const [isRecognitionSupported, setIsRecognitionSupported] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const submitRef = useRef<(voicePrompt?: string, event?: FormEvent) => Promise<void>>(async () => {});

  useEffect(() => {
    const SpeechRecognitionAPI = (globalThis as any).SpeechRecognition || (globalThis as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;
    setIsRecognitionSupported(true);
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      const spoken = event.results?.[0]?.[0]?.transcript || "";
      if (spoken) {
        setPrompt(spoken);
        submitRef.current(spoken);
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [thread, isLoading]);

  const lastAssistant = [...thread].reverse().find((item) => item.role === "assistant")?.text || "";

  const speakResponse = async (text: string) => {
    const clean = (text || "").replace(/<[^>]*>/g, " ").trim();
    if (!clean) {
      toast.error("Send a message first, then press volume to hear the reply.");
      return;
    }
    if (clean.includes("I could not complete that request")) {
      toast.error("There is no successful reply to speak yet.");
      return;
    }

    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(true);

      const response = await fetch(appApiUrl("/api/tts"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: clean, voice: selectedVoice, rate: speechRate }),
      });
      if (response.ok && response.headers.get("Content-Type")?.includes("audio")) {
        const audioUrl = URL.createObjectURL(await response.blob());
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
        };
        await audio.play();
        return;
      }

      if (typeof window !== "undefined" && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.rate = speechRate;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        return;
      }

      throw new Error("TTS request failed");
    } catch (error) {
      console.error(error);
      setIsSpeaking(false);
      toast.error("Could not play speech");
    }
  };

  const handleSubmit = async (voicePrompt?: string, event?: FormEvent) => {
    event?.preventDefault();
    if (submittingRef.current || isLoading) return;

    const finalPrompt = (voicePrompt || prompt).trim();
    if (!finalPrompt) {
      toast.error("Please enter a message");
      return;
    }
    if (status === "unauthenticated" || !session) {
      toast.error("Please sign in to chat");
      return;
    }

    submittingRef.current = true;
    const userMessage: ThreadMessage = { id: `u-${Date.now()}`, role: "user", text: finalPrompt };
    const assistantId = `a-${Date.now()}`;
    setThread((current) => [...current, userMessage, { id: assistantId, role: "assistant", text: "" }]);
    setPrompt("");
    setIsLoading(true);

    try {
      const response = await fetch(appApiUrl("/api/ai/zoe"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: finalPrompt }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const fullResponse = data.markdown || data.command || data.error || "";
      setThread((current) =>
        current.map((item) => (item.id === assistantId ? { ...item, text: fullResponse } : item)),
      );

      if (isSpeaking && fullResponse) {
        await speakResponse(fullResponse.replace(/<[^>]*>/g, ""));
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to process request");
      setThread((current) =>
        current.map((item) =>
          item.id === assistantId ? { ...item, text: "I could not complete that request. Please try again." } : item,
        ),
      );
    } finally {
      submittingRef.current = false;
      setIsLoading(false);
    }
  };
  submitRef.current = handleSubmit;

  const toggleMic = () => {
    if (!session || !recognitionRef.current) {
      toast.error("Voice input is not available");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    setIsListening(true);
    recognitionRef.current.start();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Breadcrumb pageTitle="AI Assistant" />
      <div className="container mx-auto px-4 py-8">
        <Card className="mx-auto flex min-h-[60vh] max-w-3xl flex-col border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-dark-6 sm:min-h-[70vh]">
          <CardBody className="flex flex-1 flex-col gap-4 p-0">
            <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <h2 className="text-lg font-semibold text-black dark:text-white">Journal assistant</h2>
                <p className="text-xs text-gray-600 dark:text-gray-400">Ask for a recap, a plan, or help with a next step. Uses your local AI through the hub connection.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button isIconOnly variant="flat" aria-label="Speak last reply" onPress={() => speakResponse(lastAssistant)}>
                  {isSpeaking ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
                <Button isIconOnly variant="flat" aria-label="Voice input" isDisabled={!isRecognitionSupported || !session} onPress={toggleMic}>
                  {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>
                <Button isIconOnly variant="flat" aria-label="Voice settings" onPress={() => setShowSettings(true)}>
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div ref={listRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {thread.length === 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white/60 p-4 text-center text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 sm:p-6">
                  Start a conversation. Scratch pad and extra text boxes are gone — just chat.
                </div>
              )}
              {thread.map((message) => (
                <div
                  key={message.id}
                  className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[90%] break-words rounded-2xl px-3 py-3 text-sm sm:max-w-[80%] sm:px-4",
                      message.role === "user"
                        ? "bg-black text-white"
                        : "border border-gray-200 bg-white text-black dark:border-white/10 dark:bg-white/5 dark:text-gray-100",
                    )}
                  >
                    {message.role === "assistant" && message.text.includes("<") ? (
                      <div dangerouslySetInnerHTML={{ __html: message.text || (isLoading ? "…" : "") }} />
                    ) : (
                      message.text || (isLoading ? "…" : "")
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Spinner size="sm" /> Thinking…
                </div>
              )}
            </div>

            <form className="border-t border-gray-200 px-4 py-4 dark:border-white/10 sm:px-5" onSubmit={(event) => void handleSubmit(undefined, event)}>
              <div className="flex items-end gap-2 sm:gap-3">
                <textarea
                  rows={2}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void handleSubmit();
                    }
                  }}
                  placeholder="What do you want to know?"
                  aria-label="What do you want to know?"
                  className="min-h-[52px] flex-1 resize-none rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-black placeholder:text-gray-500 shadow-none outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-400"
                />
                <Button
                  color="default"
                  className="min-w-11 bg-black px-3 text-white sm:min-w-20 sm:px-4"
                  type="button"
                  isDisabled={isLoading || status === "loading"}
                  isIconOnly
                  aria-label="Send"
                  onPress={() => void handleSubmit()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-3 text-center text-xs text-gray-500">{DISCLAIMER}</p>
            </form>
          </CardBody>
        </Card>
      </div>

      <Modal
        isOpen={showSettings}
        onOpenChange={setShowSettings}
        placement="center"
        backdrop="opaque"
        isDismissable
        closeButton={
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-dark-6 text-white">
            <X className="h-4 w-4" aria-hidden />
          </span>
        }
        classNames={{
          backdrop: "bg-black/80",
          base: "border border-white/15 bg-dark-6 text-white opacity-100",
          header: "pr-14 border-b border-white/10 text-white",
          body: "bg-dark-6 text-white py-6",
          footer: "border-t border-white/10 bg-dark-6",
          closeButton: "right-3 top-3 left-auto z-30 text-white hover:bg-white/10",
        }}
      >
        <ModalContent className="bg-dark-6">
          {(onClose) => (
            <>
              <ModalHeader className="text-white">Voice settings</ModalHeader>
              <ModalBody className="gap-8 bg-dark-6">
                <Slider
                  label="Speech rate"
                  step={0.1}
                  minValue={0.4}
                  maxValue={2}
                  value={speechRate}
                  getValue={(value) => `${Array.isArray(value) ? value[0] : value}x`}
                  onChange={(value) => {
                    const next = Array.isArray(value) ? value[0] : value;
                    if (typeof next === "number") setSpeechRate(clampSpeechRate(next));
                  }}
                  classNames={{
                    base: "max-w-full",
                    label: "text-sm text-white",
                    value: "text-sm text-white",
                    trackWrapper: "mt-2",
                    track: "h-2 bg-dark-2 border-s-0 border-x-0",
                    filler: "bg-black",
                    thumb: "h-5 w-5 bg-white border-2 border-black after:bg-white",
                    mark: "hidden",
                  }}
                />
                <div className="flex items-center gap-4">
                  <span className="w-14 shrink-0 text-sm font-medium text-white">Voice</span>
                  <Select
                    aria-label="Voice"
                    selectedKeys={new Set([selectedVoice])}
                    disallowEmptySelection
                    className="flex-1"
                    onSelectionChange={(keys) => {
                      const value = Array.from(keys)[0];
                      if (typeof value === "string" && value) setSelectedVoice(value);
                    }}
                    classNames={{
                      trigger: "h-12 bg-dark text-white data-[hover=true]:bg-dark-7",
                      value: "text-white",
                      popoverContent: "bg-dark-6 text-white border border-white/15",
                      listbox: "bg-dark-6 text-white",
                    }}
                  >
                    {VOICES.map((voice) => (
                      <SelectItem key={voice.id} textValue={voice.label} className="text-white data-[hover=true]:bg-dark">
                        {voice.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </ModalBody>
              <ModalFooter className="bg-dark-6">
                <Button variant="flat" onPress={onClose}>Close</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
