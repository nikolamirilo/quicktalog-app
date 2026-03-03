import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmbeddingBlock } from "@quicktalog/common";
import {
    Calendar,
    CreditCard,
    Image as ImageIcon,
    MapPin,
    Share2,
} from "lucide-react";
import { useState } from "react";

interface EmbeddingInputProps {
    value: Partial<EmbeddingBlock>;
    onChange: (value: Partial<EmbeddingBlock>) => void;
}

const PRESETS = [
    {
        id: "maps",
        label: "Maps",
        icon: MapPin,
        placeholder:
            "Go to Google Maps, click Share > Embed a map, and paste the <iframe> code here.",
    },
    {
        id: "booking",
        label: "Booking",
        icon: Calendar,
        placeholder:
            "Copy the embed code from Calendly, OpenTable, or your booking provider and paste it here.",
    },
    {
        id: "media",
        label: "Media",
        icon: ImageIcon,
        placeholder:
            "Paste the embed code from YouTube, Vimeo, Spotify, or other media platforms.",
    },
    {
        id: "commerce",
        label: "Commerce",
        icon: CreditCard,
        placeholder:
            "Paste payment buttons or product embeds from Stripe, Shopify, or PayPal.",
    },
    {
        id: "social",
        label: "Social Media",
        icon: Share2,
        placeholder:
            "Go to Instagram, TikTok, or Twitter, click Share > Embed, and paste the code here. Example: TikTok videos and Instagram posts.",
    },
];

const EmbeddingInput = ({ value, onChange }: EmbeddingInputProps) => {
    const [activePreset, setActivePreset] = useState(PRESETS[0]);

    return (
        <div className="space-y-6">
            <div>
                <Label className="text-sm font-medium text-product-foreground mb-3 block">
                    What would you like to embed?
                </Label>
                <div className="flex flex-wrap gap-2">
                    {PRESETS.map((preset) => {
                        const Icon = preset.icon;
                        const isActive = activePreset.id === preset.id;
                        return (
                            <button
                                key={preset.id}
                                onClick={() => setActivePreset(preset)}
                                type="button"
                                className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-full transition-all ${isActive
                                    ? "border-product-primary bg-product-primary/5 text-product-primary shadow-sm font-medium"
                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-800"
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{preset.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-end justify-between">
                    <Label className="text-sm font-medium text-product-foreground block">
                        Embed Code <span className="text-red-500">*</span>
                    </Label>
                </div>
                <Textarea
                    className="min-h-[180px] placeholder:text-gray-600 font-mono text-xs focus-visible:ring-product-primary resize-y bg-gray-50/50"
                    onChange={(e) => onChange({ ...value, code: e.target.value })}
                    placeholder={activePreset.placeholder}
                    value={value.code || ""}
                />

            </div>
        </div>
    );
};

export default EmbeddingInput;
