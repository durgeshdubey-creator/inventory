import React, { useState, useEffect, useRef } from 'react';
import { X, Terminal, Cpu, Check, AlertCircle, Loader2 } from 'lucide-react';
import { generateSyntheticServerLogs, parseServerLogs } from '../services/geminiService';
import { LogParsingResult, JumpServerConfig } from '../types';

interface TerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: LogParsingResult, ip: string) => void;
  jumpServerConfig: JumpServerConfig | null;
}

const TerminalModal: React.FC<TerminalModalProps> = ({ isOpen, onClose, onSave, jumpServerConfig }) => {
  const [targetIp, setTargetIp] = useState('');
  const [logs, setLogs] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [step, setStep] = useState<'input' | 'terminal' | 'review'>('input');
  const [parsedData, setParsedData] = useState<LogParsingResult | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSimulatedConnection = async () => {
    if (!targetIp) return;
    setIsConnecting(true);
    setStep('terminal');
    setLogs('');

    const appendLog = (text: string) => {
      setLogs(prev => prev + text + '\n');
    };

    // Jump Server Logic
    const jumpHost = jumpServerConfig?.hostname || 'jump.default.local';
    const jumpUser = jumpServerConfig?.username || 'admin';
    const jumpPort = jumpServerConfig?.port || 22;
    const useKey = jumpServerConfig?.authType === 'key';
    const keyName = jumpServerConfig?.keyName || 'id_rsa';

    appendLog(`[local]$ initiating on-demand session to ${jumpHost}...`);
    await new Promise(r => setTimeout(r, 400));
    
    if (useKey) {
        appendLog(`[local]$ ssh -i ~/.ssh/${keyName} -p ${jumpPort} ${jumpUser}@${jumpHost}`);
        await new Promise(r => setTimeout(r, 600));
        appendLog(`Authenticated with partial public key "SHA256:..."`);
    } else {
        appendLog(`[local]$ ssh -p ${jumpPort} ${jumpUser}@${jumpHost}`);
        await new Promise(r => setTimeout(r, 600));
        appendLog(`${jumpUser}@${jumpHost}'s password: **********`);
    }
    
    appendLog(`\n[${jumpUser}@${jumpHost} ~]$ Connection established.`);
    appendLog(`Last login: ${new Date().toUTCString()} from 192.168.0.45`);
    await new Promise(r => setTimeout(r, 500));
    
    // Target Connection Logic
    appendLog(`[${jumpUser}@${jumpHost} ~]$ ssh root@${targetIp}`);
    await new Promise(r => setTimeout(r, 800));
    appendLog(`Warning: Permanently added '${targetIp}' (ECDSA) to the list of known hosts.`);
    appendLog(`root@${targetIp}'s password: `);
    await new Promise(r => setTimeout(r, 600));
    appendLog(`\n[root@${targetIp} ~]$ gathering system info...`);
    
    try {
      // Simulate fetching logs via AI generation to make it realistic
      // In a real app, this would be the actual SSH output
      const rawData = await generateSyntheticServerLogs(Math.random() > 0.5 ? 'Intel' : 'AMD');
      appendLog(rawData);
      
      setIsConnecting(false);
      setIsParsing(true);
      
      // Simulate Disconnection to emphasize "On-Demand" nature
      await new Promise(r => setTimeout(r, 400));
      appendLog(`\n[root@${targetIp} ~]$ exit`);
      appendLog(`logout`);
      appendLog(`Connection to ${targetIp} closed.`);
      await new Promise(r => setTimeout(r, 300));
      appendLog(`[${jumpUser}@${jumpHost} ~]$ exit`);
      appendLog(`logout`);
      appendLog(`Connection to ${jumpHost} closed.`);
      appendLog(`[local]$ Session terminated.`);
      
      appendLog(`\n[InfraScan] Parsing hardware telemetry with Gemini...`);
      
      const result = await parseServerLogs(rawData);
      setParsedData(result);
      setStep('review');
    } catch (err) {
      appendLog(`\n[Error] Connection lost or parsing failed.`);
      setIsConnecting(false);
      setIsParsing(false);
    }
  };

  const handleManualPaste = async () => {
     if(!logs) return;
     setIsParsing(true);
     try {
         const result = await parseServerLogs(logs);
         setParsedData(result);
         setStep('review');
     } catch (e) {
         alert("Failed to parse logs");
     } finally {
         setIsParsing(false);
     }
  }

  const reset = () => {
    setStep('input');
    setTargetIp('');
    setLogs('');
    setParsedData(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gray-800 px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Terminal className="text-emerald-400 w-5 h-5" />
            <h2 className="text-lg font-semibold text-white">Remote Inventory Scanner</h2>
          </div>
          <button onClick={reset} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {step === 'input' && (
            <div className="flex flex-col gap-6 max-w-lg mx-auto mt-10">
              <div className="text-center">
                <h3 className="text-xl font-medium text-white mb-2">Connect via {jumpServerConfig ? jumpServerConfig.hostname : 'Jump Host'}</h3>
                <p className="text-gray-400">
                    {jumpServerConfig 
                        ? "Secure tunnel configured. Enter the target server's management IP." 
                        : "Using default jump server configuration. Configure specific settings in the main menu."}
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Target IP Address</label>
                  <input
                    type="text"
                    value={targetIp}
                    onChange={(e) => setTargetIp(e.target.value)}
                    placeholder="192.168.1.10"
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                  />
                </div>
                
                <button
                  onClick={handleSimulatedConnection}
                  disabled={!targetIp}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Terminal className="w-4 h-4" />
                  Initiate SSH Scan
                </button>
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-900 text-gray-500">Or paste logs manually</span>
                  </div>
                </div>

                 <textarea
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-xs text-gray-300 font-mono h-32 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Paste output from dmidecode, lscpu, ip addr..."
                    value={logs}
                    onChange={(e) => setLogs(e.target.value)}
                 />
                 <button
                    onClick={handleManualPaste}
                    disabled={!logs}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 rounded-lg transition-colors text-sm"
                 >
                    Parse Manual Logs
                 </button>

              </div>
            </div>
          )}

          {step === 'terminal' && (
            <div className="bg-black rounded-lg p-4 font-mono text-xs md:text-sm h-full overflow-auto border border-gray-800 shadow-inner">
              <pre className="whitespace-pre-wrap text-emerald-500">
                {logs}
                {isConnecting && <span className="animate-pulse">_</span>}
              </pre>
              <div ref={logsEndRef} />
            </div>
          )}

          {step === 'review' && parsedData && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 flex items-start gap-3">
                <Check className="text-emerald-400 w-5 h-5 mt-0.5" />
                <div>
                  <h4 className="text-emerald-400 font-medium">Scan Successful</h4>
                  <p className="text-emerald-500/80 text-sm">Hardware specifications extracted successfully using Gemini.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <span className="text-gray-500 text-xs uppercase tracking-wider">System</span>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Manufacturer</span>
                      <span className="text-white font-medium">{parsedData.manufacturer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Model</span>
                      <span className="text-white font-medium">{parsedData.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">RAM</span>
                      <span className="text-white font-medium">{parsedData.ramGb} GB</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <span className="text-gray-500 text-xs uppercase tracking-wider">CPU</span>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Model</span>
                      <span className="text-white font-medium text-right text-xs">{parsedData.cpuModel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Sockets</span>
                      <span className="text-white font-medium">{parsedData.cpuCount}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <span className="text-gray-500 text-xs uppercase tracking-wider">Network Interfaces</span>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase border-b border-gray-700">
                      <tr>
                        <th className="pb-2">Name</th>
                        <th className="pb-2">IP</th>
                        <th className="pb-2">Speed</th>
                        <th className="pb-2">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {parsedData.interfaces.map((iface, i) => (
                        <tr key={i}>
                          <td className="py-2 text-white font-mono">{iface.name}</td>
                          <td className="py-2 text-gray-300 font-mono">{iface.ip}</td>
                          <td className="py-2">
                            <span className={`px-2 py-0.5 rounded text-xs ${iface.speed === '10G' || iface.speed === '25G' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-gray-700 text-gray-300'}`}>
                              {iface.speed}
                            </span>
                          </td>
                          <td className="py-2 text-gray-400">{iface.type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-800 px-6 py-4 border-t border-gray-700 flex justify-end gap-3">
          {step === 'review' ? (
             <>
                <button
                onClick={() => setStep('input')}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium"
                >
                Discard
                </button>
                <button
                onClick={() => {
                    if (parsedData) {
                        onSave(parsedData, targetIp || parsedData.interfaces.find(i => i.type === 'Management')?.ip || '0.0.0.0');
                        reset();
                    }
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium"
                >
                Add to Inventory
                </button>
             </>
          ) : (
             step === 'terminal' && isParsing ? (
                 <div className="flex items-center text-emerald-400 text-sm gap-2">
                     <Loader2 className="animate-spin w-4 h-4"/> Processing...
                 </div>
             ) : (
                <button onClick={onClose} className="text-gray-400 hover:text-white text-sm">Cancel</button>
             )
          )}
        </div>
      </div>
    </div>
  );
};

export default TerminalModal;