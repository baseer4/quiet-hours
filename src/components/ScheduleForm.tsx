"use client";

import { useState } from "react";

type Props = {
  onAddBlock: (start: string, end: string) => void;
};

export default function ScheduleForm({ onAddBlock }: Props) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !startTime || !endTime) return;

    const start = `${date}T${startTime}`;
    const end = `${date}T${endTime}`;

    onAddBlock(start, end);

    setDate("");
    setStartTime("");
    setEndTime("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Date</span>
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input input-bordered w-full"
          required
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="form-control flex-1">
          <label className="label">
            <span className="label-text">Start Time</span>
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="input input-bordered w-full"
            required
          />
        </div>
        <div className="form-control flex-1">
          <label className="label">
            <span className="label-text">End Time</span>
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="input input-bordered w-full"
            required
          />
        </div>
      </div>

    <div className="flex justify-center">
    <button type="submit" className="btn btn-primary mt-4 rounded-xl">
        Add Block
    </button>
  </div>
    </form>
  );
}