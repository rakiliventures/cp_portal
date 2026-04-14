import { EventsListContent } from "../_shared/EventsListContent";

type PageProps = { searchParams: Promise<{ view?: string }> };

export default async function KachaiPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <EventsListContent
      category="KACHAI"
      label="Kachai"
      basePath="/app/events/kachai"
      searchParams={params}
    />
  );
}
