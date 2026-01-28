"use client";

import type { DividerBlock } from "@quicktalog/common";
import { useState } from "react";
import BlockControls from "../cards/common/BlockControls";
import DividerInput from "../inputs/DividerInput";

interface DividerBlockProps {
    block: DividerBlock;
    slug?: string;
    onDelete?: () => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    isFirst?: boolean;
    isLast?: boolean;
    mode: "edit" | "view";
    onUpdateBlock?: (data: DividerBlock) => void;
}

const DividerBlockComponent = ({
    block,
    slug,
    onDelete,
    onMoveUp,
    onMoveDown,
    isFirst,
    isLast,
    mode,
    onUpdateBlock,
}: DividerBlockProps) => {
    const [isEditing, setIsEditing] = useState(false);

    const borderStyle = block.border?.isEnabled
        ? {
            borderTopStyle: block.border.style || "solid",
            borderTopWidth: `${block.border.thickness || 1}px`,
            borderTopColor: block.border.color || "#000000",
            opacity: (block.border.opacity ?? 100) / 100,
        }
        : {};

    const style = {
        marginTop: `${(block.spacing || 0) / 2}rem`,
        marginBottom: `${(block.spacing || 0) / 2}rem`,
        ...borderStyle,
    };

    if (mode === "view") {
        return <div className="w-full" style={style} />;
    }

    return (
        <section
            className={`group relative rounded-lg border-2 border-transparent hover:border-dashed hover:border-gray-300 transition-all ${isEditing ? "border-dashed border-gray-300 bg-gray-50/50 p-4" : "p-2"}`}
            id={slug ? `${slug}-${block.order}` : undefined}
        >
            <BlockControls
                isEditing={isEditing}
                isFirst={isFirst}
                isLast={isLast}
                onDelete={onDelete}
                onEdit={() => setIsEditing(!isEditing)}
                onMoveDown={onMoveDown}
                onMoveUp={onMoveUp}
            />

            {isEditing ? (
                <div className="space-y-4">
                    <DividerInput
                        value={block}
                        onChange={(updates) =>
                            onUpdateBlock && onUpdateBlock({ ...block, ...updates })
                        }
                    />
                </div>
            ) : (
                <div
                    className="cursor-pointer w-full"
                    onClick={() => setIsEditing(true)}
                    style={style}
                />
            )}
        </section>
    );
};

export default DividerBlockComponent;
