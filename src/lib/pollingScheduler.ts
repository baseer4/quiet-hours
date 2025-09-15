import { createClient } from "@supabase/supabase-js";
import { sendQuietHoursEmail } from "./mail";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key bypasses RLS
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export const startPollingScheduler = async () => {
  // console.log("Scheduler run started with SERVICE ROLE KEY");

  try {
    const now = new Date();
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    const istTime = new Date(utcTime + 5.5 * 60 * 60 * 1000);

    // console.log(
    //   `\n === Current IST: ${istTime.getDate()}/${
    //     istTime.getMonth() + 1
    //   }/${istTime.getFullYear()} ${istTime
    //     .getHours()
    //     .toString()
    //     .padStart(2, "0")}:${istTime
    //     .getMinutes()
    //     .toString()
    //     .padStart(2, "0")}:${istTime
    //     .getSeconds()
    //     .toString()
    //     .padStart(2, "0")} ===`
    // );

    const { data: allBlocks, error: allError } = await supabase
      .from("blocks")
      .select("*");

    if (allError) {
      console.error(" Database error:", allError);
      return;
    }

    // console.log(`Total blocks in database: ${allBlocks?.length || 0}`);

    const { data: unsentBlocks, error: unsentError } = await supabase
      .from("blocks")
      .select("*")
      .eq("mail", false);

    if (unsentError) {
      console.error("Error fetching unsent blocks:", unsentError);
      return;
    }

    // console.log(`Blocks needing emails: ${unsentBlocks?.length || 0}`);

    if (!unsentBlocks || unsentBlocks.length === 0) {
      console.log("No blocks need email notifications");
      return;
    }

    for (const block of unsentBlocks) {
      try {
        // console.log(`\nProcessing Block ID ${block.id}`);

        const [hours, minutes, seconds] = block.start_time
          .split(":")
          .map(Number);

        const blockStartToday = new Date(istTime);
        blockStartToday.setHours(hours, minutes, seconds || 0, 0);

        const blockStartTomorrow = new Date(blockStartToday);
        blockStartTomorrow.setDate(blockStartTomorrow.getDate() + 1);

        const diffTodayMinutes =
          (blockStartToday.getTime() - istTime.getTime()) / (1000 * 60);
        const diffTomorrowMinutes =
          (blockStartTomorrow.getTime() - istTime.getTime()) / (1000 * 60);

        const minutesUntilStart =
          diffTodayMinutes > 0 ? diffTodayMinutes : diffTomorrowMinutes;

        if (minutesUntilStart <= 10 && minutesUntilStart > 0) {
          // console.log(`SENDING EMAIL for block ${block.id}!`);

          await sendQuietHoursEmail(
            block.email,
            block.start_time,
            block.end_time
          );

          const { error: updateError } = await supabase
            .from("blocks")
            .update({ mail: true })
            .eq("id", block.id);

          if (updateError) {
            console.error(` Failed to update mail flag:`, updateError);
          } else {
            // console.log(`Database updated: mail=true for block ${block.id}`);
          }
        } else {
          // console.log(
          //   `Not time yet (minutesUntilStart=${minutesUntilStart.toFixed(1)})`
          // );
        }
      } catch (blockError) {
        console.error(` Error processing block ${block.id}:`, blockError);
      }
    }
  } catch (globalError) {
    console.error("Global error:", globalError);
  }
};

startPollingScheduler().then(() => {
  console.log(" Scheduler run finished");
  process.exit(0);
});
