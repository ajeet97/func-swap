// src/components/ui/Card.tsx
"use client";

import React from "react";

interface CardProps {
  title?: string;
  children: React.ReactNode;
}

export default function Card({ title, children }: CardProps) {
  return (
    <div className="bg-white shadow-xl rounded-2xl p-10 border border-green-500 w-6xl max-h-full">
      {title && (
        <h2 className="text-2xl font-bold mb-6 text-center text-green-800">
          {title}
        </h2>
      )}
      <div className="flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
