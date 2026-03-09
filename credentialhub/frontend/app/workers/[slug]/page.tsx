import type { Metadata } from "next";

import type { PublicWorkerProfile } from "@/lib/public-api-client";

import { PublicWorkerProfileView } from "./public-worker-profile-view";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

async function fetchPublicProfileSSR(
  slug: string,
): Promise<PublicWorkerProfile | null> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/public/workers/${encodeURIComponent(slug)}`,
      {
        cache: "no-store",
      },
    );
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as PublicWorkerProfile;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const data = await fetchPublicProfileSSR(params.slug);
  if (!data) {
    return {
      title: "Worker Profile | CredentialHub",
      description: "Public worker profile on CredentialHub.",
    };
  }

  const topSkill = data.competencies[0]?.competency_name;
  const title = topSkill
    ? `${data.full_name} - Certified ${topSkill} | CredentialHub`
    : `${data.full_name} | CredentialHub`;
  const description = [
    data.bio,
    data.competencies.slice(0, 3).map((item) => item.competency_name).join(", "),
  ]
    .filter(Boolean)
    .join(" ");

  return {
    title,
    description: description || "Public worker profile on CredentialHub.",
  };
}

export default async function PublicWorkerProfilePage({
  params,
}: {
  params: { slug: string };
}) {
  const initialData = await fetchPublicProfileSSR(params.slug);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 p-4 sm:p-6">
      <PublicWorkerProfileView slug={params.slug} initialData={initialData ?? undefined} />
    </div>
  );
}
