"use client";

import { FaTrashAlt } from "react-icons/fa"; 

type Block = {
  id: number;
  start_time: string; 
  end_time: string;   
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

  // Function to format time string (like "21:14:00") to display format
  const formatTime = (timeString: string) => {
    // timeString is like "21:14:00" from database
    // Convert to "9:14 PM" format
    const [hours, minutes] = timeString.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <ul className="space-y-4">
      {blocks.map((block) => (
        <li key={block.id} className="alert flex justify-between items-center bg-base-200 border border-base-300">
          <div className="flex-grow">
            <div className="font-semibold">
              {formatTime(block.start_time)}
              {" - "}
              {formatTime(block.end_time)}
            </div>
            <div className="text-sm opacity-70">
              Daily Time Block
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