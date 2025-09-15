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
  console.log(`[${new Date().toISOString()}] Scheduler run started`);

  try {
    const now = new Date();
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    const istTime = new Date(utcTime + 5.5 * 60 * 60 * 1000);

    console.log(
      `IST Time: ${istTime.getDate()}/${
        istTime.getMonth() + 1
      }/${istTime.getFullYear()} ${istTime
        .getHours()
        .toString()
        .padStart(2, "0")}:${istTime
        .getMinutes()
        .toString()
        .padStart(2, "0")}:${istTime
        .getSeconds()
        .toString()
        .padStart(2, "0")}`
    );

    const { data: unsentBlocks, error: unsentError } = await supabase
      .from("blocks")
      .select("*")
      .eq("mail", false);

    if (unsentError) {
      console.error("Error fetching unsent blocks:", unsentError);
      return;
    }

    console.log(`Blocks needing emails: ${unsentBlocks?.length || 0}`);

    if (!unsentBlocks || unsentBlocks.length === 0) {
      console.log("No blocks need email notifications");
      return;
    }

    let emailsSent = 0;

    for (const block of unsentBlocks) {
      try {
        console.log(`Processing Block ID ${block.id} (mail: ${block.mail})`);

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

        console.log(`Block ${block.id}: ${minutesUntilStart.toFixed(1)} minutes until start`);

        if (minutesUntilStart <= 10 && minutesUntilStart > 0) {
          console.log(`ATTEMPTING TO SEND EMAIL for block ${block.id}!`);

          const { data: updatedRows, error: updateError } = await supabase
            .from("blocks")
            .update({ mail: true })
            .eq("id", block.id)
            .eq("mail", false) 
            .select();

          if (updateError) {
            console.error(`Failed to update mail flag for block ${block.id}:`, updateError);
            continue;
          }

          if (!updatedRows || updatedRows.length === 0) {
            console.log(`Block ${block.id} was already processed by another instance, skipping`);
            continue;
          }

          try {
            await sendQuietHoursEmail(
              block.email,
              block.start_time,
              block.end_time
            );
            emailsSent++;
            console.log(`✓ Email sent successfully for block ${block.id}`);
          } catch (emailError) {
            console.error(`Email failed for block ${block.id}:`, emailError);
            
            const { error: revertError } = await supabase
              .from("blocks")
              .update({ mail: false })
              .eq("id", block.id);
            
            if (revertError) {
              console.error(`Failed to revert mail flag for block ${block.id}:`, revertError);
            } else {
              console.log(`Reverted mail flag for block ${block.id} due to email failure`);
            }
          }
        } else {
          console.log(`Not time yet for block ${block.id} (${minutesUntilStart.toFixed(1)} min)`);
        }
      } catch (blockError) {
        console.error(`Error processing block ${block.id}:`, blockError);
      }
    }

    console.log(`Scheduler completed: ${emailsSent} emails sent`);
  } catch (globalError) {
    console.error("Global error:", globalError);
  }
};

startPollingScheduler().then(() => {
  console.log(`[${new Date().toISOString()}] Scheduler run finished`);
});