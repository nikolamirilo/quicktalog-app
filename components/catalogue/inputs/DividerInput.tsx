"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { DividerBlock } from "@quicktalog/common";

interface DividerInputProps {
    value: Partial<DividerBlock>;
    onChange: (value: Partial<DividerBlock>) => void;
}

const DividerInput = ({ value, onChange }: DividerInputProps) => {
    const spacing = value.spacing ?? 2;
    const border = value.border ?? {
        isEnabled: true,
        style: "solid",
        thickness: 1,
        color: "#000000",
        opacity: 100,
    };

    const handleBorderChange = (updates: Partial<typeof border>) => {
        onChange({
            border: {
                ...border,
                ...updates,
            },
        });
    };

    return (
        <div className="space-y-6">
            {/* Spacing */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>Vertical Spacing ({spacing}rem)</Label>
                </div>
                <Slider
                    value={[spacing]}
                    min={0}
                    max={10}
                    step={0.5}
                    onValueChange={([val]) => onChange({ spacing: val })}
                />
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="enable-border"
                        checked={border.isEnabled}
                        onCheckedChange={(checked) =>
                            handleBorderChange({ isEnabled: checked as boolean })
                        }
                    />
                    <Label htmlFor="enable-border">Enable Border Line</Label>
                </div>

                {border.isEnabled && (
                    <div className="space-y-4 pl-6">
                        {/* Border Style */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Style</Label>
                                <Select
                                    value={border.style}
                                    onValueChange={(val: any) => handleBorderChange({ style: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="solid">Solid</SelectItem>
                                        <SelectItem value="dashed">Dashed</SelectItem>
                                        <SelectItem value="dotted">Dotted</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Thickness ({border.thickness}px)</Label>
                                <Slider
                                    className="pt-4"
                                    value={[border.thickness || 1]}
                                    min={1}
                                    max={10}
                                    step={1}
                                    onValueChange={([val]) => handleBorderChange({ thickness: val })}
                                />
                            </div>
                        </div>

                        {/* Color & Opacity */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Color</Label>
                                <div className="flex gap-2 items-center">
                                    <Input
                                        type="color"
                                        value={border.color}
                                        onChange={(e) => handleBorderChange({ color: e.target.value })}
                                        className="w-12 h-10 p-1 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-500 uppercase">
                                        {border.color}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Opacity ({border.opacity}%)</Label>
                                <Slider
                                    className="pt-4"
                                    value={[border.opacity ?? 100]}
                                    min={0}
                                    max={100}
                                    step={10}
                                    onValueChange={([val]) => handleBorderChange({ opacity: val })}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DividerInput;
