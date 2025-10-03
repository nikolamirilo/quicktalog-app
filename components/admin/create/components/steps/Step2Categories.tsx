"use client"
import InformModal from "@/components/modals/InformModal"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { layouts } from "@/constants"
import type { Step2CategoriesProps } from "@/types/components"
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react"
import * as React from "react"
import { FaPen } from "react-icons/fa6"
import { FiInfo } from "react-icons/fi"
import { TbCategory } from "react-icons/tb"

const Step2Categories: React.FC<Step2CategoriesProps> = ({
  formData,
  handleAddCategory,
  handleRemoveCategory,
  handleCategoryChange,
  handleReorderCategories,
  expandedCategory,
  setExpandedCategory,
}) => {
  const [currentCategoryIndex, setCurrentCategoryIndex] = React.useState(0)
  const [isCategoryDeletionConfirmed, setIsCategoryDeletionConfirmed] = React.useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false)
  const [editableCategoryIndex, setEditableCategoryIndex] = React.useState<number | null>(null)
  const [isInfoModalOpen, setIsInfoModalOpen] = React.useState(false)

  const sortedServices = React.useMemo(() => {
    return formData.services
      .map((service, originalIndex) => ({ ...service, originalIndex }))
      .sort((a, b) => a.order - b.order)
  }, [formData.services])

  const handleMoveUp = (displayIndex: number) => {
    if (displayIndex === 0) return

    const reorderedServices = [...sortedServices]
    const temp = reorderedServices[displayIndex]
    reorderedServices[displayIndex] = reorderedServices[displayIndex - 1]
    reorderedServices[displayIndex - 1] = temp

    const finalServices = reorderedServices.map((service, index) => ({
      ...service,
      order: index,
    }))

    const cleanedServices = finalServices.map(({ originalIndex, ...service }) => service)

    if (handleReorderCategories) {
      handleReorderCategories(cleanedServices)
    }
  }

  const handleMoveDown = (displayIndex: number) => {
    if (displayIndex === sortedServices.length - 1) return

    const reorderedServices = [...sortedServices]
    const temp = reorderedServices[displayIndex]
    reorderedServices[displayIndex] = reorderedServices[displayIndex + 1]
    reorderedServices[displayIndex + 1] = temp

    const finalServices = reorderedServices.map((service, index) => ({
      ...service,
      order: index,
    }))

    const cleanedServices = finalServices.map(({ originalIndex, ...service }) => service)

    if (handleReorderCategories) {
      handleReorderCategories(cleanedServices)
    }
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

  const toggleEditable = (displayIndex: number) => {
    setEditableCategoryIndex(editableCategoryIndex === displayIndex ? null : displayIndex)
  }

  return (
    <>
      <Card
        className="space-y-8 sm:p-4 bg-product-background/95 border-0 border-product-border shadow-product-shadow rounded-2xl"
        type="form">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-product-foreground flex items-center gap-3 font-heading">
            <TbCategory className="text-product-primary" size={32} />
            Add Categories
          </h2>
          <button
            type="button"
            onClick={() => setIsInfoModalOpen(true)}
            className="hover:text-product-primary transition-colors duration-200 z-10">
            <FiInfo size={20} />
          </button>
        </div>

        {sortedServices.length > 0 && (
          <div className="text-sm text-product-foreground-accent font-body mb-4">
            💡 Tip: Use the arrow buttons to reorder categories
          </div>
        )}

        {sortedServices.map((category, displayIndex) => {
          const isExpanded = expandedCategory === category.originalIndex
          const isEditable = editableCategoryIndex === displayIndex

          return (
            <div
              key={`category-${category.originalIndex}-${category.order}`}
              className="transition-all duration-200">
              <Card
                className="bg-product-background/50 bg-product-background border border-product-border shadow-product-shadow rounded-xl"
                type="form">
                <div
                  className="flex justify-between items-center p-2 sm:p-6 cursor-pointer"
                  onClick={() => toggleCategory(displayIndex)}>
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMoveUp(displayIndex)
                        }}
                        disabled={displayIndex === 0}
                        className={`p-1 rounded hover:bg-product-border/50 transition-colors ${
                          displayIndex === 0 ? "opacity-30 cursor-not-allowed" : ""
                        }`}
                        aria-label="Move up">
                        <ChevronUp className="h-4 w-4 text-product-foreground-accent" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMoveDown(displayIndex)
                        }}
                        disabled={displayIndex === sortedServices.length - 1}
                        className={`p-1 rounded hover:bg-product-border/50 transition-colors ${
                          displayIndex === sortedServices.length - 1
                            ? "opacity-30 cursor-not-allowed"
                            : ""
                        }`}
                        aria-label="Move down">
                        <ChevronDown className="h-4 w-4 text-product-foreground-accent" />
                      </button>
                    </div>
                    <div
                      className="relative flex-1 max-w-[200px]"
                      onClick={(e) => e.stopPropagation()}>
                      <Input
                        type="text"
                        placeholder="e.g., Breakfast, Main Courses"
                        value={category.name}
                        onChange={(e) =>
                          handleCategoryChangeWrapper(displayIndex, "name", e.target.value)
                        }
                        onClick={() => !isEditable && toggleEditable(displayIndex)}
                        className={`w-full !text-lg font-medium px-3 py-2 pr-10 rounded-lg border-2 transition-all ${
                          isEditable
                            ? "border-product-primary bg-white focus:ring-2 focus:ring-product-primary/20 focus:none outline-none"
                            : "border-transparent bg-transparent cursor-pointer pointer-events-auto"
                        }`}
                        required
                        readOnly={!isEditable}
                      />
                      <button
                        type="button"
                        onClick={() => toggleEditable(displayIndex)}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md transition-colors ${
                          isEditable
                            ? "text-product-primary hover:bg-product-primary/10"
                            : "text-gray-400 hover:text-product-primary hover:bg-gray-100"
                        }`}
                        aria-label="Edit category name">
                        <FaPen size={14} />
                      </button>
                    </div>
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
                      className={`h-6 w-6 text-product-foreground-accent transition-transform duration-300 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </div>
                {isExpanded && (
                  <div className="p-6 pt-0 space-y-6">
                    {/* Layout Selection for this category */}
                    <div className="space-y-4">
                      <Label
                        htmlFor={`category-layout-${displayIndex}`}
                        className="text-product-foreground font-medium font-body">
                        Category Layout<span className="text-red-500 ml-1">*</span>
                      </Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {layouts.map((layoutOption) => (
                          <div
                            key={layoutOption.key}
                            className={`relative cursor-pointer rounded-xl border-2 p-2 transition-all duration-200 hover:shadow-product-hover-shadow ${
                              category.layout === layoutOption.key
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
          className="px-6 py-3 text-base text-wrap font-medium bg-product-primary hover:bg-product-primary-accent hover:shadow-product-hover-shadow hover:scale-[1.02] hover:transform hover:-translate-y-1 transition-all duration-300">
          <Plus className="h-5 w-5" /> New Category
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
      <InformModal
        isOpen={isInfoModalOpen}
        onConfirm={() => setIsInfoModalOpen(false)}
        onCancel={() => setIsInfoModalOpen(false)}
        title="Add Categories Explained"
        message="This step helps you organize your services into categories. Categories group related items together (like 'Appetizers', 'Main Courses', 'Desserts'). You can reorder categories using the arrow buttons, and each category can have its own layout style. Categories make it easier for customers to navigate your catalogue and find what they're looking for."
        confirmText="Got it!"
        cancelText=""
      />
    </>
  )
}

export default Step2Categories
