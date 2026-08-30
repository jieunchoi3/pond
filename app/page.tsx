import { PondScreen } from "@/components/pond/PondScreen";
import { loadPondState } from "@/lib/notes/sync";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const initial = await loadPondState();
  return <PondScreen initial={initial} />;
}
