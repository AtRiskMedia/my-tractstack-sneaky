import type { ReactNode } from 'react';

// Define the Story interface for type safety
interface Story {
  id: string;
  title: string;
  description: string;
  slug: string;
  changed: string;
}

// Fake data for the featured story
const fakeFeaturedStory: Story = {
  id: 'featured-1',
  title: 'Sample Featured Story',
  description: 'This is a sample description for the featured story.',
  slug: 'sample-featured',
  changed: '2023-01-01T00:00:00Z',
};

// Fake data for included stories
const fakeIncludedStories: Story[] = [
  {
    id: 'story-1',
    title: 'Sample Story 1',
    description: 'Description for sample story 1.',
    slug: 'sample-story-1',
    changed: '2023-01-02T00:00:00Z',
  },
  {
    id: 'story-2',
    title: 'Sample Story 2',
    description: 'Description for sample story 2.',
    slug: 'sample-story-2',
    changed: '2023-01-03T00:00:00Z',
  },
  {
    id: 'story-3',
    title: 'Sample Story 3',
    description: 'Description for sample story 3.',
    slug: 'sample-story-3',
    changed: '2023-01-04T00:00:00Z',
  },
  {
    id: 'story-4',
    title: 'Sample Story 4',
    description: 'Description for sample story 4.',
    slug: 'sample-story-4',
    changed: '2023-01-05T00:00:00Z',
  },
  {
    id: 'story-5',
    title: 'Sample Story 5',
    description: 'Description for sample story 5.',
    slug: 'sample-story-5',
    changed: '2023-01-06T00:00:00Z',
  },
];

// Utility function to format dates
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

// Component definition
const FeaturedContentPreview = (): ReactNode => {
  return (
    <div className="flex flex-col gap-4 py-12 md:flex-row">
      {/* Featured Story Section */}
      <div className="p-4 md:w-3/5">
        <div className="space-y-6 p-2">
          {/* Placeholder for featured image */}
          <div
            style={{
              width: '100%',
              height: '300px',
              backgroundColor: '#e0e0e0',
            }}
            className="rounded-lg"
          />
          <h2 className="text-2xl font-bold text-black">
            {fakeFeaturedStory.title}
          </h2>
          <p className="text-base text-myblack">
            {fakeFeaturedStory.description}
          </p>
          <p className="text-sm text-mydarkgrey">
            {formatDate(fakeFeaturedStory.changed)}
          </p>
        </div>
      </div>
      {/* Included Stories Section */}
      <div className="border-t-2 border-slate-100 p-4 md:w-2/5 md:border-l-2 md:border-t-0">
        <div className="space-y-4">
          {fakeIncludedStories.map((story) => (
            <div key={story.id} className="flex items-start space-x-4 p-1">
              {/* Placeholder for story image */}
              <div
                style={{
                  width: '100px',
                  height: '100px',
                  backgroundColor: '#d0d0d0',
                }}
                className="rounded-md"
              />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-black">{story.title}</h3>
                <p className="line-clamp-2 text-sm text-myblack">
                  {story.description}
                </p>
                <p className="mt-1 text-xs text-mydarkgrey">
                  {formatDate(story.changed)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturedContentPreview;
