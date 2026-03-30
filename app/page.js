import { getCatalog } from "@/lib/dropbox";
import CatalogClient from "@/components/CatalogClient";

export const revalidate = 60; // ISR: revalidar cada 60 segundos

export default async function Home() {
  let catalog;

  try {
    catalog = await getCatalog();
  } catch (error) {
    catalog = {
      categories: [],
      products: [],
      lastSync: null,
      error: error.message,
    };
  }

  return <CatalogClient initialData={catalog} />;
}
