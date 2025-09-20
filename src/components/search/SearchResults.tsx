import { useState, useMemo } from 'react';
import { Pagination } from '@ark-ui/react/pagination';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { SearchResults as SearchResultsType } from '@/hooks/useSearch';
import type { FullContentMapItem } from '@/types/tractstack';
import { getResourceUrl, getResourceImage } from '@/utils/customHelpers';

interface SearchResultsProps {
  results: SearchResultsType;
  contentMap: FullContentMapItem[];
  onResultClick: () => void;
}

interface ResultItem {
  id: string;
  type: 'StoryFragment' | 'ContextPane' | 'Resource';
  title: string;
  slug: string;
  description?: string;
  topics?: string[];
  changed?: string;
  thumbSrc?: string;
  categorySlug?: string;
  url: string;
  imageSrc: string;
}

const ITEMS_PER_PAGE = 10;

export default function SearchResults({
  results,
  contentMap,
  onResultClick,
}: SearchResultsProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const allResultItems = useMemo(() => {
    const items: ResultItem[] = [];

    results.storyFragmentIds.forEach((id) => {
      const item = contentMap.find(
        (item) => item.id === id && item.type === 'StoryFragment'
      );
      if (item) {
        items.push({
          id: item.id,
          type: 'StoryFragment',
          title: item.title,
          slug: item.slug,
          description: item.description || undefined,
          topics: item.topics || undefined,
          changed: item.changed || undefined,
          thumbSrc: item.thumbSrc || undefined,
          url: `/${item.slug}`,
          imageSrc: item.thumbSrc || '/static.jpg',
        });
      }
    });

    results.contextPaneIds.forEach((id) => {
      const item = contentMap.find(
        (item) => item.id === id && item.type === 'Pane'
      );
      if (item) {
        items.push({
          id: item.id,
          type: 'ContextPane',
          title: item.title,
          slug: item.slug,
          url: `/context/${item.slug}`,
          imageSrc: '/static.jpg',
        });
      }
    });

    results.resourceIds.forEach((id) => {
      const item = contentMap.find(
        (item) => item.id === id && item.type === 'Resource'
      );
      if (item) {
        const resourceUrl = getResourceUrl(item.categorySlug || '', item.slug);
        const resourceImage = getResourceImage(
          item.id,
          item.slug,
          item.categorySlug || ''
        );

        items.push({
          id: item.id,
          type: 'Resource',
          title: item.title,
          slug: item.slug,
          categorySlug: item.categorySlug || undefined,
          url: resourceUrl,
          imageSrc: resourceImage,
        });
      }
    });

    return items.sort((a, b) => {
      const aHasRealImage = a.imageSrc !== '/static.jpg';
      const bHasRealImage = b.imageSrc !== '/static.jpg';

      if (aHasRealImage && !bHasRealImage) return -1;
      if (!aHasRealImage && bHasRealImage) return 1;
      return 0;
    });
  }, [results]);

  const totalPages = Math.ceil(allResultItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = allResultItems.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getResultBadge = (type: string, categorySlug?: string) => {
    switch (type) {
      case 'StoryFragment':
        return (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
            Page
          </span>
        );
      case 'ContextPane':
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
            Context
          </span>
        );
      case 'Resource':
        return (
          <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800">
            {categorySlug || 'Resource'}
          </span>
        );
      default:
        return null;
    }
  };

  if (allResultItems.length === 0) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-mydarkgrey text-lg font-bold">
          {allResultItems.length} result{allResultItems.length !== 1 ? 's' : ''}{' '}
          found
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Showing {startIndex + 1}-
          {Math.min(startIndex + ITEMS_PER_PAGE, allResultItems.length)} of{' '}
          {allResultItems.length}
        </p>
      </div>

      <div className="mb-8 space-y-4">
        {paginatedItems.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-100"
          >
            <a href={item.url} onClick={onResultClick} className="group block">
              <div className="flex items-start gap-4">
                <div
                  className="bg-mydarkgrey hidden flex-shrink-0 overflow-hidden rounded-lg md:block"
                  style={{ width: '120px', height: '67.5px' }}
                >
                  <img
                    src={item.imageSrc}
                    alt={item.title}
                    className="h-full w-full object-contain"
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-2">
                        <h3 className="text-mydarkgrey group-hover:text-myblue line-clamp-2 font-bold transition-colors">
                          {item.title}
                        </h3>
                      </div>

                      {item.type === 'StoryFragment' && item.description && (
                        <p className="mb-2 line-clamp-2 text-sm text-gray-600">
                          {item.description}
                        </p>
                      )}

                      {item.topics && item.topics.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-1">
                          {item.topics.slice(0, 3).map((topic) => (
                            <span
                              key={topic}
                              className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700"
                            >
                              {topic}
                            </span>
                          ))}
                          {item.topics.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{item.topics.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      <p className="truncate text-xs text-gray-500">
                        {item.url}
                      </p>
                    </div>

                    <div className="hidden flex-shrink-0 text-right md:block">
                      <div className="mb-2">
                        {getResultBadge(item.type, item.categorySlug)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </a>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center space-x-1">
          <Pagination.Root
            count={allResultItems.length}
            pageSize={ITEMS_PER_PAGE}
            page={currentPage}
            onPageChange={(details) => handlePageChange(details.page)}
          >
            <Pagination.PrevTrigger className="text-mydarkgrey flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
              <ChevronLeftIcon className="mr-1 h-4 w-4" />
              Previous
            </Pagination.PrevTrigger>

            <Pagination.Context>
              {(pagination) =>
                pagination.pages.map((page, index) =>
                  page.type === 'page' ? (
                    <Pagination.Item
                      key={index}
                      value={page.value}
                      type="page"
                      className={`cursor-pointer rounded-md px-3 py-2 text-sm ${
                        page.value === currentPage
                          ? 'bg-myblue text-white'
                          : 'text-mydarkgrey hover:bg-gray-50'
                      }`}
                    >
                      {page.value}
                    </Pagination.Item>
                  ) : (
                    <span key={index} className="px-2 text-gray-400">
                      ...
                    </span>
                  )
                )
              }
            </Pagination.Context>

            <Pagination.NextTrigger className="text-mydarkgrey flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
              Next
              <ChevronRightIcon className="ml-1 h-4 w-4" />
            </Pagination.NextTrigger>
          </Pagination.Root>
        </div>
      )}
    </div>
  );
}
