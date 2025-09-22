import { getUserData } from "@/actions/users"
import { ServicesFormData } from "@/types"
import ServicesForm from "./components"

export default async function ServicesFormSwitcher({
  type,
  initialData,
}: {
  type: "create" | "edit"
  initialData?: ServicesFormData
}) {
  const userData = await getUserData()
  return <ServicesForm type={type} userData={userData} initialData={initialData} />
}
