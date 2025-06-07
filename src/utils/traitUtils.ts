import { Trait } from '@/types/member';

export function filterTraits(traits: Trait[], searchQuery: string, selectedTraits: Trait[]): Trait[] {
  return traits.filter(trait =>
    (trait.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     trait.description.toLowerCase().includes(searchQuery.toLowerCase())) &&
    !selectedTraits.some(t => t.name === trait.name)
  );
} 