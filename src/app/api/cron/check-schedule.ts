import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

interface NotificationResult {
  success: boolean;
  email: string;
  blockId?: string;
  error?: any;
}

export async function GET(request: NextRequest) {
  try {
    // Verify this is actually from Vercel Cron (security check)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🕒 Cron job started at:', new Date().toISOString());

    // FIX 1: Add await here
    const supabase = await createClient();
    const now = new Date();
    const indiaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    
    // Format current time as HH:MM for comparison with database
    const currentTimeString = indiaTime.toTimeString().substring(0, 5); // "14:30"
    
    // Calculate time 10 minutes from now for notification
    const tenMinutesLater = new Date(indiaTime.getTime() + 10 * 60 * 1000);
    const notifyTimeString = tenMinutesLater.toTimeString().substring(0, 5); // "14:40"

    console.log('🇮🇳 Current India time:', currentTimeString);
    console.log('🔔 Looking for blocks starting at:', notifyTimeString);

    // Fetch all blocks that start at the notify time
    const { data: blocks, error } = await supabase
      .from('blocks')
      .select(`
        id,
        start_time,
        end_time,
        user_id,
        users!inner(email)
      `)
      .eq('start_time', notifyTimeString + ':00'); 

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!blocks || blocks.length === 0) {
      console.log('✅ No blocks found starting at', notifyTimeString);
      return NextResponse.json({ 
        message: 'No notifications needed',
        currentTime: currentTimeString,
        checkingFor: notifyTimeString
      });
    }

    console.log(`📧 Found ${blocks.length} blocks to notify about`);

    // Send notifications for each block
    const notifications = await Promise.all(
      blocks.map(async (block: any) => {
        try {
          // Call your email API
          const emailResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/send-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: block.users.email,
              startTime: block.start_time,
              endTime: block.end_time,
              currentTime: currentTimeString
            }),
          });

          if (emailResponse.ok) {
            console.log(`✅ Notification sent to ${block.users.email} for block ${block.start_time}-${block.end_time}`);
            return { success: true, email: block.users.email, blockId: block.id };
          } else {
            console.error(`❌ Failed to send email to ${block.users.email}`);
            return { success: false, email: block.users.email, error: 'Email API failed' };
          }
        } catch (emailError) {
          console.error(`❌ Error sending email to ${block.users.email}:`, emailError);
          return { success: false, email: block.users.email, error: emailError };
        }
      })
    );

    // FIX 2: Add type annotations to fix 'any' type errors
    const successCount = notifications.filter((n: NotificationResult) => n.success).length;
    const failCount = notifications.filter((n: NotificationResult) => !n.success).length;

    console.log(`📊 Notification results: ${successCount} sent, ${failCount} failed`);

    return NextResponse.json({
      message: 'Cron job completed',
      currentTime: currentTimeString,
      blocksFound: blocks.length,
      notificationsSent: successCount,
      notificationsFailed: failCount,
      results: notifications
    });

  } catch (error) {
    console.error('❌ Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}