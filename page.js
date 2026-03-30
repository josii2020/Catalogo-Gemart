import { getCatalog } from "@/lib/dropbox";
import CatalogClient from "@/components/CatalogClient";

export const revalidate = 300; // ISR: revalidar cada 5 minutos

export default async function Home() {
  let catalog;
  try {
    catalog = await getCatalog();
  } catch (error) {
    catalog = { categories: [], products: [], lastSync: null, error: error.message };
  }
  return <CatalogClient initialData={catalog} />;
}
