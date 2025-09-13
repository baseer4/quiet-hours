"use client";

import { useState, useEffect } from "react";
import ScheduleForm from "@/components/ScheduleForm";
import ScheduleList from "@/components/ScheduleList";
import { createClient } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthProvider";

type Block = {
  id: number;
  start_time: string; 
  end_time: string;  
  user_id?: string;
  created_at?: string;
};

export default function Home() {
  const { user, loading } = useAuth();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (user) loadBlocks();
  }, [user]);

  const loadBlocks = async () => {
    if (!user) return;
    setLoadingBlocks(true);

    try {
      const { data, error } = await supabase
        .from("blocks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading blocks:", error);
        alert("Error loading your schedule blocks");
      } else {
        setBlocks(data || []);
      }
    } catch (err) {
      console.error("Unexpected error loading blocks:", err);
    } finally {
      setLoadingBlocks(false);
    }
  };

  const addBlock = async (start: string, end: string) => {
    if (!user) {
      alert("Please log in to add blocks");
      return;
    }


    const formatTime = (datetimeStr: string) => {
      const timePart = datetimeStr.split('T')[1];
      return timePart + ':00'; 
    };

    try {
      const { data, error } = await supabase
        .from("blocks")
        .insert([{ 
          start_time: formatTime(start), 
          end_time: formatTime(end), 
          user_id: user.id 
        }])
        .select()
        .single();

      if (error) {
        console.error("Error adding block:", error);
        alert("Error adding block: " + error.message);
      } else {
        // Add the new block to state
        setBlocks((prev) => [data, ...prev]);
      }
    } catch (err) {
      console.error("Unexpected error adding block:", err);
      alert("Unexpected error adding block");
    }
  };

  const removeBlock = async (id: number) => {
    try {
      const { error } = await supabase
        .from("blocks")
        .delete()
        .eq("id", id)
        .eq("user_id", user?.id);

      if (error) {
        console.error("Error removing block:", error);
        alert("Error removing block: " + error.message);
      } else {
        setBlocks((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (err) {
      console.error("Unexpected error removing block:", err);
      alert("Unexpected error removing block");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <h2 className="card-title">Please log in</h2>
            <p>You need to be logged in to access the scheduler.</p>
            <div className="card-actions justify-center mt-4">
              <a href="/signin" className="btn btn-primary">
                Sign In
              </a>
              <a href="/signup" className="btn btn-outline">
                Sign Up
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-base-200 flex flex-col items-center p-10">
      <div className="w-full max-w-3xl">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="text-center">
              <h1 className="card-title text-4xl mt-2 mb-6 inline-block">
                Quiet Hours Scheduler
              </h1>
              <p className="text-sm opacity-70 mb-4">
                Welcome, {user.email}!
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="btn btn-ghost btn-xs ml-2"
                >
                  Sign Out
                </button>
              </p>
            </div>

            <ScheduleForm onAddBlock={addBlock} />

            <div className="divider">Scheduled Blocks</div>

            {loadingBlocks ? (
              <div className="text-center">
                <div className="loading loading-spinner loading-md"></div>
                <p>Loading your blocks...</p>
              </div>
            ) : (
              <ScheduleList blocks={blocks} onRemoveBlock={removeBlock} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}