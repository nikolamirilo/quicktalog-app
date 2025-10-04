"use client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { handleDownloadHTML, handleDownloadPng } from "@/helpers/client"
import Link from "next/link"
import { QRCodeSVG } from "qrcode.react"
import { BsQrCodeScan } from "react-icons/bs"
import { FaRegCircleCheck } from "react-icons/fa6"
import { FiCopy, FiDownload, FiEdit, FiMoreVertical, FiTrash2 } from "react-icons/fi"
import { ImEmbed2 } from "react-icons/im"
import { LuShare2 } from "react-icons/lu"
import { VscActivateBreakpoints } from "react-icons/vsc"

const ItemDropdownMenu = ({
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
}) => {
  return (
    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 z-10">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 p-0 text-product-foreground hover:text-product-primary hover:bg-product-background/50 transition-colors duration-200">
            <FiMoreVertical size={14} className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" />
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
              handleUpdateItemStatus(
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
              {isLinkCopied ? <FaRegCircleCheck color="green" size={18} /> : <LuShare2 size={18} />}
              {isLinkCopied === true ? "Link Copied" : `Share`}
            </span>
          </DropdownMenuItem>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="text-product-foreground hover:bg-product-hover-background cursor-pointer">
              <span className="flex items-center gap-2">
                <FiDownload size={18} />
                Download
              </span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="bg-product-background border border-product-border rounded-xl shadow-lg">
              <DropdownMenuItem
                onClick={() => handleDownloadPng(catalogue.name)}
                disabled={isModalOpen}
                className="text-product-foreground hover:bg-product-hover-background cursor-pointer">
                <span className="flex items-center gap-2">
                  <BsQrCodeScan size={18} />
                  QR Code
                </span>
              </DropdownMenuItem>
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
            </DropdownMenuSubContent>
          </DropdownMenuSub>

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
  )
}

export default ItemDropdownMenu
