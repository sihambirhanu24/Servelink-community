import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type SessionRealTimeStatus = 'UPCOMING' | 'LIVE' | 'ENDED';

function getSessionStatus(
  scheduledStart: Date,
  durationMinutes: number,
  now: number = Date.now()
): SessionRealTimeStatus {
  if (!scheduledStart || !durationMinutes) {
    return 'ENDED';
  }

  const startTime = scheduledStart.getTime();
  const endTime = startTime + (durationMinutes * 60 * 1000);

  if (isNaN(startTime) || isNaN(endTime) || endTime <= startTime) {
    return 'ENDED';
  }

  if (now >= endTime) {
    return 'ENDED';
  }

  if (now >= startTime && now < endTime) {
    return 'LIVE';
  }

  return 'UPCOMING';
}

async function checkAndFixSessionStatus() {
  console.log('Checking live session statuses...\n');

  const sessions = await prisma.liveSession.findMany({
    where: {
      status: { in: ['APPROVED', 'LIVE'] }
    },
    select: {
      id: true,
      topic: true,
      scheduledStart: true,
      duration: true,
      status: true,
    }
  });

  const now = Date.now();
  const sessionsToFix: string[] = [];

  console.log(`Found ${sessions.length} sessions with APPROVED or LIVE status\n`);

  for (const session of sessions) {
    const realTimeStatus = getSessionStatus(session.scheduledStart, session.duration, now);
    
    const startTime = session.scheduledStart.getTime();
    const endTime = startTime + (session.duration * 60 * 1000);
    const endTimeDate = new Date(endTime);
    
    console.log(`Session: ${session.topic}`);
    console.log(`  ID: ${session.id}`);
    console.log(`  Stored Status: ${session.status}`);
    console.log(`  Real-time Status: ${realTimeStatus}`);
    console.log(`  Start Time: ${session.scheduledStart.toISOString()}`);
    console.log(`  End Time: ${endTimeDate.toISOString()}`);
    console.log(`  Current Time: ${new Date(now).toISOString()}`);
    
    if (realTimeStatus === 'ENDED' && session.status !== 'COMPLETED') {
      console.log(`  ⚠️  NEEDS FIX: Session has ended but status is ${session.status}`);
      sessionsToFix.push(session.id);
    } else {
      console.log(`  ✓ Status is correct`);
    }
    console.log('');
  }

  if (sessionsToFix.length > 0) {
    console.log(`\n${sessionsToFix.length} sessions need to be fixed.`);
    console.log('Would you like to fix them by setting status to COMPLETED?');
    console.log('Run the fix-live-session-status.ts script to apply fixes.');
  } else {
    console.log('\n✓ All sessions have correct status.');
  }

  await prisma.$disconnect();
}

checkAndFixSessionStatus().catch(console.error);
