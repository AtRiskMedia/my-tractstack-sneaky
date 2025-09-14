import type { ExtendedResourceNode as ResourceNode } from '../types';
import {
  allResources,
  activeCollections,
  traitFilters,
  viewState,
  setCurrentPage,
  setTotalItems,
  initializeTraitRanges,
  resetTraitFilters,
  resetLockedTraitFilters,
  setTraitSelection,
} from '../store/sneaky';

let gridElement: HTMLElement | null = null;
let paginationWrapper: HTMLElement | null = null;
let isInitialized = false;

const IMAGE_URL = `/media/custom/`;
const ITEMS_PER_PAGE = 12;
const hasCustomImage = [
  'class-timberbeast',
  'class-amish',
  'class-woke',
  'class-cartel',
  'class-fantasy',
  'class-connoisseur',
  'class-wounded',
  'class-alien',
  'class-pirate',
  'class-jock',
  'class-robot',
  'class-billionaire',
  'class-legend',
  'class-filthy',
  'class-extinct',
  'class-the-band',
  'class-evil',
  'class-inbred',
  'class-skeleton',
  'class-shopkeeper',
  'class-outsiders',
  'class-mutant',
  'class-royal',
  'class-zombie',
  'class-wizard',
  'class-guardian',
  'class-media',
  'class-hipster',
  'class-deranged',
  'attack-abyss-gaze',
  'attack-army-of-animals',
  'attack-assault-rifle',
  'attack-awful-breath',
  'attack-awful-smell',
  'attack-bad-confidence',
  'attack-bark',
  'attack-beard-tickle',
  'attack-bend-and-break',
  'attack-berry-blast',
  'attack-big-belly-crush',
  'attack-big-blow',
  'attack-bite',
  'attack-blazing-breath',
  'attack-blinding-lights',
  'attack-blood-cannon',
  'attack-brainstorm',
  'attack-brown-banana',
  'attack-burn',
  'attack-burning-tale',
  'attack-burst-balloon',
  'attack-camouflage',
  'attack-cheat',
  'attack-chocolate-poison',
  'attack-chopstick-jab',
  'attack-cigar-burn',
  'attack-cigarette-burn',
  'attack-clean-dirt',
  'attack-club-attack',
  'attack-color-bomb',
  'attack-comfort',
  'attack-confundo',
  'attack-cover-strike',
  'attack-creeping-venom',
  'attack-cringe-behaviour',
  'attack-cuff-slam',
  'attack-cursed-coin',
  'attack-cut',
  'attack-cutlery-swing',
  'attack-dab',
  'attack-deep-throat',
  'attack-deep-voice',
  'attack-desperate-plea',
  'attack-disguise',
  'attack-double-bag-swing',
  'attack-double-banana',
];
const hasCustomImages = [`class`, `attack`];

const formatTraitValue = (value: string) => {
  if (!value || typeof value !== 'string') return '';
  return value
    .replace(/^(class|attack|special|species|profession)-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

function buildResponsiveImage(basePath: string, alt: string): string {
  // Eager loading as requested; 350 default src with 450/600 in srcset
  return `
    <img
      src="${basePath}_350px.webp"
      srcset="
        ${basePath}_350px.webp 350w,
        ${basePath}_450px.webp 450w,
        ${basePath}_600px.webp 600w
      "
      sizes="(max-width: 640px) 50vw,
             (max-width: 1024px) 33vw,
             25vw"
      alt="${alt}"
      class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      loading="eager"
      width="600"
      height="600"
    />
  `;
}

function renderCard(resource: ResourceNode): string {
  if (!resource || !resource.slug) return '';

  if (resource.type && hasCustomImages.includes(resource.type)) {
    const name = resource.slug.replace(`${resource.type}-`, '');
    const traitUrl = `/${resource.type}/${name}`;
    const typeCapitalized =
      resource.type.charAt(0).toUpperCase() + resource.type.slice(1);
    const displayName = formatTraitValue(resource.slug);
    const useCustom = hasCustomImage.includes(resource.slug);
    const path = resource.type === 'class' ? 'classes' : `${resource.type}s`;
    const imageBase = useCustom
      ? `${IMAGE_URL}${path}/${resource.type}-${name}`
      : `${IMAGE_URL}${path}/${resource.type}`;

    const imageTag = buildResponsiveImage(
      imageBase,
      `${displayName} ${resource.type}`
    );

    return `
        <a href="${traitUrl}" class="group relative block">
          <div class="relative z-10 mx-4 mb-6 flex aspect-square items-center justify-center overflow-hidden rounded-2xl border-2 border-brand-7 bg-gradient-to-br from-amber-50 to-amber-100 shadow-lg transition-all duration-300 group-hover:shadow-xl">
            <div class="flex h-full w-full items-center justify-center bg-black">
              ${imageTag}
            </div>
	    <div class="absolute top-2 right-2 rounded-full bg-red-600 px-2 md:px-4 py-1 md:py-2 text-base md:text-lg font-bold uppercase tracking-wide text-white">
  ${resource.type}
</div>
          </div>
          <div class="relative z-0 -mt-20 rounded-xl bg-brand-7 px-4 pb-4 pt-20 text-white shadow-lg">
            <h3 class="truncate text-sm font-bold uppercase tracking-wide text-white transition-colors duration-200 group-hover:text-amber-200">${typeCapitalized} | ${displayName}</h3>
          </div>
        </a>
      `;
  }

  const category = resource.slug.split('-')[0];
  const characterSlug = resource.slug.split('-').slice(1).join('-');
  if (!category || !characterSlug) return '';

  const characterUrl = `/${category}/${characterSlug}`;
  const categoryCapitalized =
    category.charAt(0).toUpperCase() + category.slice(1);
  const imageBase = `${IMAGE_URL}Sneaky${categoryCapitalized}/Sneaky${categoryCapitalized}_${resource.optionsPayload?.tokenId}`;

  const imageTag = buildResponsiveImage(
    imageBase,
    resource.title || 'Character'
  );

  return `
      <a href="${characterUrl}" class="group relative block">
        <div class="relative z-10 mx-4 mb-6 aspect-square overflow-hidden rounded-2xl border-2 border-brand-7 bg-gradient-to-br from-amber-50 to-amber-100 shadow-lg transition-all duration-300 group-hover:shadow-xl">
          ${imageTag}
        </div>
        <div class="relative z-0 -mt-20 rounded-xl bg-brand-7 px-4 pb-4 pt-20 text-white shadow-lg">
          <div class="mb-2 flex items-center justify-between">
            <h3 class="truncate text-sm font-bold uppercase tracking-wide text-white transition-colors duration-200 group-hover:text-amber-200">${resource.title || 'Unknown'}</h3>
            <span title="Rarity rank order" class="text-sm font-bold text-white">#${resource.optionsPayload?.rarityOrder || 'N/A'}</span>
          </div>
        </div>
      </a>
    `;
}

function updateGrid() {
  if (!gridElement) return;

  const resources = allResources.get();
  if (Object.keys(resources).length === 0) return;

  const collectionsState = activeCollections.get();
  const filtersState = traitFilters.get();
  const viewStateData = viewState.get();

  // Get locked trait context
  const currentLockedTrait = gridElement.dataset.lockedTrait;
  const urlParts = window.location.pathname.split('/');
  const traitValue = urlParts[urlParts.length - 1];
  const fullTraitSlug = currentLockedTrait
    ? `${currentLockedTrait}-${traitValue}`
    : null;

  // --- LOGIC CHANGE START ---
  // This function now centralizes the secondary filtering logic.
  const applySecondaryFilters = (
    characters: ResourceNode[]
  ): ResourceNode[] => {
    return characters.filter((resource) => {
      if (!resource) return false;
      const payload = resource.optionsPayload || {};

      // Build an array of all active filter checks.
      const activeFilters: ((p: any) => boolean)[] = [];

      if (filtersState.selectedClass.length > 0) {
        activeFilters.push((p) => filtersState.selectedClass.includes(p.class));
      }
      if (filtersState.selectedAttack.length > 0) {
        activeFilters.push((p) =>
          filtersState.selectedAttack.includes(p.attack)
        );
      }
      if (filtersState.selectedSpecial.length > 0) {
        activeFilters.push((p) =>
          filtersState.selectedSpecial.includes(p.special)
        );
      }
      if (filtersState.selectedSpecies.length > 0) {
        activeFilters.push((p) =>
          filtersState.selectedSpecies.includes(p.species)
        );
      }
      if (filtersState.selectedProfession.length > 0) {
        activeFilters.push((p) =>
          filtersState.selectedProfession.includes(p.profession)
        );
      }

      // Check range filters.
      if (filtersState.powerRange.length === 2) {
        const [min, max] = filtersState.powerRange;
        activeFilters.push(
          (p) => typeof p.power === 'number' && p.power >= min && p.power <= max
        );
      }
      if (filtersState.sneakinessRange.length === 2) {
        const [min, max] = filtersState.sneakinessRange;
        activeFilters.push(
          (p) =>
            typeof p.sneakiness === 'number' &&
            p.sneakiness >= min &&
            p.sneakiness <= max
        );
      }

      // If there are no active filters, the character passes.
      if (activeFilters.length === 0) return true;

      // The character must pass EVERY active filter (AND logic).
      return activeFilters.every((filterFn) => filterFn(payload));
    });
  };

  const selectedTraitCards: ResourceNode[] = [];
  // This logic for displaying trait cards is only for non-locked pages.
  if (!fullTraitSlug) {
    hasCustomImages.forEach((traitType) => {
      const filterKey =
        `selected${traitType.charAt(0).toUpperCase() + traitType.slice(1)}` as keyof typeof filtersState;
      const selectedSlugs = (filtersState as any)[filterKey] as
        | string[]
        | undefined;

      if (selectedSlugs && selectedSlugs.length > 0) {
        const sourceResources = resources[traitType];
        if (sourceResources) {
          const foundResources = selectedSlugs
            .filter((slug) => hasCustomImage.includes(slug))
            .map((slug): ResourceNode | null => {
              const resource = sourceResources.find((r) => r?.slug === slug);
              if (!resource) return null;
              return { ...resource, type: traitType };
            })
            .filter((r): r is ResourceNode => r !== null);
          selectedTraitCards.push(...foundResources);
        }
      }
    });
  }

  const allCharacterResources: ResourceNode[] = [];
  Object.entries(collectionsState).forEach(([collection, isActive]) => {
    if (isActive && resources[collection]) {
      allCharacterResources.push(...resources[collection]);
    }
  });

  let filteredResources: ResourceNode[];

  if (fullTraitSlug) {
    // On locked trait pages:
    // 1. Filter by the locked trait.
    const initialFilter = allCharacterResources.filter((resource) => {
      if (!resource) return false;
      const payload = resource.optionsPayload || {};
      switch (currentLockedTrait) {
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
    // 2. Apply secondary filters from TraitsExplorer on the result.
    filteredResources = applySecondaryFilters(initialFilter);
  } else {
    // On main explorer pages, just apply the filters.
    filteredResources = applySecondaryFilters(allCharacterResources);
  }
  // --- LOGIC CHANGE END ---

  const sortedResources = [...filteredResources].sort((a, b) => {
    const rarityA = a.optionsPayload?.rarityOrder ?? Infinity;
    const rarityB = b.optionsPayload?.rarityOrder ?? Infinity;
    return rarityA - rarityB;
  });

  const combinedResources = [...selectedTraitCards, ...sortedResources];

  if (viewState.get().totalItems !== combinedResources.length) {
    setTotalItems(combinedResources.length);
  }

  const startIndex = (viewStateData.currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentResources = combinedResources.slice(startIndex, endIndex);

  if (combinedResources.length === 0) {
    gridElement.innerHTML = `
        <div class="flex flex-col items-center justify-center py-16 text-center">
          <div class="mb-4 text-6xl">🔍</div>
          <h3 class="mb-2 text-xl font-bold text-brand-7">No characters found</h3>
          <p class="mb-6 text-gray-500">Try adjusting your filters or search terms.</p>
          <button data-reset-filters class="inline-flex items-center rounded-md bg-brand-7 px-4 py-2 text-sm text-white transition-colors duration-200 hover:bg-black">
            Reset All Filters
          </button>
        </div>
      `;
    if (paginationWrapper) paginationWrapper.style.visibility = 'hidden';

    const resetButton = gridElement.querySelector('[data-reset-filters]');
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        if (currentLockedTrait) {
          // Extract traitValue from URL for locked trait pages
          const urlParts = window.location.pathname.split('/');
          const traitValue = urlParts[urlParts.length - 1];
          resetLockedTraitFilters(currentLockedTrait, traitValue);
        } else {
          resetTraitFilters();
        }
      });
    }
    return;
  }

  const gridHtml = `
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-gray-900">${combinedResources.length} Result${combinedResources.length !== 1 ? 's' : ''}</h2>
      <div class="text-sm text-gray-500">Page ${viewStateData.currentPage} of ${Math.ceil(combinedResources.length / ITEMS_PER_PAGE)}</div>
    </div>
    <div class="grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-4">
      ${currentResources.map(renderCard).join('')}
    </div>
  `;

  gridElement.innerHTML = gridHtml;

  if (paginationWrapper) {
    paginationWrapper.style.visibility =
      combinedResources.length > ITEMS_PER_PAGE ? 'visible' : 'hidden';
  }
}

let oldFilters = JSON.stringify(traitFilters.get());
let oldCollections = JSON.stringify(activeCollections.get());

function handleFilterChange() {
  const currentFilters = traitFilters.get();
  const filtersWithoutSearch = {
    selectedClass: currentFilters.selectedClass,
    selectedAttack: currentFilters.selectedAttack,
    selectedSpecial: currentFilters.selectedSpecial,
    selectedSpecies: currentFilters.selectedSpecies,
    selectedProfession: currentFilters.selectedProfession,
    powerRange: currentFilters.powerRange,
    sneakinessRange: currentFilters.sneakinessRange,
  };

  const newFilters = JSON.stringify(filtersWithoutSearch);
  const newCollections = JSON.stringify(activeCollections.get());

  if (oldFilters !== newFilters || oldCollections !== newCollections) {
    if (viewState.get().currentPage !== 1) {
      setCurrentPage(1);
    } else {
      updateGrid();
    }
    oldFilters = newFilters;
    oldCollections = newCollections;
  }
}

document.addEventListener('rehydrate-stores', () => {
  requestAnimationFrame(() => {
    gridElement = document.getElementById('character-grid');
    paginationWrapper = document.querySelector('[data-pagination-wrapper]');

    if (!gridElement) {
      return;
    }

    const storedData = sessionStorage.getItem('sneaky-resources');
    if (storedData) {
      const data = JSON.parse(storedData);
      allResources.set(data);
      initializeTraitRanges([1, 100], [-100, 100]);
    }
  });
});

allResources.subscribe(updateGrid);
viewState.subscribe(updateGrid);
traitFilters.subscribe(handleFilterChange);
activeCollections.subscribe(handleFilterChange);

export function initializeGrid() {
  // Trigger this script to run
}
