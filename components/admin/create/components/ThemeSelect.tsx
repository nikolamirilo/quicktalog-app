import { Label } from "@/components/ui/label"
import { themes } from "@/constants"
import { ThemeSelectProps } from "@/types/components"

const ThemeSelect = ({ formData, setFormData, touched, errors }: ThemeSelectProps) => {
  const handleThemeChange = (value: string) => {
    setFormData((prev: any) => ({ ...prev, theme: value }))
  }
  return (
    <div className="space-y-4 col-span-full">
      <Label htmlFor="theme" className="text-product-foreground font-medium font-body">
        Theme<span className="text-red-500 ml-1">*</span>
      </Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {themes.map((themeOption) => (
          <div
            key={themeOption.key}
            className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-product-hover-shadow ${
              formData.theme === themeOption.key
                ? "border-product-primary shadow-product-shadow bg-product-primary/5"
                : "border-product-border hover:border-product-primary/50"
            }`}
            onClick={() => handleThemeChange(themeOption.key)}>
            <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-gray-100">
              <img
                src={themeOption.image}
                alt={themeOption.label}
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-center text-base mt-3 font-medium text-product-foreground font-body">
              {themeOption.label}
            </p>
          </div>
        ))}
      </div>
      {touched?.theme && errors?.theme && (
        <div className="text-red-500 text-sm mt-2 p-2 bg-red-50 border border-red-200 rounded-lg font-body">
          {errors.theme}
        </div>
      )}
    </div>
  )
}

export default ThemeSelect
