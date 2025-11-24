import React, { useState, useEffect } from 'react';
import { X, Server, Shield, Key, Save, Lock } from 'lucide-react';
import { JumpServerConfig } from '../types';

interface JumpServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: JumpServerConfig | null;
  onSave: (config: JumpServerConfig) => void;
}

const JumpServerModal: React.FC<JumpServerModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const [formData, setFormData] = useState<JumpServerConfig>({
    hostname: 'jump.infra.local',
    username: 'admin',
    password: '',
    port: 22,
    authType: 'password',
    keyName: 'id_rsa',
    keyContent: ''
  });

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="bg-gray-800 px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="text-emerald-400 w-5 h-5" />
            <h2 className="text-lg font-semibold text-white">Jump Server Configuration</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-medium text-gray-400">Hostname / IP</label>
              <div className="relative">
                <Server className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  value={formData.hostname}
                  onChange={(e) => setFormData({...formData, hostname: e.target.value})}
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="jump.example.com"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400">Port</label>
              <input 
                type="number" 
                value={formData.port}
                onChange={(e) => setFormData({...formData, port: parseInt(e.target.value) || 22})}
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none text-center"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400">Username</label>
            <input 
              type="text" 
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none"
              placeholder="root"
            />
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-xs font-medium text-gray-400 block">Authentication Method</label>
            <div className="flex gap-4">
              <button 
                onClick={() => setFormData({...formData, authType: 'password'})}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  formData.authType === 'password' 
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' 
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Password
              </button>
              <button 
                onClick={() => setFormData({...formData, authType: 'key'})}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  formData.authType === 'key' 
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' 
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                }`}
              >
                SSH Key
              </button>
            </div>
          </div>

          {formData.authType === 'password' && (
            <div className="space-y-1 animate-fadeIn">
              <label className="text-xs font-medium text-gray-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                <input 
                  type="password" 
                  value={formData.password || ''}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="Enter SSH password"
                />
              </div>
            </div>
          )}

          {formData.authType === 'key' && (
            <div className="space-y-2 animate-fadeIn">
               <div className="flex justify-between items-end">
                  <label className="text-xs font-medium text-gray-400">Private Key (PEM/OpenSSH)</label>
                  <div className="flex items-center gap-1 bg-gray-800 px-2 py-0.5 rounded text-[10px] text-gray-400 border border-gray-700">
                    <Key className="w-3 h-3" />
                    <span>Stored Securely</span>
                  </div>
               </div>
               <textarea 
                 value={formData.keyContent || ''}
                 onChange={(e) => setFormData({...formData, keyContent: e.target.value})}
                 className="w-full h-32 bg-gray-950 border border-gray-700 rounded-lg p-3 text-xs font-mono text-gray-300 focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                 placeholder="-----BEGIN OPENSSH PRIVATE KEY-----..."
               />
               <div className="space-y-1">
                 <label className="text-xs font-medium text-gray-400">Key Filename (Optional)</label>
                 <input 
                   type="text" 
                   value={formData.keyName || ''}
                   onChange={(e) => setFormData({...formData, keyName: e.target.value})}
                   className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:ring-1 focus:ring-emerald-500 outline-none"
                   placeholder="id_rsa_jumpserver"
                 />
               </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-800 px-6 py-4 border-t border-gray-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white font-medium">
            Cancel
          </button>
          <button 
            onClick={() => {
              onSave(formData);
              onClose();
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default JumpServerModal;