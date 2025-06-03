export interface Modpack {
  id: string;
  name: string;
  description: string;
  members: string[]; // Array of member IDs
  createdAt: number;
  updatedAt: number;
}

export interface ModpackExportOptions {
  includePortraits: boolean;
  decadeStartContent: boolean;
  outputFormat: 'zip' | 'directory';
} 