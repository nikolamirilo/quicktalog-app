"use client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { FiFileText } from "react-icons/fi"
import { LuSquareMenu } from "react-icons/lu"
import { TbBrandGoogleAnalytics } from "react-icons/tb"
import ItemDropdownMenu from "./ItemDropdownMenu"

const DashboardItem = ({
  catalogue,
  duplicatingId,
  handleUpdateItemStatus,
  setIsLinkCopied,
  isLinkCopied,
  isModalOpen,
  handleDuplicateCatalogue,
  handleDeleteItem,
  usage,
  matchedTier,
  statusColors,
  sourceConfig,
}) => {
  return (
    <Card
      key={catalogue.id}
      className="p-2 md:p-5 flex flex-col gap-2 sm:gap-3 lg:gap-4 relative bg-product-background border border-product-border shadow-product-shadow hover:shadow-product-hover-shadow hover:scale-[1.02] transition-all duration-200 animate-fade-in">
      <ItemDropdownMenu
        catalogue={catalogue}
        duplicatingId={duplicatingId}
        handleUpdateItemStatus={handleUpdateItemStatus}
        setIsLinkCopied={setIsLinkCopied}
        isLinkCopied={isLinkCopied}
        isModalOpen={isModalOpen}
        handleDuplicateCatalogue={handleDuplicateCatalogue}
        handleDeleteItem={handleDeleteItem}
        usage={usage}
        matchedTier={matchedTier}
      />

      <div className="font-heading font-bold text-sm sm:text-base md:text-lg lg:text-xl text-product-foreground break-words">
        {catalogue.name}
      </div>

      <div className="flex flex-row gap-2 items-center">
        <Badge
          className={`${statusColors[catalogue.status] || "bg-gray-100 text-gray-700"} w-fit rounded`}>
          {catalogue.status.toUpperCase()}
        </Badge>

        {(() => {
          const source = sourceConfig[catalogue.source] || {
            label: catalogue.source,
            className: "bg-gray-100 text-gray-700",
            Icon: FiFileText,
          }
          const { label, className, Icon } = source
          return (
            <span
              className={`${className} flex items-center gap-1 w-fit rounded px-2 py-0.5 text-xs font-medium`}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </span>
          )
        })()}
      </div>

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
  )
}

export default DashboardItem
