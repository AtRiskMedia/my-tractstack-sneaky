import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { Listbox, createListCollection } from '@ark-ui/react/listbox';
import { activeCollections } from '@/custom/store/sneaky';
import {
  CheckBoxUnchecked,
  CheckBoxChecked,
} from '@/custom/components/CheckBoxes';

interface CollectionItem {
  id: string;
  label: string;
  value: keyof typeof activeCollections.value;
}

const collections: CollectionItem[] = [
  { id: 'animals', label: 'Sneaky Animals', value: 'animals' },
  { id: 'people', label: 'Sneaky People', value: 'people' },
  { id: 'stuff', label: 'Sneaky Stuff', value: 'stuff' },
];

export default function CollectionsListbox() {
  const [isMounted, setIsMounted] = useState(false);
  const collectionsState = useStore(activeCollections);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Create collection for Ark UI Listbox
  const collection = useMemo(() => {
    return createListCollection({
      items: collections,
      itemToValue: (item) => item.value,
      itemToString: (item) => item.label,
    });
  }, []);

  // Get currently selected values based on store state
  const selectedValues = useMemo(() => {
    return Object.entries(collectionsState)
      .filter(([_, active]) => active)
      .map(([key]) => key);
  }, [collectionsState]);

  // Handle selection changes
  const handleValueChange = (details: { value: string[] }) => {
    const newState = {
      animals: details.value.includes('animals'),
      people: details.value.includes('people'),
      stuff: details.value.includes('stuff'),
    };
    activeCollections.set(newState);
  };

  // Return placeholder with exact dimensions
  if (!isMounted) {
    return (
      <div className="w-full max-w-none md:max-w-xs">
        <div className="overflow-hidden rounded-lg bg-white shadow-sm outline outline-1 outline-gray-300">
          <div className="border-b border-gray-200 p-4">
            <h3 className="text-lg font-bold">Collections</h3>
          </div>
          <div className="bg-white text-brand-7">
            <div className="relative flex cursor-pointer select-none items-center justify-between py-2 pl-2 pr-10 hover:bg-mywhite hover:text-black">
              <span className="block truncate">Sneaky Animals</span>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <CheckBoxChecked />
              </div>
            </div>
            <div className="relative flex cursor-pointer select-none items-center justify-between py-2 pl-2 pr-10 hover:bg-mywhite hover:text-black">
              <span className="block truncate">Sneaky People</span>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <CheckBoxChecked />
              </div>
            </div>
            <div className="relative flex cursor-pointer select-none items-center justify-between py-2 pl-2 pr-10 hover:bg-mywhite hover:text-black">
              <span className="block truncate">Sneaky Stuff</span>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <CheckBoxChecked />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const customStyles = `
  .collection-item[data-highlighted] {
    background-color: rgba(114, 102, 93, 0.2) !important;
    color: black !important;
  }
  .collection-item svg {
    opacity: 1;
  }
  .collection-item:not(:hover):not([aria-selected="true"]) svg {
    opacity: 0.35;
  }
`;

  return (
    <div className="w-full max-w-none md:max-w-xs">
      <style>{customStyles}</style>
      <div className="overflow-hidden rounded-lg bg-white shadow-sm outline outline-1 outline-gray-300">
        <div className="border-b border-gray-200 p-4">
          <h3 className="text-lg font-bold">Collections</h3>
        </div>

        <Listbox.Root
          collection={collection}
          value={selectedValues}
          onValueChange={handleValueChange}
          selectionMode="multiple"
        >
          <Listbox.Content className="bg-white text-brand-7">
            {collection.items.map((item) => {
              const isChecked = selectedValues.includes(item.value);

              return (
                <Listbox.Item
                  key={item.id}
                  item={item}
                  className="collection-item relative flex cursor-pointer select-none items-center justify-between py-2 pl-2 pr-10 hover:bg-mywhite hover:text-black"
                >
                  <Listbox.ItemText className="block truncate">
                    {item.label}
                  </Listbox.ItemText>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {isChecked ? <CheckBoxChecked /> : <CheckBoxUnchecked />}
                  </div>
                </Listbox.Item>
              );
            })}
          </Listbox.Content>
        </Listbox.Root>
      </div>
    </div>
  );
}
