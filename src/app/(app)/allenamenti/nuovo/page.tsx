import type { Metadata } from "next";
import { Card, PageHeader } from "@/components/ui";
import { WorkoutForm } from "@/components/workout-form";
import { getToday, requireProfile } from "@/lib/data";
import { isIsoDate } from "@/lib/dates";

export const metadata: Metadata = { title: "Nuovo allenamento" };

export default async function NewWorkoutPage({ searchParams }: PageProps<"/allenamenti/nuovo">) {
  const profile = await requireProfile();
  const { data } = await searchParams;
  const date = isIsoDate(data) ? data : await getToday();
  return (
    <>
      <PageHeader title="Nuovo allenamento" subtitle="Pianificato o già fatto: il piano si aggiorna subito." />
      <Card>
        <WorkoutForm date={date} defaultSport={profile.mainSport} />
      </Card>
    </>
  );
}
