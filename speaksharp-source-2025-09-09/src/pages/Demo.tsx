import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, Mic, MicOff, Play, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { Link } from "react-router";
import { toast } from "sonner";

const assessmentScript = `
"The quick brown fox jumps over the lazy dog. 
This sentence contains many common English sounds. 
Technology has revolutionized the way we communicate. 
I thoroughly enjoy reading books about philosophy and psychology."
`;

const mockIssues = [
  {
    type: "/θ/→/t/",
    description: "Replacing 'th' sound with 't' sound",
    severity: "high"
  },
  {
    type: "/ɪ/→/iː/",
    description: "Pronouncing short 'i' as long 'ee' sound",
    severity: "medium"
  },
  {
    type: "/r/→/l/",
    description: "Confusion between 'r' and 'l' sounds",
    severity: "medium"
  }
];

export default function Demo() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [computedWerPct, setComputedWerPct] = useState<number | null>(null);
  const [computedCerPct, setComputedCerPct] = useState<number | null>(null);

  const createDemoSession = useMutation(api.demoSessions.createDemoSession);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // Helper: normalize text to words
  function tokenizeWords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s']/g, " ")
      .split(/\s+/)
      .filter(Boolean);
  }

  // Helper: Levenshtein distance
  function levenshtein(a: string[], b: string[]): number {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,        // deletion
          dp[i][j - 1] + 1,        // insertion
          dp[i - 1][j - 1] + cost, // substitution
        );
      }
    }
    return dp[m][n];
  }

  // Helper: Character-level Levenshtein
  function levenshteinChars(a: string, b: string): number {
    const arrA = Array.from(a);
    const arrB = Array.from(b);
    const m = arrA.length;
    const n = arrB.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = arrA[i - 1] === arrB[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost,
        );
      }
    }
    return dp[m][n];
  }

  const startRecording = async () => {
    try {
      setTranscript("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      // Start SpeechRecognition if available
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.interimResults = true;
        recognition.continuous = true;

        recognition.onresult = (event: any) => {
          let text = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            text += event.results[i][0].transcript;
          }
          setTranscript((prev) => {
            const combined = (prev + " " + text).trim();
            return combined;
          });
        };
        recognition.onerror = () => {
          // Non-fatal; we'll still have audio
        };
        try {
          recognition.start();
          recognitionRef.current = recognition;
        } catch {}
      } else {
        toast("Live transcription not supported in this browser. We'll still save your audio.");
      }

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 10) {
            stopRecording();
            return 10;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      toast.error("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }

      // Show results after a brief delay
      setTimeout(() => {
        analyzeRecording();
      }, 1000);
    }
  };

  const analyzeRecording = async () => {
    try {
      setIsAnalyzing(true);
      // Compute real WER and a proxy PER (CER) vs the assessment script
      const refText = assessmentScript.replace(/\s+/g, " ").trim();
      const hypText = transcript.replace(/\s+/g, " ").trim();

      const refWords = tokenizeWords(refText);
      const hypWords = tokenizeWords(hypText);

      const wordEdits = levenshtein(refWords, hypWords);
      const wer = refWords.length > 0 ? wordEdits / refWords.length : 1;

      const charEdits = levenshteinChars(refText.toLowerCase(), hypText.toLowerCase());
      const cer =
        refText.length > 0 ? Math.min(1, charEdits / refText.length) : 1;

      // Simple severity mapping for demo issues
      const computedIssues = [
        ...mockIssues.slice(0, 2),
        {
          type: "Transcript Coverage",
          description:
            hypWords.length > 0
              ? "Some words differed from the reference script"
              : "No speech detected or unsupported transcription",
          severity: wer > 0.4 ? "high" : wer > 0.2 ? "medium" : "low",
        },
      ];

      // Store computed metrics for rendering
      setComputedWerPct(Math.round(Math.max(0, Math.min(100, wer * 100))));
      setComputedCerPct(Math.round(Math.max(0, Math.min(100, cer * 100))));

      // Save demo session to database with computed metrics
      await createDemoSession({
        durationSec: recordingTime,
        wer: Number(wer.toFixed(2)),
        per: Number(cer.toFixed(2)),
        issues: computedIssues,
      });

      setShowResults(true);
      toast.success("Analysis complete!");
    } catch (error) {
      toast.error("Failed to save demo session");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetDemo = () => {
    setShowResults(false);
    setRecordingTime(0);
    setAudioBlob(null);
    setTranscript("");
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="max-w-4xl mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={resetDemo}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Link to="/">
                <Button variant="outline">Back to Home</Button>
              </Link>
            </div>

            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight mb-4">
                Your Speech Analysis
              </h1>
              <p className="text-muted-foreground">
                Here's what our AI detected in your {recordingTime}-second recording
              </p>
            </div>

            {/* Results Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Accuracy Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Word Error Rate (WER)</span>
                      <span className="font-medium">
                        {computedWerPct ?? 0}%
                      </span>
                    </div>
                    <Progress
                      value={computedWerPct ?? 0}
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Phoneme Error Rate (proxy)</span>
                      <span className="font-medium">
                        {computedCerPct ?? 0}%
                      </span>
                    </div>
                    <Progress
                      value={computedCerPct ?? 0}
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pronunciation Issues</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockIssues.map((issue, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <AlertCircle
                          className={`w-4 h-4 mt-0.5 ${
                            issue.severity === "high" ? "text-red-500" : "text-yellow-500"
                          }`}
                        />
                        <div>
                          <p className="font-medium text-sm">{issue.type}</p>
                          <p className="text-xs text-muted-foreground">
                            {issue.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {audioBlob && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Recording</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <audio
                    controls
                    src={URL.createObjectURL(audioBlob)}
                    className="w-full"
                  />
                  <div>
                    <p className="text-sm font-medium mb-1">Recognized Transcript</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {transcript || "No transcript available"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="text-center">
              <Button size="lg" className="font-medium">
                Fix It Now - Get Full Access
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Join SpeakSharp to get personalized coaching and track your progress
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight mb-4">
              Speech Assessment Demo
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Read the text below clearly and naturally. We'll analyze your pronunciation 
              and provide detailed feedback in just 10 seconds.
            </p>
          </div>

          {/* Assessment Script */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Play className="w-5 h-5 mr-2" />
                Read This Text Aloud
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 p-6 rounded-lg">
                <p className="text-lg leading-relaxed font-medium">
                  {assessmentScript}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recording Controls */}
          <div className="text-center space-y-6">
            {isRecording && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="text-2xl font-bold text-primary">
                  {10 - recordingTime}s remaining
                </div>
                <Progress value={(recordingTime / 10) * 100} className="max-w-xs mx-auto" />
                {transcript && (
                  <div className="text-xs text-muted-foreground max-w-xl mx-auto">
                    Live transcript: {transcript.slice(0, 140)}
                    {transcript.length > 140 ? "..." : ""}
                  </div>
                )}
              </motion.div>
            )}

            <div className="flex justify-center">
              {!isRecording ? (
                <Button
                  size="lg"
                  onClick={startRecording}
                  className="text-lg px-8 py-6 font-medium"
                >
                  <Mic className="w-6 h-6 mr-3" />
                  Start Recording
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={stopRecording}
                  className="text-lg px-8 py-6 font-medium"
                >
                  <Square className="w-6 h-6 mr-3" />
                  Stop Recording
                </Button>
              )}
            </div>

            {recordingTime > 0 && !isRecording && !showResults && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                  <MicOff className="w-4 h-4" />
                  <span>{isAnalyzing ? "Finalizing..." : "Analyzing your speech..."}</span>
                </div>
              </motion.div>
            )}
          </div>

          <div className="text-center">
            <Link to="/">
              <Button variant="ghost" className="flex items-center mx-auto">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}