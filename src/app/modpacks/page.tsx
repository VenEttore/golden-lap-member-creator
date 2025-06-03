"use client";
import React from 'react';
import ModpackManager from '../../components/Modpack/ModpackManager';
import Image from 'next/image';

export default function ModpacksPage() {
  return (
    <div
      style={{
        fontFamily: 'Figtree, Inter, sans-serif',
        background: 'linear-gradient(180deg, #edeafc 0%, #e7e4d4 100%)',
        color: '#333',
        minHeight: '100vh',
      }}
      className="flex flex-col min-h-screen"
    >
      <header className="w-full py-6 flex flex-col items-center mb-8 relative">
        <Image src="/assets/GLLogo_New.png" alt="Golden Lap Logo" width={180} height={64} style={{ maxHeight: 64, width: 'auto', marginBottom: 8 }} />
        <h2 className="text-xl text-gray-600 font-bold tracking-wide font-[Figtree,Inter,sans-serif]">Modpack Manager</h2>
      </header>
      <main className="flex-1 flex flex-col items-center w-full">
        <ModpackManager />
      </main>
    </div>
  );
} 