import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCatalogueContext } from "@/context/CatalogueContext"

const CatalogueNameInput = ({ disabled = false }: { disabled?: boolean }) => {
    const { catalogue, updateCatalogue } = useCatalogueContext()
    return (
        <div className="space-y-2">
            <Label
                className="text-sm font-medium text-product-foreground"
                htmlFor="catalogName"
            >
                Catalog Name
            </Label>
            <Input
                className="bg-product-background border-product-border text-product-foreground placeholder:text-product-foreground-accent/50 focus:border-product-primary focus:ring-product-primary"
                disabled={disabled}
                id="catalogName"
                onChange={(e) => updateCatalogue({ name: e.target.value })}
                placeholder="e.g. Burger House"
                type="text"
                value={catalogue.name}
            />
        </div>
    )
}

export default CatalogueNameInput