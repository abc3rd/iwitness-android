// Voice Command Interface — LegendaryLeads CRM
import { useState, useCallback, useRef } from 'react';

interface VoiceCommandResult {
  intent: string;
  entities: Record<string, string>;
  response: string;
}

const SUPPORTED_COMMANDS: Record<string, { pattern: RegExp; description: string }> = {
  create_lead: { pattern: /^(create|add|new)\s+(lead|contact)/i, description: 'Create a new lead' },
  assign_case: { pattern: /^assign\s+(case|lead)/i, description: 'Assign a case or lead' },
  schedule_followup: { pattern: /^schedule\s+(follow.?up|meeting|call)/i, description: 'Schedule a follow-up' },
  send_sms: { pattern: /^send\s+(sms|text|message)/i, description: 'Send SMS message' },
  log_call: { pattern: /^log\s+(call|conversation)/i, description: 'Log a call' },
  score_lead: { pattern: /^score\s+(this|the)?\s*lead/i, description: 'Score a lead' },
  show_pipeline: { pattern: /^show\s+(pipeline|deals|board)/i, description: 'Show pipeline view' },
  search: { pattern: /^(search|find|look\s*up)/i, description: 'Search leads/cases' },
};

function parseCommand(text: string): VoiceCommandResult | null {
  const trimmed = text.trim();

  for (const [intent, config] of Object.entries(SUPPORTED_COMMANDS)) {
    if (config.pattern.test(trimmed)) {
      const remaining = trimmed.replace(config.pattern, '').trim();
      const entities: Record<string, string> = {};

      // Extract common entities
      const nameMatch = remaining.match(/(?:for|to|named?)\s+([A-Z][a-z]+ [A-Z][a-z]+)/);
      if (nameMatch) entities.name = nameMatch[1];

      const emailMatch = remaining.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (emailMatch) entities.email = emailMatch[1];

      const phoneMatch = remaining.match(/(\d{3}[-.]?\d{3}[-.]?\d{4})/);
      if (phoneMatch) entities.phone = phoneMatch[1];

      return {
        intent,
        entities,
        response: `Executing: ${config.description}${entities.name ? ` for ${entities.name}` : ''}`,
      };
    }
  }

  return null;
}

export default function VoiceCommand({ onCommand }: { onCommand?: (result: VoiceCommandResult) => void }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState<VoiceCommandResult | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const recognitionRef = useRef<unknown>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setResult({ intent: 'error', entities: {}, response: 'Speech recognition not supported in this browser.' });
      return;
    }

    const recognition = new (SpeechRecognition as new () => {
      continuous: boolean; interimResults: boolean; lang: string;
      onstart: () => void; onresult: (e: { results: { transcript: string }[][] }) => void;
      onerror: () => void; onend: () => void; start: () => void; stop: () => void;
    })();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      setResult(null);
    };

    recognition.onresult = (event) => {
      const current = event.results[event.results.length - 1];
      const text = current.transcript;
      setTranscript(text);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setResult({ intent: 'error', entities: {}, response: 'Voice recognition error. Try again.' });
    };

    recognition.onend = () => {
      setIsListening(false);
      // Parse the final transcript
      if (transcript) {
        const parsed = parseCommand(transcript);
        if (parsed) {
          setResult(parsed);
          onCommand?.(parsed);
        } else {
          setResult({ intent: 'unknown', entities: {}, response: `I didn't understand: "${transcript}". Try "create lead" or "schedule follow-up".` });
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [transcript, onCommand]);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcript.trim()) return;
    const parsed = parseCommand(transcript);
    if (parsed) {
      setResult(parsed);
      onCommand?.(parsed);
    } else {
      setResult({ intent: 'unknown', entities: {}, response: `Unknown command: "${transcript}". Type "help" for available commands.` });
    }
  };

  return (
    <div style={{
      borderRadius: 12, border: '1px solid #1e293b', padding: 16, background: '#0f172a',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Voice Command</div>
        <button onClick={() => setShowHelp(!showHelp)} style={{
          fontSize: 10, padding: '2px 8px', borderRadius: 999,
          border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer',
        }}>{showHelp ? 'Hide' : 'Help'}</button>
      </div>

      {showHelp && (
        <div style={{ marginBottom: 10, padding: 10, borderRadius: 8, background: '#020617', fontSize: 11 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Available Commands:</div>
          {Object.entries(SUPPORTED_COMMANDS).map(([key, cmd]) => (
            <div key={key} style={{ opacity: 0.7, marginBottom: 2 }}>
              "{key.replace('_', ' ')}" — {cmd.description}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleTextSubmit} style={{ display: 'flex', gap: 6 }}>
        <input
          value={transcript}
          onChange={e => setTranscript(e.target.value)}
          placeholder={isListening ? 'Listening...' : 'Type or speak a command...'}
          style={{
            flex: 1, borderRadius: 8, border: `1px solid ${isListening ? '#ea00ea' : '#334155'}`,
            padding: '0.4rem 0.6rem', background: isListening ? '#ea00ea10' : 'black',
            color: 'white', fontSize: 12,
          }}
        />
        <button type="button" onClick={startListening} disabled={isListening}
          style={{
            borderRadius: 8, border: 'none', padding: '0.4rem 0.6rem',
            background: isListening
              ? 'linear-gradient(90deg, #ef4444, #ea00ea)'
              : 'linear-gradient(90deg, #ea00ea, #2699fe)',
            color: 'white', fontSize: 16, cursor: isListening ? 'default' : 'pointer',
            width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          {isListening ? '...' : '\u{1F3A4}'}
        </button>
        <button type="submit" style={{
          borderRadius: 8, border: 'none', padding: '0.4rem 0.6rem',
          background: '#22c55e', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}>Run</button>
      </form>

      {result && (
        <div style={{
          marginTop: 8, padding: 8, borderRadius: 8, fontSize: 11,
          background: result.intent === 'error' || result.intent === 'unknown' ? '#ef444420' : '#22c55e20',
          border: `1px solid ${result.intent === 'error' || result.intent === 'unknown' ? '#ef444440' : '#22c55e40'}`,
          color: result.intent === 'error' || result.intent === 'unknown' ? '#f97373' : '#86efac',
        }}>
          {result.response}
          {Object.keys(result.entities).length > 0 && (
            <div style={{ marginTop: 4, opacity: 0.7 }}>
              Entities: {JSON.stringify(result.entities)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
