import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { Listbox, createListCollection } from '@ark-ui/react/listbox';
import { Slider } from '@ark-ui/react/slider';
import FunnelIcon from '@heroicons/react/24/outline/FunnelIcon';
import {
  CheckBoxUnchecked,
  CheckBoxChecked,
} from '@/custom/components/CheckBoxes';
import {
  allResources,
  activeCollections,
  traitFilters,
  setTraitSearch,
  setTraitSelection,
  setTraitRange,
  resetTraitFilters,
  resetLockedTraitFilters,
} from '@/custom/store/sneaky';
import type { ResourceNode } from '@/types/compositorTypes';

export interface Props {
  lockedTrait?: string;
  traitValue?: string;
  lockedCollection?: string;
}

interface TraitItem {
  slug: string;
  title: string;
  category: string;
}

interface TraitsData {
  class: TraitItem[];
  attack: TraitItem[];
  special: TraitItem[];
  species: TraitItem[];
  profession: TraitItem[];
}

interface AccordionState {
  [key: string]: boolean;
}

export default function TraitsExplorer({
  lockedTrait,
  traitValue,
  lockedCollection,
}: Props) {
  const [isMounted, setIsMounted] = useState(false);
  const resources = useStore(allResources);
  const collectionsState = useStore(activeCollections);
  const filtersState = useStore(traitFilters);

  const [showFilters, setShowFilters] = useState(false);
  const [accordionState, setAccordionState] = useState<AccordionState>({
    class: true,
    power: true,
    sneakiness: true,
    attack: !!lockedTrait,
    special: !!lockedTrait,
    profession: !!lockedTrait,
    species: !!lockedTrait,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (lockedCollection && lockedCollection !== 'all') {
      activeCollections.set({
        animals: lockedCollection === 'animals',
        people: lockedCollection === 'people',
        stuff: lockedCollection === 'stuff',
      });
    }
  }, [lockedCollection]);

  const filteredResources = useMemo(() => {
    const allCharacterResources: ResourceNode[] = [];
    Object.entries(collectionsState).forEach(([collection, isActive]) => {
      if (isActive && resources[collection]) {
        allCharacterResources.push(...resources[collection]);
      }
    });
    return allCharacterResources;
  }, [resources, collectionsState]);

  const traitsData = useMemo((): TraitsData => {
    const relevantResources =
      lockedTrait && traitValue
        ? filteredResources.filter((resource) => {
            const payload = resource.optionsPayload || {};
            const fullTraitSlug = `${lockedTrait}-${traitValue}`;
            return (
              payload[lockedTrait as keyof typeof payload] === fullTraitSlug
            );
          })
        : filteredResources;

    const classSet = new Set<string>();
    const attackSet = new Set<string>();
    const specialSet = new Set<string>();
    const speciesSet = new Set<string>();
    const professionSet = new Set<string>();

    relevantResources.forEach((resource: ResourceNode) => {
      const payload = resource.optionsPayload || {};
      if (payload.class) classSet.add(payload.class);
      if (payload.attack) attackSet.add(payload.attack);
      if (payload.special && payload.special !== 'special-none')
        specialSet.add(payload.special);
      if (payload.species) speciesSet.add(payload.species);
      if (payload.profession) professionSet.add(payload.profession);
    });

    const createTraits = (set: Set<string>, category: string) =>
      Array.from(set).map((slug) => ({
        slug,
        title: slug
          .replace(new RegExp(`^${category}-`), '')
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        category,
      }));

    return {
      class: createTraits(classSet, 'class'),
      attack: createTraits(attackSet, 'attack'),
      special: createTraits(specialSet, 'special'),
      species: createTraits(speciesSet, 'species'),
      profession: createTraits(professionSet, 'profession'),
    };
  }, [filteredResources, lockedTrait, traitValue]);

  const hasActiveFilters = useMemo(() => {
    const searchTermActive = filtersState.searchTerm.trim() !== '';
    const classActive =
      lockedTrait !== 'class' && filtersState.selectedClass.length > 0;
    const attackActive =
      lockedTrait !== 'attack' && filtersState.selectedAttack.length > 0;
    const specialActive =
      lockedTrait !== 'special' && filtersState.selectedSpecial.length > 0;
    const speciesActive =
      lockedTrait !== 'species' && filtersState.selectedSpecies.length > 0;
    const professionActive =
      lockedTrait !== 'profession' &&
      filtersState.selectedProfession.length > 0;

    // Check power range
    const isPowerRangeActive =
      filtersState.powerRange.length === 2 &&
      (filtersState.powerRange[0] !== 1 || filtersState.powerRange[1] !== 100);

    // Check sneakiness range
    const isSneakinessRangeActive =
      filtersState.sneakinessRange.length === 2 &&
      (filtersState.sneakinessRange[0] !== -100 ||
        filtersState.sneakinessRange[1] !== 100);

    const result =
      searchTermActive ||
      classActive ||
      attackActive ||
      specialActive ||
      speciesActive ||
      professionActive ||
      isPowerRangeActive ||
      isSneakinessRangeActive;

    return result;
  }, [filtersState, lockedTrait]);

  const toggleAccordion = (section: string) => {
    setAccordionState((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const filteredTraits = useMemo(() => {
    if (!filtersState.searchTerm.trim()) return traitsData;
    const searchLower = filtersState.searchTerm.toLowerCase();
    const filter = (traits: TraitItem[]) =>
      traits.filter(
        (trait) =>
          trait.slug.toLowerCase().includes(searchLower) ||
          trait.title.toLowerCase().includes(searchLower)
      );
    return {
      ...traitsData,
      class: filter(traitsData.class),
      attack: filter(traitsData.attack),
      special: filter(traitsData.special),
      species: filter(traitsData.species),
      profession: filter(traitsData.profession),
    };
  }, [traitsData, filtersState.searchTerm]);

  const collections = {
    class: useMemo(
      () =>
        createListCollection({
          items: filteredTraits.class.sort((a, b) =>
            a.title.localeCompare(b.title)
          ),
          itemToValue: (item) => item.slug,
          itemToString: (item) => item.title,
        }),
      [filteredTraits.class]
    ),
    attack: useMemo(
      () =>
        createListCollection({
          items: filteredTraits.attack.sort((a, b) =>
            a.title.localeCompare(b.title)
          ),
          itemToValue: (item) => item.slug,
          itemToString: (item) => item.title,
        }),
      [filteredTraits.attack]
    ),
    special: useMemo(
      () =>
        createListCollection({
          items: filteredTraits.special.sort((a, b) =>
            a.title.localeCompare(b.title)
          ),
          itemToValue: (item) => item.slug,
          itemToString: (item) => item.title,
        }),
      [filteredTraits.special]
    ),
    species: useMemo(
      () =>
        createListCollection({
          items: filteredTraits.species.sort((a, b) =>
            a.title.localeCompare(b.title)
          ),
          itemToValue: (item) => item.slug,
          itemToString: (item) => item.title,
        }),
      [filteredTraits.species]
    ),
    profession: useMemo(
      () =>
        createListCollection({
          items: filteredTraits.profession.sort((a, b) =>
            a.title.localeCompare(b.title)
          ),
          itemToValue: (item) => item.slug,
          itemToString: (item) => item.title,
        }),
      [filteredTraits.profession]
    ),
  };

  useEffect(() => {
    setAccordionState((prevState) => ({
      ...prevState,
      class: prevState.class || filtersState.selectedClass.length > 0,
      attack: prevState.attack || filtersState.selectedAttack.length > 0,
      special: prevState.special || filtersState.selectedSpecial.length > 0,
      species: prevState.species || filtersState.selectedSpecies.length > 0,
      profession:
        prevState.profession || filtersState.selectedProfession.length > 0,
    }));
  }, [filtersState]);

  useEffect(() => {
    if (lockedTrait) return;

    const searchNormalized = filtersState.searchTerm
      .toLowerCase()
      .replace(/\s+/g, '');
    const timeout = setTimeout(() => {
      const newSelections = {
        selectedClass: searchNormalized
          ? traitsData.class
              .filter((t) =>
                t.title
                  .toLowerCase()
                  .replace(/\s+/g, '')
                  .includes(searchNormalized)
              )
              .map((t) => t.slug)
          : [],
        selectedAttack: searchNormalized
          ? traitsData.attack
              .filter((t) =>
                t.title
                  .toLowerCase()
                  .replace(/\s+/g, '')
                  .includes(searchNormalized)
              )
              .map((t) => t.slug)
          : [],
        selectedSpecial: searchNormalized
          ? traitsData.special
              .filter((t) =>
                t.title
                  .toLowerCase()
                  .replace(/\s+/g, '')
                  .includes(searchNormalized)
              )
              .map((t) => t.slug)
          : [],
        selectedSpecies: searchNormalized
          ? traitsData.species
              .filter((t) =>
                t.title
                  .toLowerCase()
                  .replace(/\s+/g, '')
                  .includes(searchNormalized)
              )
              .map((t) => t.slug)
          : [],
        selectedProfession: searchNormalized
          ? traitsData.profession
              .filter((t) =>
                t.title
                  .toLowerCase()
                  .replace(/\s+/g, '')
                  .includes(searchNormalized)
              )
              .map((t) => t.slug)
          : [],
      };
      traitFilters.set({ ...traitFilters.get(), ...newSelections });
    }, 100);
    return () => clearTimeout(timeout);
  }, [traitsData, filtersState.searchTerm, lockedTrait]);

  // Return placeholder with exact structure and dimensions
  if (!isMounted) {
    return (
      <div className="w-full max-w-none md:max-w-xs" style={{ minWidth: 280 }}>
        <div className="mb-4 md:hidden">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm"></div>
              <div className="flex h-10 w-20 items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700">
                <FunnelIcon className="h-4 w-4" />
                <span>Show</span>
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <div className="border-b p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Traits</h3>
            </div>
            <div className="mt-3 hidden md:block">
              <div className="h-10 w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm"></div>
            </div>
          </div>

          <div className="border-b">
            <div className="flex w-full items-center justify-between border-b p-3 text-left">
              <span className="text-sm font-bold uppercase tracking-wide text-gray-700">
                CLASS
              </span>
              <svg
                className="h-4 w-4 rotate-180 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
            <div style={{ height: '200px' }} className="overflow-hidden">
              <div style={{ height: '200px', overflowY: 'auto' }}>
                <div className="p-4 text-sm italic text-gray-500">
                  Loading traits...
                </div>
              </div>
            </div>
          </div>

          <div className="border-b">
            <div className="flex w-full items-center justify-between border-b p-3 text-left">
              <span className="text-sm font-bold uppercase tracking-wide text-gray-700">
                POWER
              </span>
              <svg
                className="h-4 w-4 rotate-180 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
            <div style={{ height: '128px' }} className="overflow-hidden">
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-gray-600">Power</span>
                  <span className="text-xs text-gray-500">1 - 100</span>
                </div>
                <div
                  className="relative px-2"
                  style={{ marginLeft: '48px', marginRight: '48px' }}
                >
                  <div className="relative h-2 rounded-full bg-gray-200">
                    <div
                      className="absolute h-full rounded-full bg-brand-7"
                      style={{ width: '100%' }}
                    ></div>
                  </div>
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-400">
                  <span>1</span>
                  <span>100</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b">
            <div className="flex w-full items-center justify-between border-b p-3 text-left">
              <span className="text-sm font-bold uppercase tracking-wide text-gray-700">
                SNEAKINESS
              </span>
              <svg
                className="h-4 w-4 rotate-180 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
            <div style={{ height: '128px' }} className="overflow-hidden">
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-gray-600">Sneakiness</span>
                  <span className="text-xs text-gray-500">-100 - 100</span>
                </div>
                <div
                  className="relative px-2"
                  style={{ marginLeft: '48px', marginRight: '48px' }}
                >
                  <div className="relative h-2 rounded-full bg-gray-200">
                    <div
                      className="absolute h-full rounded-full bg-brand-7"
                      style={{ width: '100%' }}
                    ></div>
                  </div>
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-400">
                  <span>-100</span>
                  <span>100</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b">
            <div className="flex w-full items-center justify-between border-b p-3 text-left">
              <span className="text-sm font-bold uppercase tracking-wide text-gray-700">
                ATTACK
              </span>
              <svg
                className="h-4 w-4 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          <div className="border-b">
            <div className="flex w-full items-center justify-between border-b p-3 text-left">
              <span className="text-sm font-bold uppercase tracking-wide text-gray-700">
                SPECIAL ATTACK
              </span>
              <svg
                className="h-4 w-4 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          <div className="border-b">
            <div className="flex w-full items-center justify-between border-b p-3 text-left">
              <span className="text-sm font-bold uppercase tracking-wide text-gray-700">
                SPECIES
              </span>
              <svg
                className="h-4 w-4 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          <div className="border-b">
            <div className="flex w-full items-center justify-between border-b p-3 text-left">
              <span className="text-sm font-bold uppercase tracking-wide text-gray-700">
                PROFESSION
              </span>
              <svg
                className="h-4 w-4 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const AccordionHeader = ({
    title,
    section,
  }: {
    title: string;
    section: string;
  }) => (
    <button
      onClick={() => toggleAccordion(section)}
      className="flex w-full items-center justify-between border-b p-3 text-left hover:bg-gray-50"
    >
      <span className="text-sm font-bold uppercase tracking-wide text-gray-700">
        {title}
      </span>
      <svg
        className={`h-4 w-4 transition-transform ${accordionState[section] ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>
  );

  const TraitListbox = ({
    collection,
    selectedValues,
    onValueChange,
    section,
  }: {
    collection: any;
    selectedValues: string[];
    onValueChange: (details: { value: string[] }) => void;
    section: string;
  }) => (
    <div className={accordionState[section] ? 'block' : 'hidden'}>
      {collection.items.length > 0 ? (
        <Listbox.Root
          collection={collection}
          value={selectedValues}
          onValueChange={onValueChange}
          selectionMode="multiple"
        >
          <Listbox.Content
            className="border-0 bg-white text-brand-7"
            style={{ maxHeight: '200px', overflowY: 'auto' }}
          >
            {collection.items.map((item: TraitItem) => (
              <Listbox.Item
                key={item.slug}
                item={item}
                className="trait-item relative flex cursor-pointer select-none items-center justify-between py-2 pl-2 pr-10 text-sm hover:bg-gray-100"
              >
                <Listbox.ItemText className="block truncate">
                  {item.title}
                </Listbox.ItemText>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {selectedValues.includes(item.slug) ? (
                    <CheckBoxChecked />
                  ) : (
                    <CheckBoxUnchecked />
                  )}
                </div>
              </Listbox.Item>
            ))}
          </Listbox.Content>
        </Listbox.Root>
      ) : (
        <div className="p-4 text-sm italic text-gray-500">
          No matching traits available
        </div>
      )}
    </div>
  );

  const RangeSlider = ({
    label,
    value,
    onChange,
    section,
  }: {
    label: string;
    value: number[];
    onChange: (details: { value: number[] }) => void;
    section: string;
  }) => {
    const [tempValue, setTempValue] = useState(value);
    if (!Array.isArray(value) || value.length !== 2) {
      return (
        <div className={accordionState[section] ? 'block' : 'hidden'}>
          <div className="p-4 text-sm italic text-gray-500">
            Loading range...
          </div>
        </div>
      );
    }
    const min = section === 'power' ? 1 : -100;
    const max = section === 'power' ? 100 : 100;
    return (
      <div className={accordionState[section] ? 'block' : 'hidden'}>
        <div className="p-4">
          <Slider.Root
            value={tempValue}
            onValueChange={(d) => setTempValue(d.value)}
            onValueChangeEnd={(d) => onChange({ value: d.value })}
            min={min}
            max={max}
            step={1}
          >
            <div className="mb-2 flex items-center justify-between">
              <Slider.Label className="text-sm text-gray-600">
                {label}
              </Slider.Label>
              <Slider.ValueText className="text-xs text-gray-500" />
            </div>
            <Slider.Control
              className="relative px-2"
              style={{ marginLeft: '24px', marginRight: '24px' }}
            >
              <Slider.Track className="relative h-2 rounded-full bg-gray-200">
                <Slider.Range className="absolute h-full rounded-full bg-brand-7" />
              </Slider.Track>
              <Slider.Thumb
                index={0}
                className="block h-4 w-4 rounded-full border-2 border-brand-7 bg-white shadow focus:outline-none"
              />
              <Slider.Thumb
                index={1}
                className="block h-4 w-4 rounded-full border-2 border-brand-7 bg-white shadow focus:outline-none"
              />
            </Slider.Control>
            <div className="mt-1 flex justify-between text-xs text-gray-400">
              <span>{min}</span>
              <span>{max}</span>
            </div>
          </Slider.Root>
        </div>
      </div>
    );
  };

  const customStyles = `.trait-item[data-highlighted] { background-color: rgba(114, 102, 93, 0.2) !important; color: black !important; }`;

  return (
    <div className="w-full max-w-none md:max-w-xs" style={{ minWidth: 280 }}>
      <style>{customStyles}</style>
      <div className="mb-4 md:hidden">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search..."
              value={filtersState.searchTerm}
              onChange={(e) => setTraitSearch(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <FunnelIcon className="h-4 w-4" />
              {showFilters ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
      </div>
      {hasActiveFilters && (
        <div className="border-b p-2">
          <button
            onClick={() =>
              lockedTrait
                ? resetLockedTraitFilters(lockedTrait)
                : resetTraitFilters()
            }
            className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            Clear Filters
          </button>
        </div>
      )}
      <div
        className={`overflow-hidden rounded-lg border bg-white shadow-sm ${showFilters ? 'block' : 'hidden'} md:block`}
      >
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Traits</h3>
          </div>
          {!lockedTrait && (
            <div className="mt-3 hidden md:block">
              <input
                type="text"
                placeholder="Search for Traits..."
                value={filtersState.searchTerm}
                onChange={(e) => setTraitSearch(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          )}
        </div>

        {lockedTrait !== 'class' && traitsData.class.length > 0 && (
          <div className="border-b">
            <AccordionHeader title="CLASS" section="class" />
            <TraitListbox
              collection={collections.class}
              selectedValues={filtersState.selectedClass}
              onValueChange={(d) => setTraitSelection('selectedClass', d.value)}
              section="class"
            />
          </div>
        )}

        {filtersState.powerRange.length === 2 && (
          <div className="border-b">
            <AccordionHeader title="POWER" section="power" />
            <RangeSlider
              label="Power"
              value={filtersState.powerRange}
              onChange={(d) => setTraitRange('powerRange', d.value)}
              section="power"
            />
          </div>
        )}

        {filtersState.sneakinessRange.length === 2 && (
          <div className="border-b">
            <AccordionHeader title="SNEAKINESS" section="sneakiness" />
            <RangeSlider
              label="Sneakiness"
              value={filtersState.sneakinessRange}
              onChange={(d) => setTraitRange('sneakinessRange', d.value)}
              section="sneakiness"
            />
          </div>
        )}

        {lockedTrait !== 'attack' && traitsData.attack.length > 0 && (
          <div className="border-b">
            <AccordionHeader title="ATTACK" section="attack" />
            <TraitListbox
              collection={collections.attack}
              selectedValues={filtersState.selectedAttack}
              onValueChange={(d) =>
                setTraitSelection('selectedAttack', d.value)
              }
              section="attack"
            />
          </div>
        )}

        {lockedTrait !== 'special' && traitsData.special.length > 0 && (
          <div className="border-b">
            <AccordionHeader title="SPECIAL ATTACK" section="special" />
            <TraitListbox
              collection={collections.special}
              selectedValues={filtersState.selectedSpecial}
              onValueChange={(d) =>
                setTraitSelection('selectedSpecial', d.value)
              }
              section="special"
            />
          </div>
        )}

        {lockedTrait !== 'species' && traitsData.species.length > 0 && (
          <div className="border-b">
            <AccordionHeader title="SPECIES" section="species" />
            <TraitListbox
              collection={collections.species}
              selectedValues={filtersState.selectedSpecies}
              onValueChange={(d) =>
                setTraitSelection('selectedSpecies', d.value)
              }
              section="species"
            />
          </div>
        )}

        {lockedTrait !== 'profession' && traitsData.profession.length > 0 && (
          <div className="border-b">
            <AccordionHeader title="PROFESSION" section="profession" />
            <TraitListbox
              collection={collections.profession}
              selectedValues={filtersState.selectedProfession}
              onValueChange={(d) =>
                setTraitSelection('selectedProfession', d.value)
              }
              section="profession"
            />
          </div>
        )}
      </div>
    </div>
  );
}
