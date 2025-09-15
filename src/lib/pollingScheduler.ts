import { createClient } from "@supabase/supabase-js";
import { sendQuietHoursEmail } from "./mail";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options,
          signal: AbortSignal.timeout(30000), // 30s timeout
        });
      },
    },
  }
);

const sendEmailWithRetry = async (email, startTime, endTime, maxRetries = 2) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await sendQuietHoursEmail(email, startTime, endTime);
      return true;
    } catch (error) {
      console.error(`Email attempt ${i + 1} failed for ${email}:`, error.message);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 3000)); 
    }
  }
};

export const startPollingScheduler = async () => {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Scheduler started`);

  try {
    // Use more reliable IST calculation
    const istTime = new Date(new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata"
    }));
    
    console.log(`IST Time: ${istTime.toISOString()}`);

    const { data: unsentBlocks, error: unsentError } = await supabase
      .from("blocks")
      .select("*")
      .eq("mail", false);

    if (unsentError) {
      throw new Error(`Database error: ${unsentError.message}`);
    }

    if (!unsentBlocks || unsentBlocks.length === 0) {
      console.log("No blocks need email notifications");
      return;
    }

    console.log(`Processing ${unsentBlocks.length} blocks`);
    let emailsSent = 0;
    let errors = 0;

    for (const block of unsentBlocks) {
      try {
        const [hours, minutes, seconds = 0] = block.start_time
          .split(":")
          .map(Number);

        const blockStartToday = new Date(istTime);
        blockStartToday.setHours(hours, minutes, seconds, 0);

        const blockStartTomorrow = new Date(blockStartToday);
        blockStartTomorrow.setDate(blockStartTomorrow.getDate() + 1);

        const diffTodayMinutes =
          (blockStartToday.getTime() - istTime.getTime()) / (1000 * 60);
        const diffTomorrowMinutes =
          (blockStartTomorrow.getTime() - istTime.getTime()) / (1000 * 60);

        const minutesUntilStart =
          diffTodayMinutes > 0 ? diffTodayMinutes : diffTomorrowMinutes;

        if (minutesUntilStart <= 10 && minutesUntilStart > 0) {
          console.log(`Sending email for block ${block.id} (${minutesUntilStart.toFixed(1)}min until start)`);

          // Send email with retry
          await sendEmailWithRetry(block.email, block.start_time, block.end_time);
          emailsSent++;

          // Update database only after successful email
          const { error: updateError } = await supabase
            .from("blocks")
            .update({ mail: true })
            .eq("id", block.id);

          if (updateError) {
            throw new Error(`Failed to update block ${block.id}: ${updateError.message}`);
          }

          console.log(`✓ Block ${block.id} processed successfully`);
          
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (blockError) {
        errors++;
        console.error(`✗ Error processing block ${block.id}:`, blockError.message);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`Scheduler completed: ${emailsSent} emails sent, ${errors} errors, ${duration}ms`);

  } catch (globalError) {
    console.error("Critical error:", globalError.message);
    throw globalError; 
  }
};

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
  process.exit(1);
});

startPollingScheduler()
  .then(() => {
    console.log(`[${new Date().toISOString()}] Scheduler finished successfully`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`[${new Date().toISOString()}] Scheduler failed:`, error.message);
    process.exit(1);
  });