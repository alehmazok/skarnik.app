export type DictDirection = 'belrus' | 'rusbel' | 'tsbm'

export const DICT_DIRECTIONS: readonly DictDirection[] = ['belrus', 'rusbel', 'tsbm']

export const DICT_LABELS: Record<DictDirection, string> = {
  belrus: 'Беларуска-рускі слоўнік',
  rusbel: 'Руска-беларускі слоўнік',
  tsbm: 'Тлумачальны слоўнік',
}

export function isValidDict(dict: string): dict is DictDirection {
  return (DICT_DIRECTIONS as readonly string[]).includes(dict)
}
