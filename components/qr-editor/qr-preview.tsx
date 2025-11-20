"use client";

import React, { useEffect, useRef } from "react";
import QRCodeStyling, { Options } from "qr-code-styling";
import { useQr } from "@/context/qr-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function QrPreview() {
  const { options, setQrCodeInstance } = useQr();
  const ref = useRef<HTMLDivElement>(null);
  const qrCode = useRef<QRCodeStyling | null>(null);

  useEffect(() => {
    // Initialize QRCodeStyling only once
    if (!qrCode.current) {
        // @ts-ignore
      qrCode.current = new QRCodeStyling(options);
      setQrCodeInstance(qrCode.current);
    }
  }, [setQrCodeInstance]);

  useEffect(() => {
    if (qrCode.current) {
      qrCode.current.update(options);
    }
  }, [options]);

  useEffect(() => {
    if (ref.current && qrCode.current) {
      ref.current.innerHTML = "";
      qrCode.current.append(ref.current);
    }
  }, []);

  const handleDownload = (extension: "png" | "jpeg" | "svg" | "webp") => {
    if (qrCode.current) {
      qrCode.current.download({ extension });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-6 sticky top-6">
      <Card className="p-8 bg-gradient-to-br from-background via-background to-muted/30 shadow-2xl border-2 flex items-center justify-center relative overflow-visible">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none rounded-lg"></div>
        <div className="relative z-10">
          <div ref={ref} />
        </div>
      </Card>

      <div className="flex gap-4 w-full max-w-[500px]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="w-full shadow-lg" size="lg">
              <Download className="mr-2 h-5 w-5" /> Download QR Code
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-[200px]">
            <DropdownMenuItem onClick={() => handleDownload("png")}>
              Download as PNG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownload("svg")}>
              Download as SVG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownload("jpeg")}>
              Download as JPEG
            </DropdownMenuItem>
             <DropdownMenuItem onClick={() => handleDownload("webp")}>
              Download as WEBP
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

