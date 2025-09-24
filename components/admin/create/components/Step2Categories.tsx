"use client"
import InformModal from "@/components/modals/InformModal"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { layouts } from "@/constants"
import type { Step2ServicesSectionsProps } from "@/types/components"
import { ChevronDown, GripVertical, Plus, Trash2 } from "lucide-react"
import * as React from "react"
import { TbCategory } from "react-icons/tb"

const Step2ServicesSections: React.FC<Step2ServicesSectionsProps> = ({
  formData,
  handleAddCategory,
  handleRemoveCategory,
  handleCategoryChange,
  handleReorderCategories,
  expandedCategory,
  setExpandedCategory,
}) => {
  const [draggedItem, setDraggedItem] = React.useState<number | null>(null)
  const [dragOverItem, setDragOverItem] = React.useState<number | null>(null)
  const [currentCategoryIndex, setCurrentCategoryIndex] = React.useState(0)
  const [isCategoryDeletionConfirmed, setIsCategoryDeletionConfirmed] = React.useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false)


  const sortedServices = React.useMemo(() => {
    return formData.services
      .map((service, originalIndex) => ({ ...service, originalIndex }))
      .sort((a, b) => a.order - b.order)
  }, [formData.services])

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, displayIndex: number) => {
    setDraggedItem(displayIndex)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, displayIndex: number) => {
    e.preventDefault()
    setDragOverItem(displayIndex)
  }

  const handleDragLeave = () => {
    setDragOverItem(null)
  }


  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropDisplayIndex: number) => {
    e.preventDefault()

    if (draggedItem === null || draggedItem === dropDisplayIndex) {
      setDraggedItem(null)
      setDragOverItem(null)
      return
    }

    const reorderedServices = [...sortedServices]

    const [movedItem] = reorderedServices.splice(draggedItem, 1)
    reorderedServices.splice(dropDisplayIndex, 0, movedItem)

    const finalServices = reorderedServices.map((service, index) => ({
      ...service,
      order: index,
    }))

    const cleanedServices = finalServices.map(({ originalIndex, ...service }) => service)

    if (handleReorderCategories) {
      handleReorderCategories(cleanedServices)
    }

    setDraggedItem(null)
    setDragOverItem(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverItem(null)
  }

  const toggleCategory = (displayIndex: number) => {
    const originalIndex = sortedServices[displayIndex]?.originalIndex
    if (originalIndex !== undefined) {
      setExpandedCategory(expandedCategory === originalIndex ? null : originalIndex)
    }
  }

  const handleCategoryChangeWrapper = (
    displayIndex: number,
    field: "name" | "layout",
    value: string
  ) => {
    const originalIndex = sortedServices[displayIndex]?.originalIndex
    if (originalIndex !== undefined) {
      handleCategoryChange(originalIndex, field, value)
    }
  }

  const handleRemoveCategoryWrapper = (displayIndex: number) => {
    const originalIndex = sortedServices[displayIndex]?.originalIndex
    if (originalIndex !== undefined) {
      handleRemoveCategory(originalIndex)
    }
  }

  return (
    <>


      <Card
        className="space-y-8 p-4 sm:p-4 bg-product-background/95 border-0 border-product-border shadow-product-shadow rounded-2xl"
        type="form">
        <h2 className="text-2xl sm:text-3xl font-bold text-product-foreground flex items-center gap-3 font-heading">
          <TbCategory className="text-product-primary" size={32} />
          Add Categories
        </h2>

        {sortedServices.length > 0 && (
          <div className="text-sm text-product-foreground-accent font-body mb-4">
            💡 Tip: Drag and drop categories using the grip handle to reorder them
          </div>
        )}

        {sortedServices.map((category, displayIndex) => {
          const isExpanded = expandedCategory === category.originalIndex

          return (
            <div
              key={`category-${category.originalIndex}-${category.order}`}
              draggable
              onDragStart={(e) => handleDragStart(e, displayIndex)}
              onDragOver={(e) => handleDragOver(e, displayIndex)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, displayIndex)}
              onDragEnd={handleDragEnd}
              className={`transition-all duration-200 ${draggedItem === displayIndex ? "opacity-50 scale-95" : "opacity-100 scale-100"
                } ${dragOverItem === displayIndex && draggedItem !== displayIndex
                  ? "transform scale-105 shadow-lg"
                  : ""
                }`}>
              <Card
                className={`bg-product-background/50 bg-product-background border border-product-border shadow-product-shadow rounded-xl cursor-move ${dragOverItem === displayIndex && draggedItem !== displayIndex
                  ? "border-product-primary border-2 bg-product-primary/5"
                  : ""
                  }`}
                type="form">
                <div
                  className="flex justify-between items-center p-6 cursor-pointer"
                  onClick={() => toggleCategory(displayIndex)}>
                  <div className="flex items-center gap-3">
                    <div
                      className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-product-border/50 transition-colors"
                      onMouseDown={(e) => e.stopPropagation()}>
                      <GripVertical className="h-5 w-5 text-product-foreground-accent" />
                    </div>
                    <h3 className="text-xl font-bold text-product-foreground font-heading">
                      {category.name || `Category ${displayIndex + 1}`}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsDeleteModalOpen(true)
                        setCurrentCategoryIndex(displayIndex)
                      }}
                      className="h-10 w-10 hover:bg-red-600 hover:shadow-product-hover-shadow">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <ChevronDown
                      className={`h-6 w-6 text-product-foreground-accent transition-transform duration-300 ${isExpanded ? "rotate-180" : ""
                        }`}
                    />
                  </div>
                </div>
                {isExpanded && (
                  <div className="p-6 pt-0 space-y-6">
                    <div className="space-y-3">
                      <Label
                        htmlFor={`category-name-${displayIndex}`}
                        className="text-product-foreground font-medium font-body">
                        Name<span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id={`category-name-${displayIndex}`}
                        type="text"
                        placeholder="e.g., Breakfast, Main Courses"
                        value={category.name}
                        onChange={(e) =>
                          handleCategoryChangeWrapper(displayIndex, "name", e.target.value)
                        }
                        className="border-product-border focus:border-product-primary focus:ring-product-primary/20"
                        required
                      />
                    </div>
                    {/* Layout Selection for this category */}
                    <div className="space-y-4">
                      <Label
                        htmlFor={`category-layout-${displayIndex}`}
                        className="text-product-foreground font-medium font-body">
                        Layout<span className="text-red-500 ml-1">*</span>
                      </Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {layouts.map((layoutOption) => (
                          <div
                            key={layoutOption.key}
                            className={`relative cursor-pointer rounded-xl border-2 p-2 transition-all duration-200 hover:shadow-product-hover-shadow ${category.layout === layoutOption.key
                              ? "border-product-primary shadow-product-shadow bg-product-primary/5"
                              : "border-product-border hover:border-product-primary/50"
                              }`}
                            onClick={() =>
                              handleCategoryChangeWrapper(displayIndex, "layout", layoutOption.key)
                            }>
                            <img
                              src={layoutOption.image}
                              alt={layoutOption.label}
                              className="w-full aspect-[3/4] object-contain rounded-lg"
                            />
                            <p className="text-center text-sm mt-2 font-medium text-product-foreground font-body">
                              {layoutOption.label}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )
        })}

        <Button
          type="button"
          onClick={handleAddCategory}
          className="px-6 py-3 text-base font-medium bg-product-primary hover:bg-product-primary-accent hover:shadow-product-hover-shadow hover:scale-[1.02] hover:transform hover:-translate-y-1 transition-all duration-300">
          <Plus className="h-5 w-5 mr-2" /> Add New Category
        </Button>
      </Card>
      <InformModal
        isOpen={isDeleteModalOpen}
        onConfirm={() => {
          setIsCategoryDeletionConfirmed(true)
          handleRemoveCategoryWrapper(currentCategoryIndex)
          setIsDeleteModalOpen(false)
        }}
        onCancel={() => {
          setIsDeleteModalOpen(false)
        }}
        title="Delete Category"
        message="Are you sure you want to delete this category and its related items? This action cannot be undone."
      />
    </>
  )
}

export default Step2ServicesSections
