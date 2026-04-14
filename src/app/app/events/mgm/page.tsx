import { EventsListContent } from "../_shared/EventsListContent";

type PageProps = { searchParams: Promise<{ view?: string }> };

export default async function MgmPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <EventsListContent
      category="MGM"
      label="MGM Meetings"
      basePath="/app/events/mgm"
      searchParams={params}
    />
  );
}
