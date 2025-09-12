"use client";

import { useState } from "react";
import ScheduleForm from "@/components/ScheduleForm";
import ScheduleList from "@/components/ScheduleList";

export default function Home() {
  const [blocks, setBlocks] = useState<
    { id: number; start: string; end: string }[]
  >([]);

  const addBlock = (start: string, end: string) => {
    setBlocks((prev) => [...prev, { id: Date.now(), start, end }]);
  };

  const removeBlock = (id: number) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <main className="min-h-screen bg-base-200 flex flex-col items-center p-10">
      <div className="w-full max-w-3xl">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="text-center">
              <h1 className="card-title text-4xl mt-2 mb-6 inline-block">
                Quiet Hours Scheduler
              </h1>
            </div>

            <ScheduleForm onAddBlock={addBlock} />

            <div className="divider">Scheduled Blocks</div>

            <ScheduleList blocks={blocks} onRemoveBlock={removeBlock} />
          </div>
        </div>
      </div>
    </main>
  );
}