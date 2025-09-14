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

export const setCollectionsForLockedTrait = (
  lockedTrait: string,
  traitValue: string
) => {
  const resources = allResources.get();
  const fullTraitSlug = `${lockedTrait}-${traitValue}`;

  // Determine which collections have resources matching this specific trait
  const availableCollections = {
    animals: false,
    people: false,
    stuff: false,
  };

  Object.entries(resources).forEach(([collectionName, collectionResources]) => {
    if (collectionResources && collectionResources.length > 0) {
      const hasMatchingTrait = collectionResources.some((resource) => {
        if (!resource || !resource.optionsPayload) return false;
        const payload = resource.optionsPayload;

        switch (lockedTrait) {
          case 'attack':
            return payload.attack === fullTraitSlug;
          case 'class':
            return payload.class === fullTraitSlug;
          case 'special':
            return payload.special === fullTraitSlug;
          case 'species':
            return payload.species === fullTraitSlug;
          case 'profession':
            return payload.profession === fullTraitSlug;
          default:
            return false;
        }
      });

      if (hasMatchingTrait && collectionName in availableCollections) {
        availableCollections[
          collectionName as keyof typeof availableCollections
        ] = true;
      }
    }
  });

  activeCollections.set(availableCollections);
};

export const resetTraitFilters = () => {
  traitFilters.set({
    searchTerm: '',
    selectedClass: [],
    selectedAttack: [],
    selectedSpecial: [],
    selectedSpecies: [],
    selectedProfession: [],
    powerRange: [1, 100],
    sneakinessRange: [-100, 100],
  });
  viewState.set({
    currentPage: 1,
    totalItems: 0,
  });

  // Reset collections to all available collections (based on what has any resources)
  const resources = allResources.get();
  const availableCollections = {
    animals: !!(resources.animals && resources.animals.length > 0),
    people: !!(resources.people && resources.people.length > 0),
    stuff: !!(resources.stuff && resources.stuff.length > 0),
  };
  activeCollections.set(availableCollections);
};

export const resetLockedTraitFilters = (
  lockedTrait: string,
  traitValue?: string
) => {
  const current = traitFilters.get();
  traitFilters.set({
    ...current,
    searchTerm: '',
    powerRange: [1, 100],
    sneakinessRange: [-100, 100],
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

  // Reset collections to those available for the locked trait
  if (traitValue) {
    setCollectionsForLockedTrait(lockedTrait, traitValue);
  } else {
    // Fallback to all available collections if no traitValue provided
    const resources = allResources.get();
    const availableCollections = {
      animals: !!(resources.animals && resources.animals.length > 0),
      people: !!(resources.people && resources.people.length > 0),
      stuff: !!(resources.stuff && resources.stuff.length > 0),
    };
    activeCollections.set(availableCollections);
  }
};
