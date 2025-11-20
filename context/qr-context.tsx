"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { Options } from "qr-code-styling";

// Define the shape of our context state
interface QrContextType {
  options: Options;
  setOptions: React.Dispatch<React.SetStateAction<Options>>;
  updateOptions: (newOptions: Partial<Options>) => void;
  qrCodeInstance: any; // We'll store the instance here to trigger downloads
  setQrCodeInstance: (instance: any) => void;
}

const defaultOptions: Options = {
  width: 300,
  height: 300,
  type: "svg",
  data: "https://quicktalog.com",
  image: "",
  margin: 10,
  qrOptions: {
    typeNumber: 0,
    mode: "Byte",
    errorCorrectionLevel: "Q",
  },
  imageOptions: {
    hideBackgroundDots: true,
    imageSize: 0.4,
    margin: 20,
    crossOrigin: "anonymous",
  },
  dotsOptions: {
    color: "#000000",
    type: "rounded",
  },
  backgroundOptions: {
    color: "#ffffff",
  },
  cornersSquareOptions: {
    color: "#000000",
    type: "extra-rounded",
  },
  cornersDotOptions: {
    color: "#000000",
    type: "dot",
  },
};

const QrContext = createContext<QrContextType | undefined>(undefined);

export function QrProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<Options>(defaultOptions);
  const [qrCodeInstance, setQrCodeInstance] = useState<any>(null);

  const updateOptions = (newOptions: Partial<Options>) => {
    setOptions((prev) => ({
      ...prev,
      ...newOptions,
      // Deep merge for nested objects if necessary, but for now simple spread is okay for top level.
      // Actually, for nested objects like dotsOptions, we need to be careful.
      // Let's do a shallow merge of the top-level keys, and if the key is an object, merge that too.
      qrOptions: { ...prev.qrOptions, ...newOptions.qrOptions },
      imageOptions: { ...prev.imageOptions, ...newOptions.imageOptions },
      dotsOptions: { ...prev.dotsOptions, ...newOptions.dotsOptions },
      backgroundOptions: { ...prev.backgroundOptions, ...newOptions.backgroundOptions },
      cornersSquareOptions: { ...prev.cornersSquareOptions, ...newOptions.cornersSquareOptions },
      cornersDotOptions: { ...prev.cornersDotOptions, ...newOptions.cornersDotOptions },
    }));
  };

  return (
    <QrContext.Provider value={{ 
      options, 
      setOptions, 
      updateOptions, 
      qrCodeInstance, 
      setQrCodeInstance
    }}>
      {children}
    </QrContext.Provider>
  );
}

export function useQr() {
  const context = useContext(QrContext);
  if (context === undefined) {
    throw new Error("useQr must be used within a QrProvider");
  }
  return context;
}
