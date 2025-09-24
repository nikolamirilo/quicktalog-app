import { ServicesFormData, UserData } from "@/types"
import ServicesForm from "./components"

export default async function ServicesFormSwitcher({
  type,
  initialData,
  userData,
}: {
  type: "create" | "edit"
  initialData?: ServicesFormData
  userData: UserData
}) {
  return <ServicesForm type={type} userData={userData} initialData={initialData} />
}
