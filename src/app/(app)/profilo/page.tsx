import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { ProfileForm } from "@/components/profile-form";
import { StravaCard } from "@/components/strava-card";
import { getStravaStatus } from "@/lib/strava/sync";
import { Card, PageHeader, buttonClass, cx } from "@/components/ui";
import { getProfileRow, requireProfile } from "@/lib/data";
import { fmt } from "@/lib/format";
import { ageOn, bmr } from "@/lib/nutrition";
import { todayIso } from "@/lib/dates";

export const metadata: Metadata = { title: "Profilo" };

export default async function ProfilePage({ searchParams }: PageProps<"/profilo">) {
  const profile = await requireProfile();
  const [row, strava, { strava: flash }] = await Promise.all([
    getProfileRow(),
    getStravaStatus(),
    searchParams,
  ]);
  const age = ageOn(profile.birthDate, todayIso());
  const rmr = bmr(profile.sex, profile.weightKg, profile.heightCm, age);

  return (
    <>
      <PageHeader
        title="Profilo"
        subtitle={`${age} anni · ${fmt(profile.weightKg, 1)} kg · metabolismo basale ~${fmt(rmr)} kcal`}
      />
      <StravaCard status={strava} flash={typeof flash === "string" ? flash : undefined} />
      <Card className="mb-4">
        <ProfileForm profile={row} />
      </Card>
      <Card className="mb-4 text-sm text-muted">
        <h2 className="mb-1 font-semibold text-text">Come funzionano i calcoli</h2>
        <p>
          Il metabolismo basale è stimato con la formula di Mifflin-St Jeor. I carboidrati
          giornalieri seguono le linee guida IOC/ACSM (da 3 g/kg nei giorni di riposo fino a
          10–12 g/kg nei giorni più duri), le proteine sono 1,6–2,0 g/kg in base
          all&apos;obiettivo e i grassi completano l&apos;energia. Il rifornimento durante
          l&apos;allenamento va da 0 a 90 g/h in base a durata e intensità.
        </p>
        <p className="mt-2">
          Sono indicazioni generali: non sostituiscono il parere di un medico o di un
          nutrizionista.
        </p>
      </Card>
      <form action={signOut}>
        <button type="submit" className={cx(buttonClass.secondary, "w-full")}>
          <LogOut className="h-4 w-4" aria-hidden />
          Esci
        </button>
      </form>
    </>
  );
}
