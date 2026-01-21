import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Initialize DynamoDB tables for the Payment Dashboard
 * Run this script once before starting the server
 */

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.DYNAMODB_ENDPOINT && {
    endpoint: process.env.DYNAMODB_ENDPOINT,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy',
    },
  }),
});

const PAYMENTS_TABLE = 'Payments';

/**
 * Create the Payments table with proper schema and indexes
 */
async function createPaymentsTable() {
  const params = {
    TableName: PAYMENTS_TABLE,
    KeySchema: [
      { AttributeName: 'userId', KeyType: 'HASH' as const },  // Partition key
      { AttributeName: 'paymentId', KeyType: 'RANGE' as const }, // Sort key
    ],
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' as const },
      { AttributeName: 'paymentId', AttributeType: 'S' as const },
      { AttributeName: 'status', AttributeType: 'S' as const },
      { AttributeName: 'createdAt', AttributeType: 'S' as const },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'StatusIndex',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' },
          { AttributeName: 'status', KeyType: 'RANGE' },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
      {
        IndexName: 'CreatedAtIndex',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' as const },
          { AttributeName: 'createdAt', KeyType: 'RANGE' as const },
        ],
        Projection: {
          ProjectionType: 'ALL' as const,
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  };

  try {
    // Check if table already exists
    try {
      await client.send(new DescribeTableCommand({ TableName: PAYMENTS_TABLE }));
      console.log(`✓ Table ${PAYMENTS_TABLE} already exists`);
      return;
    } catch (error: any) {
      if (error.name !== 'ResourceNotFoundException') {
        throw error;
      }
      // Table doesn't exist, continue to create it
    }

    // Create the table
    // @ts-expect-error - DynamoDB type definitions are overly strict, params are valid
    await client.send(new CreateTableCommand(params));
    console.log(`✓ Table ${PAYMENTS_TABLE} created successfully`);

    // Wait for table to be active
    let tableStatus = 'CREATING';
    while (tableStatus === 'CREATING') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const response = await client.send(
        new DescribeTableCommand({ TableName: PAYMENTS_TABLE })
      );
      tableStatus = response.Table?.TableStatus || 'CREATING';
    }

    console.log(`✓ Table ${PAYMENTS_TABLE} is now active`);
  } catch (error: any) {
    if (error.name === 'ResourceInUseException') {
      console.log(`✓ Table ${PAYMENTS_TABLE} already exists`);
    } else {
      console.error(`✗ Error creating table ${PAYMENTS_TABLE}:`, error);
      throw error;
    }
  }
}

/**
 * Main initialization function
 */
async function initializeDatabase() {
  console.log('🚀 Initializing Payment Dashboard Database...');
  console.log(`📍 Endpoint: ${process.env.DYNAMODB_ENDPOINT || 'AWS DynamoDB'}`);
  console.log(`🌍 Region: ${process.env.AWS_REGION || 'us-east-1'}`);
  console.log('');

  try {
    await createPaymentsTable();
    console.log('');
    console.log('✓ Database initialization complete!');
    console.log('✓ You can now start the server with: npm run dev');
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('✗ Database initialization failed!');
    console.error(error);
    process.exit(1);
  }
}

// Run initialization
initializeDatabase();
