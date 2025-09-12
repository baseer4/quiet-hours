"use client";

import { FaTrashAlt } from "react-icons/fa"; 

type Block = {
  id: number;
  start: string;
  end: string;
};

type Props = {
  blocks: Block[];
  onRemoveBlock: (id: number) => void;
};

export default function ScheduleList({ blocks, onRemoveBlock }: Props) {
  if (blocks.length === 0) {
    return (
      <div className="alert alert-info">
        <span>No study blocks yet. Add one above. 📝</span>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {blocks.map((block) => (
        <li key={block.id} className="alert flex justify-between items-center bg-base-200 border border-base-300">
          <div className="flex-grow">
            <div className="font-semibold">
              {new Date(block.start).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {" - "}
              {new Date(block.end).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div className="text-sm opacity-70">
              {new Date(block.start).toLocaleDateString()}
            </div>
          </div>
          <button
            onClick={() => onRemoveBlock(block.id)}
            className="btn btn-ghost btn-circle text-error"
          >
            <FaTrashAlt />
          </button>
        </li>
      ))}
    </ul>
  );
}