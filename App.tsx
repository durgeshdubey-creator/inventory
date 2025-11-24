import React, { useState, useRef } from 'react';
import { Server, Search, Plus, Terminal as TerminalIcon, LayoutGrid, List, Settings, Clock, History, Download, Trash2, ShieldCheck } from 'lucide-react';
import { ServerNode, ServerStatus, CpuManufacturer, LogParsingResult, JumpServerConfig } from './types';
import TerminalModal from './components/TerminalModal';
import ServerDetail from './components/ServerDetail';
import JumpServerModal from './components/JumpServerModal';

// Initial Mock Data
const INITIAL_SERVERS: ServerNode[] = [
  {
    id: '1',
    hostname: 'hft-primary-01',
    managementIp: '10.20.1.5',
    manufacturer: 'Dell',
    model: 'PowerEdge R750',
    cpuManufacturer: CpuManufacturer.INTEL,
    cpuModel: 'Intel(R) Xeon(R) Platinum 8368 CPU @ 2.40GHz',
    cpuCount: 2,
    coreCount: 76,
    ramGb: 512,
    interfaces: [
        { name: 'eno1', ip: '10.20.1.5', speed: '1G', type: 'Management' },
        { name: 'enp101s0', ip: '192.168.100.10', speed: '25G', type: 'ExaNIC' }
    ],
    lastScanned: new Date().toISOString(),
    status: ServerStatus.ONLINE,
  },
  {
    id: '2',
    hostname: 'hft-backup-02',
    managementIp: '10.20.1.6',
    manufacturer: 'Supermicro',
    model: 'AS -2023US',
    cpuManufacturer: CpuManufacturer.AMD,
    cpuModel: 'AMD EPYC 7763 64-Core Processor',
    cpuCount: 2,
    coreCount: 128,
    ramGb: 1024,
    interfaces: [
        { name: 'eth0', ip: '10.20.1.6', speed: '1G', type: 'Management' },
        { name: 'eth2', ip: '192.168.100.11', speed: '10G', type: 'Solarflare' }
    ],
    lastScanned: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    status: ServerStatus.ONLINE,
  }
];

export default function App() {
  const [servers, setServers] = useState<ServerNode[]>(INITIAL_SERVERS);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isJumpConfigOpen, setIsJumpConfigOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState<ServerNode | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Jump Server State
  const [jumpServerConfig, setJumpServerConfig] = useState<JumpServerConfig | null>(null);

  // Search History State
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleScanSave = (data: LogParsingResult, targetIp: string) => {
    const newServer: ServerNode = {
      id: Math.random().toString(36).substr(2, 9),
      hostname: `server-${data.manufacturer.toLowerCase().replace(/\s/g, '')}-${Math.floor(Math.random() * 100)}`, // Generate a hostname
      managementIp: targetIp,
      manufacturer: data.manufacturer,
      model: data.model,
      cpuManufacturer: data.cpuModel.includes('AMD') ? CpuManufacturer.AMD : CpuManufacturer.INTEL,
      cpuModel: data.cpuModel,
      cpuCount: data.cpuCount,
      coreCount: data.cpuCount * 32, // Estimate
      ramGb: data.ramGb,
      interfaces: data.interfaces,
      lastScanned: new Date().toISOString(),
      status: ServerStatus.ONLINE,
    };

    setServers(prev => [...prev, newServer]);
  };

  const handleDeleteServer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this server from the inventory?')) {
      setServers(prev => prev.filter(s => s.id !== id));
      if (selectedServer?.id === id) {
        setSelectedServer(null);
      }
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'ID', 'Hostname', 'Management IP', 'Manufacturer', 'Model', 
      'CPU Manufacturer', 'CPU Model', 'Sockets', 'Cores', 'RAM (GB)', 
      'Interfaces', 'Status', 'Last Scanned'
    ];
    
    const rows = servers.map(s => [
      s.id,
      s.hostname,
      s.managementIp,
      s.manufacturer,
      s.model,
      s.cpuManufacturer,
      s.cpuModel,
      s.cpuCount,
      s.coreCount,
      s.ramGb,
      s.interfaces.map(i => `${i.name}(${i.ip})`).join(';'),
      s.status,
      s.lastScanned
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setSearchHistory(prev => {
        const newHistory = [searchQuery.trim(), ...prev.filter(h => h !== searchQuery.trim())];
        return newHistory.slice(0, 8); // Keep last 8 items
      });
      setShowSearchHistory(false);
      searchInputRef.current?.blur();
    }
  };

  const clearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchHistory([]);
  };

  // Improved Search Logic: Multi-term search across all fields including CPU
  const filteredServers = servers.filter(s => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const terms = query.split(/\s+/);
    
    const searchableText = [
        s.hostname,
        s.managementIp,
        s.manufacturer,
        s.model,
        s.cpuManufacturer,
        s.cpuModel,
        ...s.interfaces.map(i => `${i.name} ${i.ip} ${i.type} ${i.speed}`)
    ].join(' ').toLowerCase();

    return terms.every(term => searchableText.includes(term));
  });

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 font-sans selection:bg-emerald-500/30">
      
      {/* Top Navigation */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Server className="text-white w-5 h-5" />
             </div>
             <div>
                <h1 className="text-xl font-bold tracking-tight text-white">InfraScan AI</h1>
                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Inventory Management</p>
             </div>
          </div>

          <div className="flex items-center gap-4">
             {/* Search Bar with History */}
             <div className="relative hidden md:block group">
                <div className="flex items-center bg-gray-950 border border-gray-700 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-emerald-500/50 transition-all w-72">
                    <Search className="w-4 h-4 text-gray-500 mr-2" />
                    <input 
                      ref={searchInputRef}
                      type="text" 
                      placeholder="Search hostname, IP, model, CPU..." 
                      className="bg-transparent border-none outline-none text-sm w-full placeholder-gray-600"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setShowSearchHistory(true)}
                      onBlur={() => setTimeout(() => setShowSearchHistory(false), 200)} // Delay to allow click
                      onKeyDown={handleSearchKeyDown}
                    />
                </div>
                
                {/* Search History Dropdown */}
                {showSearchHistory && searchHistory.length > 0 && (
                   <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50 animate-fadeIn">
                      <div className="flex justify-between items-center px-3 py-2 border-b border-gray-800 bg-gray-800/50">
                         <span className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
                           <History className="w-3 h-3" /> Recent Searches
                         </span>
                         <button onClick={clearHistory} className="text-[10px] text-gray-500 hover:text-red-400 transition-colors">Clear</button>
                      </div>
                      <div className="py-1">
                         {searchHistory.map((term, idx) => (
                           <button
                             key={idx}
                             className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors flex items-center gap-2"
                             onClick={() => setSearchQuery(term)}
                           >
                             <Clock className="w-3 h-3 text-gray-600" />
                             {term}
                           </button>
                         ))}
                      </div>
                   </div>
                )}
             </div>
             
             {/* Jump Server Configuration */}
             <div className="flex items-center gap-2 border-l border-r border-gray-800 px-3 mx-1">
                {jumpServerConfig && (
                   <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-700/50 bg-gray-900 text-xs font-medium text-gray-400">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        <span className="flex items-center gap-1">
                            Jump Host: <span className="text-gray-300">{jumpServerConfig.hostname}</span>
                        </span>
                   </div>
                )}
                
                <button
                    onClick={() => setIsJumpConfigOpen(true)}
                    className={`p-2 rounded-lg transition-colors border ${
                        jumpServerConfig 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
                    }`}
                    title="Configure Jump Server"
                >
                    <Settings className="w-5 h-5" />
                </button>
             </div>

             <button
                onClick={handleExportCSV}
                className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
                title="Export Inventory to CSV"
             >
                <Download className="w-5 h-5" />
             </button>

             <button 
                onClick={() => setIsScannerOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20"
             >
                <Plus className="w-4 h-4" />
                <span>Add Node</span>
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Controls */}
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                Inventory
                <span className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded-full">{filteredServers.length}</span>
            </h2>
            <div className="flex items-center gap-2 bg-gray-900 p-1 rounded-lg border border-gray-800">
                <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <List className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <LayoutGrid className="w-4 h-4" />
                </button>
            </div>
        </div>

        {/* List View */}
        {viewMode === 'list' && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-950/50 border-b border-gray-800">
                            <tr>
                                <th className="px-6 py-4 font-medium">Hostname / IP</th>
                                <th className="px-6 py-4 font-medium">Hardware</th>
                                <th className="px-6 py-4 font-medium">CPU Spec</th>
                                <th className="px-6 py-4 font-medium">Network</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {filteredServers.map((server) => (
                                <tr key={server.id} className="hover:bg-gray-800/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-white">{server.hostname}</div>
                                        <div className="text-gray-500 font-mono text-xs">{server.managementIp}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-gray-300">{server.manufacturer}</div>
                                        <div className="text-gray-500 text-xs">{server.model}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${server.cpuManufacturer === CpuManufacturer.AMD ? 'bg-red-900/30 text-red-400 border border-red-900/50' : 'bg-blue-900/30 text-blue-400 border border-blue-900/50'}`}>
                                                {server.cpuManufacturer}
                                            </span>
                                            <span className="text-gray-400">{server.cpuCount}x Sockets</span>
                                        </div>
                                        <div className="text-gray-500 text-xs mt-1 truncate max-w-[200px]" title={server.cpuModel}>{server.cpuModel}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {server.interfaces.filter(i => i.type !== 'Management').slice(0, 2).map((iface, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300">
                                                    {iface.speed}
                                                </span>
                                            ))}
                                            {server.interfaces.length > 3 && <span className="text-xs text-gray-500 self-center">+{server.interfaces.length - 3}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            Online
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button 
                                                onClick={() => setSelectedServer(server)}
                                                className="text-emerald-500 hover:text-emerald-400 text-xs font-medium hover:underline"
                                            >
                                                View Details
                                            </button>
                                            <button 
                                                onClick={(e) => handleDeleteServer(server.id, e)}
                                                className="text-gray-500 hover:text-red-400 transition-colors p-1"
                                                title="Delete Server"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServers.map((server) => (
                    <div 
                        key={server.id}
                        onClick={() => setSelectedServer(server)}
                        className="bg-gray-900 rounded-xl border border-gray-800 p-6 hover:border-emerald-500/50 transition-all cursor-pointer group hover:shadow-xl hover:shadow-emerald-900/10 relative"
                    >
                        <button 
                            onClick={(e) => handleDeleteServer(server.id, e)}
                            className="absolute top-4 right-4 text-gray-600 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100 z-10"
                            title="Delete Server"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700 group-hover:border-emerald-500/30 transition-colors">
                                <Server className="text-gray-400 group-hover:text-emerald-400 w-5 h-5" />
                            </div>
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                                Online
                            </span>
                        </div>
                        
                        <h3 className="text-lg font-bold text-white mb-1">{server.hostname}</h3>
                        <p className="text-gray-500 font-mono text-xs mb-4">{server.managementIp}</p>
                        
                        <div className="space-y-2 border-t border-gray-800 pt-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Model</span>
                                <span className="text-gray-300">{server.model}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">CPU</span>
                                <span className={`font-medium ${server.cpuManufacturer === CpuManufacturer.AMD ? 'text-red-400' : 'text-blue-400'}`}>{server.cpuManufacturer}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">RAM</span>
                                <span className="text-gray-300">{server.ramGb} GB</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {filteredServers.length === 0 && (
            <div className="text-center py-20 opacity-50">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <p className="text-lg text-gray-400">No servers found matching your query.</p>
            </div>
        )}
      </main>

      {/* Modals */}
      <TerminalModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onSave={handleScanSave}
        jumpServerConfig={jumpServerConfig}
      />

      <JumpServerModal
        isOpen={isJumpConfigOpen}
        onClose={() => setIsJumpConfigOpen(false)}
        config={jumpServerConfig}
        onSave={setJumpServerConfig}
      />

      {selectedServer && (
        <ServerDetail 
            server={selectedServer} 
            onClose={() => setSelectedServer(null)} 
        />
      )}

    </div>
  );
}