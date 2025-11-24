import React from 'react';
import { ServerNode, CpuManufacturer } from '../types';
import { X, Server, Network, Cpu, Activity, HardDrive } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface ServerDetailProps {
  server: ServerNode;
  onClose: () => void;
}

const ServerDetail: React.FC<ServerDetailProps> = ({ server, onClose }) => {
  // Mock data for visualizations based on server specs
  const ramData = [
    { name: 'Used', value: Math.floor(server.ramGb * 0.6) },
    { name: 'Free', value: Math.floor(server.ramGb * 0.4) },
  ];

  const cpuLoadData = [
    { name: 'Core 0-15', load: 85 },
    { name: 'Core 16-31', load: 65 },
    { name: 'Core 32-47', load: 45 },
    { name: 'Core 48-63', load: 90 },
  ];

  const COLORS = ['#10b981', '#374151']; // Emerald-500, Gray-700

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex justify-end">
      <div className="w-full max-w-2xl bg-gray-900 h-full border-l border-gray-700 shadow-2xl flex flex-col overflow-hidden animate-slideInRight">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 bg-gray-800/50 flex justify-between items-start">
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Server className={`w-6 h-6 ${server.status === 'Online' ? 'text-emerald-400' : 'text-red-400'}`} />
                    {server.hostname}
                </h2>
                <div className="flex gap-4 mt-2 text-sm text-gray-400">
                    <span className="flex items-center gap-1"><Network className="w-3 h-3" /> {server.managementIp}</span>
                    <span>•</span>
                    <span>{server.manufacturer} {server.model}</span>
                </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-1 hover:bg-gray-800 rounded">
                <X className="w-6 h-6" />
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Cpu className="w-16 h-16 text-blue-500" />
                    </div>
                    <span className="text-gray-400 text-xs font-semibold uppercase">CPU Type</span>
                    <div className={`mt-1 text-lg font-bold ${server.cpuManufacturer === CpuManufacturer.AMD ? 'text-red-400' : 'text-blue-400'}`}>
                        {server.cpuManufacturer}
                    </div>
                    <div className="text-xs text-gray-500 truncate mt-1">{server.cpuModel}</div>
                </div>
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity className="w-16 h-16 text-emerald-500" />
                    </div>
                    <span className="text-gray-400 text-xs font-semibold uppercase">Total Cores</span>
                    <div className="mt-1 text-2xl font-bold text-emerald-400">
                        {server.cpuCount * 64} <span className="text-sm font-normal text-gray-500 text-xs">(Est.)</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{server.cpuCount} Physical Sockets</div>
                </div>
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <HardDrive className="w-16 h-16 text-purple-500" />
                    </div>
                    <span className="text-gray-400 text-xs font-semibold uppercase">Total Memory</span>
                    <div className="mt-1 text-2xl font-bold text-purple-400">
                        {server.ramGb} <span className="text-sm font-normal text-gray-500">GB</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">DDR5 ECC</div>
                </div>
            </div>

            {/* Network Interfaces Table */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="font-semibold text-white">Network Configuration</h3>
                    <span className="text-xs px-2 py-1 bg-gray-900 rounded text-gray-400">ExaNIC Detected</span>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-3">Interface</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Speed</th>
                            <th className="px-6 py-3">IP Address</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {server.interfaces.map((iface, idx) => (
                            <tr key={idx} className="hover:bg-gray-700/50 transition-colors">
                                <td className="px-6 py-3 font-mono text-gray-300">{iface.name}</td>
                                <td className="px-6 py-3">
                                    <span className={`text-xs px-2 py-1 rounded-full border ${
                                        iface.type === 'ExaNIC' || iface.type === 'Solarflare' 
                                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                                        : 'bg-gray-700 text-gray-400 border-gray-600'
                                    }`}>
                                        {iface.type}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-gray-300">{iface.speed}</td>
                                <td className="px-6 py-3 font-mono text-emerald-400">{iface.ip}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col items-center">
                    <h3 className="text-sm font-semibold text-gray-400 mb-4 w-full text-left">Memory Distribution</h3>
                    <div className="w-full h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={ramData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {ramData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex gap-4 text-xs mt-2">
                         <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Used</div>
                         <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gray-700"></div> Free</div>
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-400 mb-4">NUMA Node Load (Simulated)</h3>
                    <div className="w-full h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={cpuLoadData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    cursor={{fill: '#374151', opacity: 0.2}}
                                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} 
                                />
                                <Bar dataKey="load" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default ServerDetail;