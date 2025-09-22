import { ScaleLoader } from "react-spinners"

const Loader = ({ type }: { type?: string }) => {
  return (
    <div
      className={`${type !== "dashboard" ? "bg-product-background h-screen" : "h-[50vh]"} flex justify-center items-center w-full `}>
      <ScaleLoader height={40} width={6} className="!text-product-primary" color="#ffc107" />
    </div>
  )
}

export default Loader


export const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
  </div>
)


export const SectionSkeleton = ({ height = "h-64" }: { height?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg ${height} mb-8`}></div>
)
