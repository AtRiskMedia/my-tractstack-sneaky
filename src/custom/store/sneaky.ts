import { map, atom } from 'nanostores';
import type { ResourceNode } from '@/types/compositorTypes';

export const allResources = atom<Record<string, ResourceNode[]>>({});

export const activeCollections = map<{
  animals: boolean;
  people: boolean;
  stuff: boolean;
}>({
  animals: true,
  people: true,
  stuff: true,
});

export const traitFilters = map<{
  searchTerm: string;
  selectedClass: string[];
  selectedAttack: string[];
  selectedSpecial: string[];
  selectedSpecies: string[];
  selectedProfession: string[];
  powerRange: number[];
  sneakinessRange: number[];
}>({
  searchTerm: '',
  selectedClass: [],
  selectedAttack: [],
  selectedSpecial: [],
  selectedSpecies: [],
  selectedProfession: [],
  powerRange: [],
  sneakinessRange: [],
});

export const viewState = map<{
  currentPage: number;
  totalItems: number;
}>({
  currentPage: 1,
  totalItems: 0,
});

export const setCollection = (
  collection: keyof typeof activeCollections.value,
  active: boolean
) => {
  activeCollections.setKey(collection, active);
};

export const setAllCollections = (active: boolean) => {
  activeCollections.set({
    animals: active,
    people: active,
    stuff: active,
  });
};

export const setTraitSearch = (searchTerm: string) => {
  traitFilters.setKey('searchTerm', searchTerm);
};

export const setTraitSelection = (
  traitType:
    | 'selectedClass'
    | 'selectedAttack'
    | 'selectedSpecial'
    | 'selectedSpecies'
    | 'selectedProfession',
  values: string[]
) => {
  traitFilters.setKey(traitType, values);
};

export const setTraitRange = (
  rangeType: 'powerRange' | 'sneakinessRange',
  values: number[]
) => {
  traitFilters.setKey(rangeType, values);
};

export const initializeTraitRanges = (
  powerRange: number[],
  sneakinessRange: number[]
) => {
  traitFilters.setKey('powerRange', powerRange);
  traitFilters.setKey('sneakinessRange', sneakinessRange);
};

export const setCurrentPage = (page: number) => {
  viewState.setKey('currentPage', page);
};

export const setTotalItems = (count: number) => {
  viewState.setKey('totalItems', count);
};

export const resetTraitFilters = () => {
  traitFilters.set({
    searchTerm: '',
    selectedClass: [],
    selectedAttack: [],
    selectedSpecial: [],
    selectedSpecies: [],
    selectedProfession: [],
    powerRange: [],
    sneakinessRange: [],
  });
  viewState.set({
    currentPage: 1,
    totalItems: 0,
  });
};

export const resetLockedTraitFilters = (lockedTrait: string) => {
  const current = traitFilters.get();
  traitFilters.set({
    ...current,
    searchTerm: '',
    powerRange: [],
    sneakinessRange: [],
    // Keep the locked trait, reset others
    selectedClass: lockedTrait === 'class' ? current.selectedClass : [],
    selectedAttack: lockedTrait === 'attack' ? current.selectedAttack : [],
    selectedSpecial: lockedTrait === 'special' ? current.selectedSpecial : [],
    selectedSpecies: lockedTrait === 'species' ? current.selectedSpecies : [],
    selectedProfession:
      lockedTrait === 'profession' ? current.selectedProfession : [],
  });
  viewState.set({
    currentPage: 1,
    totalItems: 0,
  });
};
