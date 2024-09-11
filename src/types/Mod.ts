import { Readable } from 'stream';

export interface Archive {
  files: string[];
  chatLog: Readable;
}