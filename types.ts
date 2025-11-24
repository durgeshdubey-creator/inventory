export enum ServerStatus {
  ONLINE = 'Online',
  OFFLINE = 'Offline',
  MAINTENANCE = 'Maintenance',
  SCANNING = 'Scanning'
}

export enum CpuManufacturer {
  INTEL = 'Intel',
  AMD = 'AMD',
  UNKNOWN = 'Unknown'
}

export interface NetworkInterface {
  name: string;
  ip: string;
  speed: '1G' | '10G' | '25G' | '40G' | '100G' | 'Unknown';
  type: 'Management' | 'Data' | 'ExaNIC' | 'Solarflare' | 'Standard';
}

export interface ServerNode {
  id: string;
  hostname: string;
  managementIp: string;
  manufacturer: string;
  model: string;
  cpuManufacturer: CpuManufacturer;
  cpuModel: string;
  cpuCount: number; // Physical CPUs
  coreCount: number; // Total Cores
  ramGb: number;
  interfaces: NetworkInterface[];
  lastScanned: string; // ISO Date
  status: ServerStatus;
  notes?: string;
}

export interface LogParsingResult {
  manufacturer: string;
  model: string;
  cpuModel: string;
  cpuCount: number;
  ramGb: number;
  interfaces: NetworkInterface[];
}

export interface JumpServerConfig {
  hostname: string;
  username: string;
  password?: string;
  port: number;
  authType: 'password' | 'key';
  keyName?: string;
  keyContent?: string;
}