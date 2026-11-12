import type { DictDirection } from '@/lib/dict'
import type { SearchResult } from '@/lib/search/engine'

export type WorkerRequest =
  | { type: 'load' }
  | { type: 'search'; id: number; q: string; dict: DictDirection | null }

export type WorkerResponse =
  | { type: 'loaded'; ready: boolean; words: number; error?: string }
  | { type: 'result'; id: number; result: SearchResult }
  | { type: 'error'; id: number; error: string }
