/**
 * Meetings Page Component
 * 
 * This component handles the real-time meeting recording, transcription, and RAID analysis.
 * It uses the Web Speech API for voice recognition and integrates with LLaMA for analysis.
 * 
 * Key Features:
 * - Real-time speech-to-text transcription
 * - Speaker management with color coding
 * - RAID (Risks, Actions, Issues, Dependencies) analysis
 * - Auto-save functionality
 * - Meeting history viewing
 * - Summary email generation
 */

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, Edit2, Send, Save, Trash2, History, ArrowLeft, Mail } from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { Button } from '@/components/ui/button';
import { Divider, Slider } from '@nextui-org/react';

/**
 * Speaker Interface
 * Represents a meeting participant with unique identification and styling
 */
interface Speaker {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  color: string;
  voiceProfile?: string;
}

/**
 * TranscriptSegment Interface
 * Represents a single speech segment in the meeting transcript
 */
interface TranscriptSegment {
  id: string;
  speakerId: string;
  text: string;
  timestamp: Date;
  isEditing: boolean;
}

/**
 * RiskItem Interface
 * Represents a risk entry in the RAID analysis with mitigation strategy
 */
interface RiskItem {
  risk: string;
  mitigation: string;
}

/**
 * MeetingAnalysis Interface
 * Comprehensive structure for RAID analysis including all categories
 */
interface MeetingAnalysis {
  risks: RiskItem[];
  issues: string[];
  actions: string[];
  dependencies: string[];
  decisions: string[];
  followups: string[];
  summary: string;
}

interface Meeting {
  id: string;
  title: string;
  created_at: string;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

export default function MeetingsPage() {
  // Authentication and routing state
  const { data: session, status } = useSession();
  const router = useRouter();

  // Core meeting state
  const [isRecording, setIsRecording] = useState(false);
  const [meetingEnded, setMeetingEnded] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  // Participant and content state
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [analysis, setAnalysis] = useState<MeetingAnalysis>({
    risks: [],
    issues: [],
    actions: [],
    dependencies: [],
    decisions: [],
    followups: [],
    summary: ''
  });

  // UI and loading state
  const [isLoading, setIsLoading] = useState(true);
  const [viewingHistory, setViewingHistory] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<string | null>(null);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [saveInterval, setSaveInterval] = useState<number>(30); // in seconds

  // Refs for speech recognition and voice profiles
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const voiceProfilesRef = useRef<Map<string, string>>(new Map());
  const nameDetectionTimeout = useRef<NodeJS.Timeout | null>(null);

  /**
   * Loads all meetings for the current user
   * - Fetches meeting list from API
   * - Updates meetings state
   * - Handles loading state
   */
  const loadMeetings = async () => {
    try {
      const response = await fetch('/api/admin/meetings');
      if (!response.ok) throw new Error('Failed to load meetings');
      const data = await response.json();
      setMeetings(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading meetings:', error);
      setIsLoading(false);
    }
  };

  // Authentication effect
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      loadMeetings();
    }
  }, [status, router]);

  /**
   * Ends the current meeting
   * - Stops recording
   * - Gets final LLaMA analysis
   * - Updates meeting record
   * - Enables summary email sending
   */
  const endMeeting = async () => {
    if (!meetingId) return;

    try {
      // Stop recording
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsRecording(false);
      }

      // Get LLaMA analysis
      const llamaResponse = await fetch('/api/llama/analyze_meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcript,
          analysis: analysis
        })
      });

      if (!llamaResponse.ok) {
        throw new Error('Failed to get LLaMA analysis');
      }

      const llamaData = await llamaResponse.json();
      
      // Update meeting record with LLaMA summary and mark as ended
      const response = await fetch(`/api/admin/meetings/${meetingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: meetingId,
          llama_summary: llamaData.summary,
          status: 'ended',
          rais_analysis: llamaData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update meeting');
      }

      setMeetingEnded(true);
      alert('Meeting ended successfully. You can now send the summary email.');
    } catch (error) {
      console.error('Error ending meeting:', error);
      alert(error instanceof Error ? error.message : 'Failed to end meeting. Please try again.');
    }
  };

  /**
   * Starts a new meeting
   * - Creates meeting record
   * - Initializes recording
   * - Sets up real-time analysis
   */
  const startNewMeeting = async () => {
    try {
      const response = await fetch('/api/admin/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: meetingTitle || 'Untitled Meeting',
          transcript: [],
          speakers: speakers,
          analysis: analysis
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create meeting');
      }

      const meeting = await response.json();
      setMeetingId(meeting.id);
      setIsRecording(true);
      startRecording();
    } catch (error) {
      console.error('Error creating meeting:', error);
      alert('Failed to create meeting. Please try again.');
    }
  };

  /**
   * Loads an existing meeting
   * - Fetches meeting data
   * - Sets up UI state
   * - Handles meeting status
   */
  const loadMeeting = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/meetings/${id}`);
      if (!response.ok) throw new Error('Failed to load meeting');
      const data = await response.json();
      
      setMeetingId(data.id);
      setMeetingTitle(data.title);
      setSpeakers(data.speakers || []);
      setTranscript(data.transcript || []);
      setAnalysis(data.rais_analysis || {
        risks: [],
        issues: [],
        summary: '',
        decisions: [],
        actionItems: [],
        assumptions: [],
        dependencies: [],
        requirements: []
      });
      setSelectedMeeting(id);
      setIsRecording(false);
      if (data.status === 'ended') {
        setMeetingEnded(true);
      }
    } catch (error) {
      console.error('Error loading meeting:', error);
      alert('Failed to load meeting');
    }
  };

  /**
   * Saves current meeting state
   * - Updates meeting record
   * - Handles auto-save functionality
   */
  const saveMeeting = async () => {
    if (!meetingId) return;

    try {
      const response = await fetch(`/api/admin/meetings/${meetingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: meetingTitle,
          speakers: speakers,
          transcript: transcript,
          rais_analysis: analysis
        }),
      });

      if (!response.ok) throw new Error('Failed to save meeting');
      setLastSaveTime(new Date());
    } catch (error) {
      console.error('Error saving meeting:', error);
    }
  };

  /**
   * Initializes and manages speech recognition
   * - Sets up Web Speech API
   * - Handles recognition events
   * - Manages error recovery
   */
  const startRecording = () => {
    if (!recognitionRef.current) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.addEventListener('start', function(this: SpeechRecognition) {
        console.log('Speech recognition started');
        setIsRecording(true);
      });

      recognition.addEventListener('end', function(this: SpeechRecognition) {
        console.log('Speech recognition ended');
        // Automatically restart if we're still supposed to be recording
        if (isRecording && this) {
          console.log('Restarting speech recognition...');
          this.start();
        }
      });

      recognition.addEventListener('error', function(this: SpeechRecognition, event: Event) {
        const errorEvent = event as SpeechRecognitionErrorEvent;
        const errorMessage = errorEvent.error || 'Unknown error';
        console.error('Speech recognition error:', errorMessage);
        
        // Handle specific error types
        switch (errorMessage) {
          case 'no-speech':
            // No speech detected - normal case, just restart
            if (!meetingEnded && isRecording && this) {
              console.log('No speech detected, continuing recording...');
              this.start();
            }
            break;
          case 'network':
            // Network error - wait longer before retry
            if (!meetingEnded && isRecording && this) {
              console.log('Network error, retrying in 3 seconds...');
              setTimeout(() => this.start(), 3000);
            }
            break;
          case 'aborted':
            // Intentionally stopped - do nothing
            console.log('Recognition aborted');
            break;
          default:
            // Other errors - try to restart after delay
            if (!meetingEnded && isRecording && this) {
              console.log(`Error: ${errorMessage}, retrying in 1 second...`);
              setTimeout(() => {
                if (this && isRecording) {
                  this.start();
                }
              }, 1000);
            }
        }
      });

      recognition.addEventListener('result', ((event: Event) => {
        const speechEvent = event as SpeechRecognitionEvent;
        const lastResult = speechEvent.results[speechEvent.results.length - 1];
        if (lastResult.isFinal) {
          const text = lastResult[0].transcript.trim();
          if (text) {
            const newSegment: TranscriptSegment = {
              id: crypto.randomUUID(),
              speakerId: speakers[0]?.id || '',
              text: text,
              timestamp: new Date(),
              isEditing: false
            };
            setTranscript(prev => [...prev, newSegment]);
          }
        }
      }) as EventListener);

      recognitionRef.current = recognition;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error('Error starting recognition:', error);
      // If it fails to start, try stopping first then starting again
      try {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          setTimeout(() => {
            if (recognitionRef.current) {
              recognitionRef.current.start();
            }
          }, 100);
        }
      } catch (retryError) {
        console.error('Error on retry:', retryError);
        setIsRecording(false);
        alert('Failed to start speech recognition. Please try again.');
      }
    }
  };

  /**
   * Stops current recording session
   * - Cleans up recognition
   * - Updates UI state
   */
  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
    setIsRecording(false);
  };

  // Add cleanup for event listeners
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          const recognition = recognitionRef.current;
          recognition.removeEventListener('start', () => {});
          recognition.removeEventListener('end', () => {});
          recognition.removeEventListener('error', () => {});
          recognition.removeEventListener('result', () => {});
          recognition.stop();
        } catch (error) {
          console.error('Error cleaning up recognition:', error);
        }
      }
    };
  }, []);

  const addSpeaker = () => {
    const id = Date.now().toString();
    const newSpeaker: Speaker = {
      id,
      name: `Speaker ${speakers.length + 1}`,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
    };
    setSpeakers(prev => [...prev, newSpeaker]);
  };

  const updateSpeaker = (id: string, updates: Partial<Speaker>) => {
    setSpeakers(prev => prev.map(speaker => 
      speaker.id === id ? { ...speaker, ...updates } : speaker
    ));
  };

  const deleteSpeaker = (id: string) => {
    setSpeakers(prev => prev.filter(speaker => speaker.id !== id));
  };

  const updateTranscriptSegment = (id: string, updates: Partial<TranscriptSegment>) => {
    setTranscript(prev => prev.map(segment =>
      segment.id === id ? { ...segment, ...updates } : segment
    ));
  };

  const deleteTranscriptSegment = (id: string) => {
    setTranscript(prev => prev.filter(segment => segment.id !== id));
  };

  const updateAnalysis = (field: keyof MeetingAnalysis, value: string[] | RiskItem[]) => {
    setAnalysis(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Auto-save functionality
  useEffect(() => {
    if (meetingId) {
      const interval = setInterval(saveMeeting, saveInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [meetingId, transcript, analysis, speakers, meetingTitle, saveInterval]);

  // Add real-time RAID analysis
  const updateRaidAnalysis = async () => {
    if (!transcript.length || meetingEnded) return;

    try {
      const response = await fetch('/api/llama/analyze_meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcript,
          analysis: analysis
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update RAID analysis');
      }

      const updatedAnalysis = await response.json();
      setAnalysis(updatedAnalysis);
    } catch (error) {
      console.error('Error updating RAID analysis:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Add real-time analysis updates
  useEffect(() => {
    if (isRecording) {
      const raidInterval = setInterval(updateRaidAnalysis, 5000);
      return () => clearInterval(raidInterval);
    }
  }, [isRecording, transcript, analysis]);

  // Function to send summary email
  const sendSummaryEmail = async (meetingId: string) => {
    try {
      const response = await fetch(`/api/admin/meetings/send-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ meetingId }),
      });

      if (!response.ok) {
        throw new Error('Failed to send summary email');
      }

      alert('Summary email sent successfully!');
    } catch (error) {
      console.error('Error sending summary email:', error);
      alert('Failed to send summary email. Please try again.');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Breadcrumb 
        pageTitle="Meetings"
        items={[
          { label: 'Admin Console', href: '/admin-console' },
          { label: 'Meetings', href: '/admin-console/meetings' }
        ]} 
      />

      {viewingHistory ? (
        <div>
          <button
            onClick={() => setViewingHistory(false)}
            className="flex items-center mb-4 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Recording
          </button>
          <h2 className="text-2xl font-bold mb-4">Meeting History</h2>
          <div className="space-y-4">
            {meetings.map(meeting => (
              <div
                key={meeting.id}
                className="p-4 border rounded hover:bg-gray-50 cursor-pointer"
                onClick={() => loadMeeting(meeting.id)}
              >
                <h3 className="font-semibold">{meeting.title}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(meeting.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1">
              <input
                type="text"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="Meeting Title"
                className="w-full p-2 border rounded bg-transparent h-[40px]"
              />
            </div>
            <div className="flex space-x-4 ml-4">
              <Button
                onClick={() => setViewingHistory(true)}
                className="flex items-center px-4 py-2 border rounded light:bg-background hover:bg-gray-50 h-[40px]"
              >
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
              {!meetingEnded ? (
                !isRecording ? (
                  <Button
                    onClick={startNewMeeting}
                    className="flex items-center px-4 py-2 border rounded bg-background text-white rounded hover:bg-blue-700 h-[40px]"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Start Recording
                  </Button>
                ) : (
                  <Button
                    onClick={stopRecording}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 h-[40px]"
                  >
                    <MicOff className="w-4 h-4 mr-2" />
                    Stop Recording
                  </Button>
                )
              ) : (
                <div className="text-gray-500">Meeting Ended</div>
              )}
              {meetingId && (
                <>
                  <Button
                    onClick={endMeeting}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 h-[40px]"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    End Meeting
                  </Button>
                  <Button
                    onClick={() => sendSummaryEmail(meetingId)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 h-[40px]"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Speakers Panel */}
            <div className="rounded p-2 col-span-3 h-[110px]">
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-xl font-bold">Speakers</h2>
                <Button
                  onClick={addSpeaker}
                  className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 h-[30px]"
                >
                  Add Speaker
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-1 h-[52px] overflow-y-auto">
                {speakers.map(speaker => (
                  <div key={speaker.id} className="flex items-center gap-1 p-1 border rounded h-[24px]">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: speaker.color }}
                    />
                    <input
                      type="text"
                      value={speaker.name}
                      onChange={(e) => updateSpeaker(speaker.id, { name: e.target.value })}
                      className="flex-1 p-0.5 border rounded text-sm w-full min-w-0 h-[18px] bg-transparent"
                    />
                    <Button
                      onClick={() => deleteSpeaker(speaker.id)}
                      className="text-red-600 hover:text-red-800 flex-shrink-0 p-0.5 h-[18px]"
                    >
                      <Trash2 className="w-2 h-2" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Transcript Panel */}
            <div className=" rounded p-2 col-span-3">
              <h2 className="text-xl font-bold mb-1">Transcript</h2>
              <div className="space-y-1 h-[calc(100vh-500px)] overflow-y-auto">
                {transcript.map(segment => (
                  <div key={segment.id} className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">
                        {new Date(segment.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="font-semibold">
                        {speakers.find(s => s.id === segment.speakerId)?.name}:
                      </span>
                    </div>
                    {segment.isEditing ? (
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={segment.text}
                          onChange={(e) => updateTranscriptSegment(segment.id, { text: e.target.value })}
                          className="flex-1 p-1 bg-transparent border rounded text-sm"
                        />
                        <Button
                          onClick={() => updateTranscriptSegment(segment.id, { isEditing: false })}
                          className="text-green-600 bg-transparent hover:text-green-800"
                        >
                          <Save className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-start gap-1">
                        <p className="flex-1 text-sm break-words">{segment.text}</p>
                        <Button
                          onClick={() => updateTranscriptSegment(segment.id, { isEditing: true })}
                          className="text-blue-600 bg-transparent hover:text-blue-800"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={() => deleteTranscriptSegment(segment.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* RAID Analysis */}
            <div className="col-span-3 mt-2">
              <h2 className="text-xl font-bold mb-2">RAID Analysis</h2>
              <div className="grid grid-cols-3 gap-4">
                {/* RAID Categories */}
                <div className="grid grid-cols-3 gap-4 col-span-3">
                  {[
                    { key: 'risks', label: 'Risks' },
                    { key: 'actions', label: 'Actions' },
                    { key: 'issues', label: 'Issues' },
                    { key: 'dependencies', label: 'Dependencies' },
                    { key: 'decisions', label: 'Decisions' },
                    { key: 'followups', label: 'Follow-ups' }
                  ].map(({ key, label }) => (
                    <div key={key} className="border rounded p-2">
                      <h3 className="font-semibold text-sm mb-2">{label}</h3>
                      <Divider className="my-2" />
                      <div className="flex flex-row max-w-md h-full gap-6 w-full">
                        <Slider
                          aria-label={`${label} confidence`}
                          defaultValue={20}
                          maxValue={100}
                          minValue={0}
                          orientation="vertical"
                          className="h-[200px]"
                        />
                        <div className="flex-1 space-y-2 max-h-[200px] overflow-y-auto">
                          {key === 'risks' ? (
                            // Risks section with risk and mitigation fields
                            <>
                              {analysis.risks?.map((item: RiskItem, index: number) => (
                                <div key={index} className="flex flex-col gap-1">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={item.risk || ''}
                                      onChange={(e) => {
                                        const newValue = [...(analysis.risks || [])];
                                        newValue[index] = { ...newValue[index], risk: e.target.value };
                                        updateAnalysis('risks', newValue);
                                      }}
                                      placeholder="Risk"
                                      className="flex-1 p-1 border rounded text-sm bg-transparent"
                                    />
                                    <Button
                                      onClick={() => {
                                        const newValue = (analysis.risks || []).filter((_, i) => i !== index);
                                        updateAnalysis('risks', newValue);
                                      }}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  <input
                                    type="text"
                                    value={item.mitigation || ''}
                                    onChange={(e) => {
                                      const newValue = [...(analysis.risks || [])];
                                      newValue[index] = { ...newValue[index], mitigation: e.target.value };
                                      updateAnalysis('risks', newValue);
                                    }}
                                    placeholder="Mitigation"
                                    className="flex-1 p-1 border rounded text-sm bg-transparent ml-4"
                                  />
                                </div>
                              ))}
                              <Button
                                onClick={() => {
                                  const newValue = [...(analysis.risks || []), { risk: '', mitigation: '' }];
                                  updateAnalysis('risks', newValue);
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                + Add Item
                              </Button>
                            </>
                          ) : (
                            // Other categories with simple text fields
                            <>
                              {(analysis[key as keyof Omit<MeetingAnalysis, 'summary' | 'risks'>] as string[] || []).map((item: string, index: number) => (
                                <div key={index} className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={item || ''}
                                    onChange={(e) => {
                                      const newValue = [...(analysis[key as keyof Omit<MeetingAnalysis, 'summary' | 'risks'>] as string[] || [])];
                                      newValue[index] = e.target.value;
                                      updateAnalysis(key as keyof MeetingAnalysis, newValue);
                                    }}
                                    className="flex-1 p-1 border rounded text-sm bg-transparent"
                                  />
                                  <Button
                                    onClick={() => {
                                      const newValue = (analysis[key as keyof Omit<MeetingAnalysis, 'summary' | 'risks'>] as string[] || [])
                                        .filter((_: string, i: number) => i !== index);
                                      updateAnalysis(key as keyof MeetingAnalysis, newValue);
                                    }}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                onClick={() => {
                                  const newValue = [...(analysis[key as keyof Omit<MeetingAnalysis, 'summary' | 'risks'>] as string[] || []), ''];
                                  updateAnalysis(key as keyof MeetingAnalysis, newValue);
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                + Add Item
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary - spans all columns */}
                <div className="col-span-3 border rounded p-2">
                  <h3 className="font-semibold text-sm mb-2">Summary</h3>
                  <textarea
                    value={analysis.summary}
                    onChange={(e) => setAnalysis(prev => ({
                      ...prev,
                      summary: e.target.value
                    }))}
                    className="w-full p-2 border rounded text-sm bg-transparent"
                    rows={4}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 