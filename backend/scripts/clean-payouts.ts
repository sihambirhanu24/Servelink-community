import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanPayouts() {
  console.log('Starting payout cleanup...');

  try {
    // Find all PROCESSING and PENDING payouts
    const payoutsToDelete = await prisma.payout.findMany({
      where: {
        status: {
          in: ['PROCESSING', 'PENDING'],
        },
      },
      select: {
        id: true,
        reference: true,
        status: true,
      },
    });

    console.log(`Found ${payoutsToDelete.length} payouts to delete`);

    if (payoutsToDelete.length === 0) {
      console.log('No PROCESSING/PENDING payouts found. Exiting.');
      return;
    }

    // Delete each payout and release reserved earnings
    for (const payout of payoutsToDelete) {
      console.log(`Deleting payout: ${payout.reference} (${payout.status})`);

      await prisma.$transaction(async (tx) => {
        // Release reserved earnings back to AVAILABLE
        await tx.teacherEarning.updateMany({
          where: {
            payoutId: payout.id,
            status: 'PENDING',
          },
          data: {
            status: 'AVAILABLE',
            payoutId: null,
          },
        });

        // Delete the payout
        await tx.payout.delete({
          where: {
            id: payout.id,
          },
        });
      });

      console.log(`✓ Deleted ${payout.reference}`);
    }

    console.log(`✓ Successfully deleted ${payoutsToDelete.length} payouts`);
    console.log('✓ Released reserved earnings back to AVAILABLE');
  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanPayouts()
  .then(() => {
    console.log('Cleanup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Cleanup failed:', error);
    process.exit(1);
  });
