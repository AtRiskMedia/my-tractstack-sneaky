import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { Pagination as ArkPagination } from '@ark-ui/react/pagination';
import { viewState, setCurrentPage } from '../store/sneaky';

const ITEMS_PER_PAGE = 12;

export default function Pagination() {
  const [isMounted, setIsMounted] = useState(false);
  const { currentPage, totalItems } = useStore(viewState);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handlePageChange = (details: { page: number }) => {
    // This line correctly updates the nanostore, which is all that's needed.
    setCurrentPage(details.page);

    // REDUNDANT EVENT DISPATCH REMOVED.
    // The grid-updater is subscribed directly to the nanostore.
  };

  if (!isMounted || totalItems <= ITEMS_PER_PAGE) {
    return null;
  }

  return (
    <ArkPagination.Root
      count={totalItems}
      pageSize={ITEMS_PER_PAGE}
      page={currentPage}
      siblingCount={1}
      onPageChange={handlePageChange}
      className="flex flex-wrap items-center gap-2"
    >
      <ArkPagination.PrevTrigger className="rounded-md border border-brand-7 bg-white px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
        Previous
      </ArkPagination.PrevTrigger>

      <ArkPagination.Context>
        {(pagination) =>
          pagination.pages.map((page, index) =>
            page.type === 'page' ? (
              <ArkPagination.Item
                key={index}
                {...page}
                className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 data-[selected]:border-brand-7 data-[selected]:bg-brand-7 data-[selected]:text-white"
              >
                {page.value}
              </ArkPagination.Item>
            ) : (
              <ArkPagination.Ellipsis
                key={index}
                index={index}
                className="px-3 py-2 text-sm text-gray-500"
              >
                …
              </ArkPagination.Ellipsis>
            )
          )
        }
      </ArkPagination.Context>

      <ArkPagination.NextTrigger className="rounded-md border border-brand-7 bg-white px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
        Next
      </ArkPagination.NextTrigger>
    </ArkPagination.Root>
  );
}
