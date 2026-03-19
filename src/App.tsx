/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Mic, Bluetooth, AlertCircle, CheckCircle2, Terminal, Play, Square, RefreshCw, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface SystemLog {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
  timestamp: string;
}

// --- Components ---

const HardwareCard = ({ 
  title, 
  icon: Icon, 
  status, 
  children, 
  error 
}: { 
  title: string; 
  icon: any; 
  status: 'idle' | 'active' | 'error'; 
  children: React.ReactNode;
  error?: string;
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-[#151619] border border-[#2A2B2F] rounded-xl p-6 flex flex-col gap-4 shadow-2xl relative overflow-hidden group"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${
          status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 
          status === 'error' ? 'bg-red-500/10 text-red-500' : 
          'bg-zinc-800 text-zinc-400'
        }`}>
          <Icon size={20} />
        </div>
        <h3 className="font-mono text-sm font-bold tracking-wider uppercase text-zinc-200">{title}</h3>
      </div>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          status === 'active' ? 'bg-emerald-500 animate-pulse' : 
          status === 'error' ? 'bg-red-500' : 
          'bg-zinc-700'
        }`} />
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
          {status}
        </span>
      </div>
    </div>

    <div className="flex-1 min-h-[200px] bg-black/40 rounded-lg border border-zinc-800/50 overflow-hidden relative">
      {children}
    </div>

    {error && (
      <div className="flex items-center gap-2 text-red-400 text-xs font-mono bg-red-500/5 p-2 rounded border border-red-500/20">
        <AlertCircle size={14} />
        <span>{error}</span>
      </div>
    )}
  </motion.div>
);

export default function App() {
  // --- State ---
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'active' | 'error'>('idle');
  const [cameraError, setCameraError] = useState<string>();
  const [speechStatus, setSpeechStatus] = useState<'idle' | 'active' | 'error'>('idle');
  const [speechError, setSpeechError] = useState<string>();
  const [transcription, setTranscription] = useState('');
  const [bluetoothStatus, setBluetoothStatus] = useState<'idle' | 'active' | 'error'>('idle');
  const [bluetoothError, setBluetoothError] = useState<string>();
  const [btDevice, setBtDevice] = useState<{ name: string; id: string } | null>(null);

  // --- Refs ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  // --- Helpers ---
  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const newLog: SystemLog = {
      id: Math.random().toString(36).substr(2, 9),
      message,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  useEffect(() => {
    addLog('System initialized. Ready for hardware interface quest.', 'info');
  }, []);

  // --- Camera Logic ---
  const startCamera = async () => {
    try {
      setCameraStatus('idle');
      setCameraError(undefined);
      addLog('Requesting camera permissions...', 'info');
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraStatus('active');
        addLog('Camera stream established successfully.', 'success');
      }
    } catch (err: any) {
      setCameraStatus('error');
      const msg = err.name === 'NotAllowedError' ? 'Permission denied' : 'Camera not found or busy';
      setCameraError(msg);
      addLog(`Camera Error: ${msg}`, 'error');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraStatus('idle');
      addLog('Camera stream terminated.', 'info');
    }
  };

  const isSpeechActiveRef = useRef(false);

  // --- Speech Logic ---
  const startSpeech = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setSpeechError('Web Speech API not supported in this browser.');
      setSpeechStatus('error');
      addLog('Speech API not supported.', 'error');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setSpeechStatus('active');
        isSpeechActiveRef.current = true;
        addLog('Microphone active. Listening for speech...', 'info');
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setTranscription(finalTranscript + interimTranscript);
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') return; // Ignore no-speech errors
        setSpeechStatus('error');
        setSpeechError(`Speech error: ${event.error}`);
        addLog(`Speech Recognition Error: ${event.error}`, 'error');
      };

      recognition.onend = () => {
        if (isSpeechActiveRef.current) {
          try {
            recognition.start();
          } catch (e) {
            // Already started or other error
          }
        } else {
          setSpeechStatus('idle');
          addLog('Speech recognition session ended.', 'info');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setSpeechStatus('error');
      setSpeechError(err.message);
      addLog(`Speech Init Error: ${err.message}`, 'error');
    }
  };

  const stopSpeech = () => {
    isSpeechActiveRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setSpeechStatus('idle');
    }
  };

  // --- Bluetooth Logic ---
  const connectBluetooth = async () => {
    const nav = navigator as any;
    if (!nav.bluetooth) {
      setBluetoothError('Web Bluetooth not supported (requires HTTPS & Chrome/Edge).');
      setBluetoothStatus('error');
      addLog('Bluetooth API not supported.', 'error');
      return;
    }

    try {
      setBluetoothStatus('idle');
      setBluetoothError(undefined);
      addLog('Scanning for Bluetooth devices...', 'info');
      
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true
      });

      setBtDevice({ name: device.name || 'Unknown Device', id: device.id });
      setBluetoothStatus('active');
      addLog(`Connected to Bluetooth device: ${device.name || 'Unknown'}`, 'success');
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        addLog('Bluetooth scan cancelled by user.', 'info');
      } else {
        setBluetoothStatus('error');
        setBluetoothError(err.message);
        addLog(`Bluetooth Error: ${err.message}`, 'error');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-zinc-300 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-[#1A1B1E] bg-[#0D0E12]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Wifi className="text-black" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">ZENITHRA <span className="text-emerald-500">TECH</span></h1>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em]">Hardware Interface Quest v1.0.4</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-[11px] font-mono uppercase tracking-widest text-zinc-500">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Secure Layer Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Hardware Handshake Ready</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Hardware Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Video Feed */}
            <HardwareCard 
              title="Camera Interface" 
              icon={Camera} 
              status={cameraStatus}
              error={cameraError}
            >
              <div className="absolute inset-0 flex flex-col">
                <div className="flex-1 bg-black relative">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                  {cameraStatus === 'idle' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm">
                      <Camera className="text-zinc-700" size={48} />
                    </div>
                  )}
                </div>
                <div className="p-4 bg-[#1A1B1E] border-t border-zinc-800 flex justify-between items-center">
                  <span className="text-[10px] font-mono text-zinc-500">WEBRTC_STREAM_01</span>
                  {cameraStatus === 'active' ? (
                    <button 
                      onClick={stopCamera}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors text-xs font-bold uppercase tracking-wider"
                    >
                      <Square size={14} /> Terminate
                    </button>
                  ) : (
                    <button 
                      onClick={startCamera}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black rounded-lg transition-all shadow-lg shadow-emerald-500/20 text-xs font-bold uppercase tracking-wider"
                    >
                      <Play size={14} /> Initialize
                    </button>
                  )}
                </div>
              </div>
            </HardwareCard>

            {/* Voice to Text */}
            <HardwareCard 
              title="Acoustic Processor" 
              icon={Mic} 
              status={speechStatus}
              error={speechError}
            >
              <div className="absolute inset-0 flex flex-col">
                <div className="flex-1 p-6 font-mono text-sm overflow-y-auto bg-black/20">
                  {transcription ? (
                    <p className="text-emerald-400/90 leading-relaxed">
                      {transcription}
                      <span className="inline-block w-2 h-4 bg-emerald-500 ml-1 animate-pulse" />
                    </p>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-4">
                      <Mic size={32} strokeWidth={1.5} />
                      <p className="text-xs uppercase tracking-widest">Awaiting Audio Input</p>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-[#1A1B1E] border-t border-zinc-800 flex justify-between items-center">
                  <span className="text-[10px] font-mono text-zinc-500">SPEECH_ENGINE_V2</span>
                  {speechStatus === 'active' ? (
                    <button 
                      onClick={stopSpeech}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors text-xs font-bold uppercase tracking-wider"
                    >
                      <Square size={14} /> Stop
                    </button>
                  ) : (
                    <button 
                      onClick={startSpeech}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black rounded-lg transition-all shadow-lg shadow-emerald-500/20 text-xs font-bold uppercase tracking-wider"
                    >
                      <Mic size={14} /> Listen
                    </button>
                  )}
                </div>
              </div>
            </HardwareCard>

            {/* Bluetooth */}
            <HardwareCard 
              title="Bluetooth Link" 
              icon={Bluetooth} 
              status={bluetoothStatus}
              error={bluetoothError}
            >
              <div className="absolute inset-0 flex flex-col">
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  {btDevice ? (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center gap-4"
                    >
                      <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                        <Bluetooth size={32} />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Connected Device</p>
                        <h4 className="text-lg font-bold text-white font-mono">{btDevice.name}</h4>
                        <p className="text-[10px] font-mono text-zinc-600 mt-1">ID: {btDevice.id}</p>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 text-zinc-600">
                      <Bluetooth size={48} strokeWidth={1} className={bluetoothStatus === 'idle' ? '' : 'animate-pulse text-emerald-500'} />
                      <p className="text-xs uppercase tracking-widest">No Active Link</p>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-[#1A1B1E] border-t border-zinc-800 flex justify-between items-center">
                  <span className="text-[10px] font-mono text-zinc-500">BT_STACK_4.2</span>
                  <button 
                    onClick={connectBluetooth}
                    disabled={bluetoothStatus === 'active' && !!btDevice}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-lg transition-all shadow-lg shadow-emerald-500/20 text-xs font-bold uppercase tracking-wider"
                  >
                    <RefreshCw size={14} className={bluetoothStatus === 'active' && !btDevice ? 'animate-spin' : ''} /> 
                    {btDevice ? 'Reconnect' : 'Scan Devices'}
                  </button>
                </div>
              </div>
            </HardwareCard>

            {/* System Status (Filler/Visual) */}
            <div className="bg-[#151619] border border-[#2A2B2F] rounded-xl p-6 flex flex-col gap-6 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-800 text-zinc-400">
                  <Terminal size={20} />
                </div>
                <h3 className="font-mono text-sm font-bold tracking-wider uppercase text-zinc-200">System Diagnostics</h3>
              </div>
              
              <div className="space-y-4">
                {[
                  { label: 'Kernel Version', value: 'v2.4.9-stable', color: 'text-emerald-500' },
                  { label: 'Uptime', value: '00:14:52:11', color: 'text-zinc-400' },
                  { label: 'Encryption', value: 'AES-256-GCM', color: 'text-emerald-500' },
                  { label: 'Node Status', value: 'Synchronized', color: 'text-emerald-500' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-zinc-800/50 pb-2">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{item.label}</span>
                    <span className={`text-[11px] font-mono ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-4">
                <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="h-full bg-emerald-500"
                  />
                </div>
                <p className="text-[9px] font-mono text-zinc-600 mt-2 uppercase text-center tracking-widest">Processing System Telemetry</p>
              </div>
            </div>

          </div>

          {/* Right Column: System Logs */}
          <div className="bg-[#0D0E12] border border-[#2A2B2F] rounded-xl flex flex-col shadow-2xl h-[600px] lg:h-auto">
            <div className="p-4 border-b border-[#2A2B2F] flex items-center justify-between bg-[#151619] rounded-t-xl">
              <div className="flex items-center gap-2">
                <Terminal size={16} className="text-emerald-500" />
                <span className="text-xs font-bold font-mono uppercase tracking-widest text-white">System Logs</span>
              </div>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/20" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/20" />
                <div className="w-2 h-2 rounded-full bg-emerald-500/20" />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-3 scrollbar-thin scrollbar-thumb-zinc-800">
              <AnimatePresence initial={false}>
                {logs.map((log) => (
                  <motion.div 
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-3 group"
                  >
                    <span className="text-zinc-600 shrink-0">[{log.timestamp}]</span>
                    <span className={`
                      ${log.type === 'error' ? 'text-red-400' : 
                        log.type === 'success' ? 'text-emerald-400' : 
                        'text-zinc-400'}
                    `}>
                      {log.type === 'error' && <AlertCircle size={10} className="inline mr-1 mb-0.5" />}
                      {log.type === 'success' && <CheckCircle2 size={10} className="inline mr-1 mb-0.5" />}
                      {log.message}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={logEndRef} />
            </div>

            <div className="p-4 border-t border-[#2A2B2F] bg-[#151619] rounded-b-xl">
              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                <span className="animate-pulse">_</span>
                <span>Awaiting command input...</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1A1B1E] py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
            © 2026 ZENITHRA TECHNOLOGIES // HARDWARE_QUEST_COMPLETED
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-[10px] font-mono text-zinc-500 hover:text-emerald-500 transition-colors uppercase tracking-widest">Documentation</a>
            <a href="#" className="text-[10px] font-mono text-zinc-500 hover:text-emerald-500 transition-colors uppercase tracking-widest">Security Protocol</a>
            <a href="#" className="text-[10px] font-mono text-zinc-500 hover:text-emerald-500 transition-colors uppercase tracking-widest">API Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
