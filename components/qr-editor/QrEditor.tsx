'use client'
import React, { useState } from 'react'
import QrPreview from './qr-preview'
import QrControls from './qr-controls'
import { NavigationGuard } from '@/hooks/useBeforeUnload'

const QrEditor = ({ name }: { name: string }) => {
    const [isDirty, setIsDirty] = useState(false)
    return (
        <>
            <NavigationGuard
                isDirty={isDirty}
                setIsDirty={setIsDirty}
            />

            <div className="min-h-screen px-2 sm:px-[10%] bg-gradient-to-br from-product-background to-hero-product-background py-24 font-lora">
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
                        {/* Left Column: Controls */}
                        <div className="w-full md:w-1/2 lg:w-8/12 xl:w-2/3">
                            <div className="sticky top-8">
                                <div className="pb-6">
                                    <h1 className="text-4xl font-bold tracking-tight text-[var(--product-foreground)] mb-2">
                                        QR Code Editor
                                    </h1>
                                    <p className="text-gray-600 mt-2 text-base">
                                        Create beautiful, customized QR codes for your brand with
                                        our easy-to-use editor.
                                    </p>
                                </div>
                                <QrControls name={name} />
                            </div>
                        </div>

                        {/* Right Column: Preview */}
                        <div className="w-full md:w-1/2 lg:w-4/12 xl:w-1/3 bg-product-background rounded-3xl shadow-product-shadow flex items-start p-2 lg:my-24 justify-center">
                            <QrPreview name={name} setIsDirty={setIsDirty} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default QrEditor