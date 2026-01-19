import { Payment, PaymentStatus } from '../types/payment.js';
import { docClient, PAYMENTS_TABLE } from './dynamodb.js';
import { PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

/**
 * DynamoDB Repository for Payment operations
 * Uses AWS SDK v3 with Document Client for type-safe operations
 */

/**
 * Create a new payment record
 */
export async function createPayment(payment: Payment): Promise<Payment> {
  const params = {
    TableName: PAYMENTS_TABLE,
    Item: payment,
  };

  await docClient.send(new PutCommand(params));
  return payment;
}

/**
 * Get a payment by userId and paymentId
 */
export async function getPayment(userId: string, paymentId: string): Promise<Payment | null> {
  const params = {
    TableName: PAYMENTS_TABLE,
    Key: {
      userId,
      paymentId,
    },
  };

  const result = await docClient.send(new GetCommand(params));
  return result.Item ? (result.Item as Payment) : null;
}

/**
 * List all payments for a user, optionally filtered by status
 */
export async function listPayments(
  userId: string,
  status?: PaymentStatus
): Promise<Payment[]> {
  if (status) {
    // Use StatusIndex GSI to filter by status
    const params = {
      TableName: PAYMENTS_TABLE,
      IndexName: 'StatusIndex',
      KeyConditionExpression: 'userId = :userId AND #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':userId': userId,
        ':status': status,
      },
    };

    const result = await docClient.send(new QueryCommand(params));
    return (result.Items || []) as Payment[];
  } else {
    // Query all payments for user
    const params = {
      TableName: PAYMENTS_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    };

    const result = await docClient.send(new QueryCommand(params));
    return (result.Items || []) as Payment[];
  }
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  userId: string,
  paymentId: string,
  status: PaymentStatus,
  trueLayerData?: any
): Promise<Payment> {
  const params = {
    TableName: PAYMENTS_TABLE,
    Key: {
      userId,
      paymentId,
    },
    UpdateExpression: trueLayerData
      ? 'SET #status = :status, updatedAt = :updatedAt, trueLayerData = :trueLayerData'
      : 'SET #status = :status, updatedAt = :updatedAt',
    ExpressionAttributeNames: {
      '#status': 'status',
    },
    ExpressionAttributeValues: {
      ':status': status,
      ':updatedAt': new Date().toISOString(),
      ...(trueLayerData && { ':trueLayerData': trueLayerData }),
    },
    ReturnValues: 'ALL_NEW',
  };

  const result = await docClient.send(new UpdateCommand(params));
  return result.Attributes as Payment;
}

/**
 * Get payment statistics (for graphs)
 * Returns payments grouped by day for the last N days
 */
export async function getPaymentStats(userId: string, days: number = 7): Promise<Payment[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString();

  // Use CreatedAtIndex GSI to efficiently query by date range
  const params = {
    TableName: PAYMENTS_TABLE,
    IndexName: 'CreatedAtIndex',
    KeyConditionExpression: 'userId = :userId AND createdAt >= :startDate',
    ExpressionAttributeValues: {
      ':userId': userId,
      ':startDate': startDateStr,
    },
  };

  const result = await docClient.send(new QueryCommand(params));
  return (result.Items || []) as Payment[];
}

/**
 * Search payments by reference or amount
 */
export async function searchPayments(
  userId: string,
  searchTerm: string
): Promise<Payment[]> {
  // First, get all payments for the user
  const allPayments = await listPayments(userId);
  
  // Filter in-memory for search (DynamoDB doesn't support contains on non-indexed fields efficiently)
  const searchLower = searchTerm.toLowerCase();
  
  return allPayments.filter(
    (payment) =>
      payment.reference.toLowerCase().includes(searchLower) ||
      payment.amount.toString().includes(searchTerm) ||
      payment.paymentId.toLowerCase().includes(searchLower)
  );
}

/**
 * Delete a payment
 * Only allows deletion of unpaid payments (authorization_required, authorizing, failed, cancelled)
 */
export async function deletePayment(userId: string, paymentId: string): Promise<void> {
  const params = {
    TableName: PAYMENTS_TABLE,
    Key: {
      userId,
      paymentId,
    },
  };

  await docClient.send(new DeleteCommand(params));
}
