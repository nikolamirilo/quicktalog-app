"use client"
import { deleteItem, deleteMultipleItems, duplicateItem, updateItemStatus } from "@/actions/items"
import DeleteMultipleItemsModal from "@/components/modals/DeleteMultipleItemsModal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { tiers } from "@/constants/pricing"
import { statusOrder } from "@/constants/sort"
import { handleDownloadHTML, handleDownloadPng } from "@/helpers/client"
import { ServiceCatalogue } from "@/types"
import { OverviewProps } from "@/types/components"
import { Status } from "@/types/enums"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import { useEffect, useState } from "react"
import { BiScan } from "react-icons/bi"
import { BsQrCodeScan } from "react-icons/bs"
import { FaRegCircleCheck } from "react-icons/fa6"
import { FiCopy, FiEdit, FiInfo, FiMoreVertical, FiTrash2 } from "react-icons/fi"
import { ImEmbed2 } from "react-icons/im"
import { IoCreateOutline } from "react-icons/io5"
import { LuShare2, LuSquareMenu } from "react-icons/lu"
import { RiSparkling2Line } from "react-icons/ri"
import { TbBrandGoogleAnalytics, TbFileAnalytics } from "react-icons/tb"
import { VscActivateBreakpoints } from "react-icons/vsc"
import InformModal from "../../modals/InformModal"

const Overview = ({
  user,
  overallAnalytics,
  catalogues,
  refreshAll,
  planId,
  usage,
}: OverviewProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false)
  const [currentMetric, setCurrentMetric] = useState("")
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [isDeleteMultipleModalOpen, setIsDeleteMultipleModalOpen] = useState(false)
  const [isLinkCopied, setIsLinkCopied] = useState(false)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
  const router = useRouter()
  const matchedTier = tiers.find((tier) => tier.id == planId)
  const maxAllowedCatalogues = matchedTier?.features.catalogues || 0
  const hasExcessCatalogues = catalogues.length > maxAllowedCatalogues
  async function handleDeleteItem(id: string) {
    setItemToDelete(id)
    setIsModalOpen(true)
  }

  async function confirmDelete() {
    if (itemToDelete) {
      await deleteItem(itemToDelete)
      await refreshAll()
      setItemToDelete(null)
      setIsModalOpen(false)
    }
  }

  const statusColors: Record<string, string> = {
    active: "text-white bg-green-700",
    inactive: "text-white bg-product-secondary",
    draft: "text-white bg-product-primary",
  }

  async function handleDuplicateCatalogue(id: string) {
    setDuplicatingId(id)
    try {
      await duplicateItem(id)
      await refreshAll()
    } catch (e) {
      alert("Failed to duplicate item.")
    } finally {
      setDuplicatingId(null)
    }
  }
  async function handleupdateItemStatus(id: string, status: Status) {
    try {
      await updateItemStatus(id, status)
      await refreshAll()
    } catch (e) {
      alert("Failed to update status.")
    } finally {
      setDuplicatingId(null)
    }
  }
  function cancelDelete() {
    setItemToDelete(null)
    setIsModalOpen(false)
  }
  async function handleDeleteMultipleCatalogues(selectedIds: string[]) {
    try {
      const success = await deleteMultipleItems(selectedIds)
      if (success) {
        await refreshAll()
        setIsDeleteMultipleModalOpen(false)
      } else {
        alert("Failed to delete some catalogues. Please try again.")
      }
    } catch (error) {
      console.error("Error deleting multiple catalogues:", error)
      alert("Failed to delete catalogues. Please try again.")
    }
  }

  useEffect(() => {
    if (hasExcessCatalogues) {
      setIsDeleteMultipleModalOpen(true)
    }
  }, [hasExcessCatalogues])
  return (
    <div className="max-w-5xl space-y-6">
      <section className="mb-8 sm:mb-12 bg-product-background rounded-3xl shadow-product-shadow border border-product-border flex flex-col md:flex-row md:items-center gap-4 sm:gap-6 md:gap-8 items-center relative overflow-hidden animate-fade-in p-4 sm:p-6 md:p-8 lg:p-10 text-sm sm:text-base md:text-lg lg:text-xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-product-primary/20 to-product-primary-accent/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-product-primary/20 to-product-primary-accent/20 rounded-full blur-2xl"></div>
        <div className="flex flex-col items-center md:flex-row md:items-center w-full gap-4 sm:gap-6 md:gap-8 z-10">
          <div className="relative flex-shrink-0 flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32">
            <img
              src={user.image}
              alt="Profile"
              width={128}
              height={128}
              className="rounded-full ring-4 ring-product-primary/30 shadow-lg w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32 object-cover"
            />
            <div className="absolute -bottom-1 -right-1 sm:-bottom-1 sm:-right-0 w-4 h-4 sm:w-6 sm:h-6 md:w-7 md:h-7 bg-green-500 rounded-full border-2 border-product-background"></div>
          </div>
          <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-product-foreground mb-1 font-heading">
              Welcome back, {`${user.name}` || "User"}!{" "}
            </div>
            <div className="text-product-foreground-accent flex items-center gap-2 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl break-words font-body">
              {user.email}
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8 sm:mb-12 animate-fade-in">
        <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold mb-4 sm:mb-6 text-product-foreground flex items-center gap-2 sm:gap-3 font-heading">
          <TbFileAnalytics className="text-product-primary w-6 h-6 sm:w-8 sm:h-8" /> Dashboard
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <Card className="p-3 sm:p-4 md:p-6 flex flex-col items-center justify-between bg-product-background border border-product-border shadow-product-shadow hover:shadow-product-hover-shadow transition-all duration-200 animate-fade-in relative">
            <button
              onClick={() => {
                setIsInfoModalOpen(true)
                setCurrentMetric("Total Views")
              }}
              className="absolute top-2 right-2 hover:rounded-full transition-colors duration-200 z-10 hover:text-product-primary">
              <FiInfo size={20} />
            </button>
            <div className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-product-foreground mb-2 text-center">
              Total Views
            </div>
            <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-product-primary">
              {overallAnalytics.totalPageViews}
            </div>
          </Card>
          <Card className="p-3 sm:p-4 md:p-6 flex flex-col items-center justify-between bg-product-background border border-product-border shadow-product-shadow hover:shadow-product-hover-shadow transition-all duration-200 animate-fade-in relative">
            <button
              onClick={() => {
                setIsInfoModalOpen(true)
                setCurrentMetric("Unique Visitors")
              }}
              className="absolute top-2 right-2 hover:rounded-full transition-colors duration-200 z-10 hover:text-product-primary">
              <FiInfo size={20} />
            </button>
            <div className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-product-foreground mb-2 text-center">
              Unique Visitors
            </div>
            <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-product-primary">
              {overallAnalytics.totalUniqueVisitors}
            </div>
          </Card>
          <Card className="p-3 sm:p-4 md:p-6 flex flex-col items-center justify-between bg-product-background border border-product-border shadow-product-shadow hover:shadow-product-hover-shadow transition-all duration-200 animate-fade-in relative">
            <button
              onClick={() => {
                setIsInfoModalOpen(true)
                setCurrentMetric("Total Items")
              }}
              className="absolute top-2 right-2 hover:rounded-full transition-colors duration-200 z-10 hover:text-product-primary">
              <FiInfo size={20} />
            </button>
            <div className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-product-foreground mb-2 text-center">
              Total Items
            </div>
            <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-product-primary">
              {overallAnalytics.totalServiceCatalogues}
            </div>
          </Card>
          <Card className="p-3 sm:p-4 md:p-6 flex flex-col items-center justify-between bg-product-background border border-product-border shadow-product-shadow hover:shadow-product-hover-shadow transition-all duration-200 animate-fade-in relative">
            <button
              onClick={() => {
                setIsInfoModalOpen(true)
                setCurrentMetric("Newsletter")
              }}
              className="absolute top-2 right-2 hover:rounded-full transition-colors duration-200 z-10 hover:text-product-primary">
              <FiInfo size={20} />
            </button>
            <div className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-product-foreground mb-2 text-center">
              Newsletter
            </div>
            <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-product-primary">
              {overallAnalytics.totalNewsletterSubscriptions}
            </div>
          </Card>
        </div>
      </section>
      {/* Catalogues */}
      <section className="mb-8 sm:mb-12 animate-fade-in">
        <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold mb-4 sm:mb-6 text-product-foreground flex items-center gap-2 sm:gap-3 font-heading">
          <LuSquareMenu className="text-product-primary w-6 h-6 sm:w-8 sm:h-8" />
          Catalogues
        </h2>
        <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
          <Button
            disabled={usage.catalogues >= matchedTier.features.catalogues}
            onClick={() => {
              router.push("/admin/create")
            }}>
            <IoCreateOutline size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" /> Create Catalogue
          </Button>
          <Button
            variant="outline"
            className={`${planId < 1 && "animate-pulse"}`}
            disabled={
              usage.prompts >= matchedTier.features.ai_catalogue_generation ||
              usage.catalogues >= matchedTier.features.catalogues
            }
            onClick={() => {
              router.push("/admin/create/ai")
            }}>
            <RiSparkling2Line size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" /> Generate with AI
          </Button>
          <Button
            variant="outline"
            disabled={
              usage.ocr >= matchedTier.features.ocr_ai_import ||
              usage.catalogues >= matchedTier.features.catalogues
            }
            onClick={() => {
              router.push("/admin/create/ocr")
            }}>
            <BiScan size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
            Scan & Import Catalogue
          </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {catalogues.length === 0 && (
            <div className="col-span-full text-product-foreground-accent text-base sm:text-lg">
              No catalogues created yet.
            </div>
          )}
          {catalogues
            ?.sort((a, b) => {
              const statusDiff = statusOrder[a.status] - statusOrder[b.status]
              if (statusDiff !== 0) return statusDiff
              return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            })
            .map((catalogue: ServiceCatalogue) => (
              <Card
                key={catalogue.id}
                className="p-2 md:p-5 flex flex-col gap-2 sm:gap-3 lg:gap-4 relative bg-product-background border border-product-border shadow-product-shadow hover:shadow-product-hover-shadow hover:scale-[1.02] transition-all duration-200 animate-fade-in">
                {/* Three dots menu moved to top */}
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 p-0 text-product-foreground hover:text-product-primary hover:bg-product-background/50 transition-colors duration-200">
                        <FiMoreVertical
                          size={14}
                          className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]"
                        />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      align="end"
                      className="bg-product-background border border-product-border rounded-xl shadow-lg">
                      <Link href={`/admin/items/${catalogue.name}/edit`} passHref>
                        <DropdownMenuItem
                          asChild
                          className="text-product-foreground hover:bg-product-hover-background cursor-pointer">
                          <div className="flex items-center gap-2">
                            <FiEdit size={18} /> Edit
                          </div>
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem
                        onClick={() =>
                          handleupdateItemStatus(
                            catalogue.id,
                            catalogue.status === "active" ? "inactive" : "active"
                          )
                        }
                        disabled={duplicatingId === catalogue.id}
                        className="text-product-foreground hover:bg-product-hover-background cursor-pointer">
                        <span className="flex items-center gap-2">
                          <VscActivateBreakpoints size={18} />
                          {duplicatingId === catalogue.id
                            ? "Loading..."
                            : `${catalogue.status === "active" ? "Deactivate" : "Activate"}`}
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault()
                          setIsLinkCopied(true)
                          navigator.clipboard.writeText(
                            `${process.env.NEXT_PUBLIC_BASE_URL}/catalogues/${catalogue.name}`
                          )
                          setTimeout(() => {
                            setIsLinkCopied(false)
                          }, 3000)
                        }}
                        className="text-product-foreground hover:bg-product-hover-background cursor-pointer">
                        <span className="flex items-center gap-2">
                          {isLinkCopied ? (
                            <FaRegCircleCheck color="green" size={18} />
                          ) : (
                            <LuShare2 size={18} />
                          )}
                          {isLinkCopied === true ? "Link Copied" : `Share`}
                        </span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => handleDownloadPng(catalogue.name)}
                        disabled={isModalOpen}
                        className="text-product-foreground hover:bg-product-hover-background cursor-pointer">
                        <span className="flex items-center gap-2">
                          <BsQrCodeScan size={18} />
                          QR Code
                        </span>
                      </DropdownMenuItem>
                      <div
                        id="qr-code"
                        className="p-2 sm:p-3 bg-white rounded-xl shadow-sm border border-product-border hidden">
                        <QRCodeSVG
                          value={`${process.env.NEXT_PUBLIC_BASE_URL}/catalogues/${catalogue.name}`}
                          size={100}
                          className="w-24 h-24 sm:w-30 sm:h-30 md:w-36 md:h-36"
                          bgColor="white"
                          fgColor="black"
                        />
                      </div>
                      <DropdownMenuItem
                        onClick={() =>
                          handleDownloadHTML(
                            catalogue.name,
                            `${process.env.NEXT_PUBLIC_BASE_URL}/catalogues/${catalogue.name}`
                          )
                        }
                        disabled={isModalOpen}
                        className="text-product-foreground hover:bg-product-hover-background cursor-pointer">
                        <span className="flex items-center gap-2">
                          <ImEmbed2 size={18} />
                          Embed
                        </span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => handleDuplicateCatalogue(catalogue.id)}
                        disabled={
                          usage.catalogues >= matchedTier.features.catalogues
                            ? true
                            : false || duplicatingId === catalogue.id
                        }
                        className="text-product-foreground hover:bg-product-hover-background cursor-pointer">
                        <span className="flex items-center gap-2">
                          <FiCopy size={18} />
                          {duplicatingId === catalogue.id ? "Loading..." : "Duplicate"}
                        </span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => handleDeleteItem(catalogue.id)}
                        disabled={isModalOpen}
                        className="text-red-400 hover:bg-red-50 cursor-pointer">
                        <span className="flex items-center gap-2">
                          <FiTrash2 size={18} />
                          Delete
                        </span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Card content */}
                <div className="font-bold text-sm sm:text-base md:text-lg lg:text-xl text-product-foreground break-words font-heading">
                  {catalogue.name}
                </div>
                <Badge
                  className={`${statusColors[catalogue.status] || "bg-gray-100 text-gray-700"} w-fit`}>
                  {catalogue.status.toUpperCase()}
                </Badge>
                <div className="text-product-foreground-accent text-xs 2xl:text-sm break-words">
                  Updated:{" "}
                  {new Date(catalogue.updated_at).toLocaleString("en-US", {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div className="text-product-foreground-accent text-xs 2xl:text-sm break-words">
                  Created:{" "}
                  {new Date(catalogue.created_at).toLocaleString("en-US", {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>

                <div className="flex flex-col gap-2 sm:gap-3 mt-auto pt-2 sm:pt-3 md:pt-4">
                  <Link href={`/catalogues/${catalogue.name}`} className="w-full">
                    <Button className="w-full">
                      <LuSquareMenu size={12} className="sm:w-3 sm:h-3 md:w-4 md:h-4" />
                      <span className="ml-1">View Catalogue</span>
                    </Button>
                  </Link>
                  <Link href={`/admin/items/${catalogue.name}/analytics`} className="w-full">
                    <Button variant="outline" className="w-full">
                      <TbBrandGoogleAnalytics size={12} className="sm:w-3 sm:h-3 md:w-4 md:h-4" />
                      <span className="ml-1">Analytics</span>
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
        </div>
      </section>
      <InformModal
        isOpen={isModalOpen}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        title="Delete Catalogue"
        message="Are you sure you want to delete this catalogue? This action cannot be undone."
      />

      <DeleteMultipleItemsModal
        isOpen={isDeleteMultipleModalOpen}
        catalogues={catalogues}
        onConfirm={handleDeleteMultipleCatalogues}
        maxAllowed={maxAllowedCatalogues}
      />

      <InformModal
        isOpen={isInfoModalOpen}
        onConfirm={() => setIsInfoModalOpen(false)}
        onCancel={() => setIsInfoModalOpen(false)}
        title={`${currentMetric} Explained`}
        message={
          currentMetric === "Total Views"
            ? "This shows the total number of times your service catalogues have been viewed by visitors. It includes all page visits across all your catalogues."
            : currentMetric === "Unique Visitors"
              ? "This represents the number of unique individuals who have visited your service catalogues. Each person is counted only once, regardless of how many times they visit."
              : currentMetric === "Total Items"
                ? "This displays the total number of service catalogues you have created. Each catalogue represents a different business or service offering."
                : currentMetric === "Newsletter"
                  ? "This shows how many people have subscribed to your newsletter service. These are users who have opted in to receive updates from you."
                  : "Select a metric to see its explanation."
        }
        confirmText="Got it!"
        cancelText=""
      />
    </div>
  )
}

export default Overview
