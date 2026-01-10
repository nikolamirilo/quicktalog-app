import { drizzleClient } from "@/drizzle/db";
import { catalogues } from "@/drizzle/migrations/schema";
import { Catalogue } from "@/types/catalogue";

const page = async () => {
	const data = (await drizzleClient.select().from(catalogues)) as Catalogue[];
	return <div>{JSON.stringify(data)}</div>;
};

export default page;
