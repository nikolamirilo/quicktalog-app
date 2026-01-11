import { drizzleClient } from "@/utils/drizzle";

const page = async () => {
	const data = await drizzleClient.query.catalogues.findMany({});
	console.log(data);
	return <div>page</div>;
};

export default page;
