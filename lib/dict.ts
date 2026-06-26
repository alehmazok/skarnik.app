export type DictDirection = 'belrus' | 'rusbel' | 'tsbm'

export const DICT_DIRECTIONS: readonly DictDirection[] = ['belrus', 'rusbel', 'tsbm']

export const DICT_LABELS: Record<DictDirection, string> = {
  belrus: 'Беларуска-рускі слоўнік',
  rusbel: 'Руска-беларускі слоўнік',
  tsbm: 'Тлумачальны слоўнік',
}

export function buildOgDescription(text: string, direction: DictDirection): string {
  return `"${text}" — ${DICT_LABELS[direction]}`
}

export function isValidDict(dict: string): dict is DictDirection {
  return (DICT_DIRECTIONS as readonly string[]).includes(dict)
}
