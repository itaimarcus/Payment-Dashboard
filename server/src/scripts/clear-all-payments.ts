import { docClient, PAYMENTS_TABLE } from '../db/dynamodb.js';
import { ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

/**
 * Clear all payments from the database for all users
 * USE WITH CAUTION - This deletes everything!
 */
async function clearAllPayments() {
  try {
    console.log('🗑️  Starting to clear all payments from database...');
    console.log(`📦 Table: ${PAYMENTS_TABLE}`);
    
    // Scan to get all items
    const scanParams = {
      TableName: PAYMENTS_TABLE,
    };
    
    const scanResult = await docClient.send(new ScanCommand(scanParams));
    const items = scanResult.Items || [];
    
    console.log(`📊 Found ${items.length} payments to delete`);
    
    if (items.length === 0) {
      console.log('✅ Database is already empty!');
      return;
    }
    
    // Delete each item
    let deletedCount = 0;
    for (const item of items) {
      const deleteParams = {
        TableName: PAYMENTS_TABLE,
        Key: {
          userId: item.userId,
          paymentId: item.paymentId,
        },
      };
      
      await docClient.send(new DeleteCommand(deleteParams));
      deletedCount++;
      
      // Log progress every 10 items
      if (deletedCount % 10 === 0) {
        console.log(`   Deleted ${deletedCount}/${items.length} payments...`);
      }
    }
    
    console.log(`✅ Successfully deleted ${deletedCount} payments!`);
    console.log('🎉 Database is now empty');
    
  } catch (error) {
    console.error('❌ Error clearing payments:', error);
    throw error;
  }
}

// Run the script
clearAllPayments()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
