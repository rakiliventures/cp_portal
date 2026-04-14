import { EventsListContent } from "../_shared/EventsListContent";

type PageProps = { searchParams: Promise<{ view?: string }> };

export default async function CpEventsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <EventsListContent
      category="CP_EVENT"
      label="CP Events"
      basePath="/app/events/cp-events"
      searchParams={params}
    />
  );
}
