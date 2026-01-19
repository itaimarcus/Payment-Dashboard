import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiClient } from '../services/api';
import type { PaymentStats as PaymentStatsType } from '../types/payment';

function PaymentStats() {
  const [stats, setStats] = useState<PaymentStatsType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(7);

  useEffect(() => {
    fetchStats();
  }, [days]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getPaymentStats(days);
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center text-red-600">
          <p>Failed to load statistics: {error}</p>
        </div>
      </div>
    );
  }

  // Convert to ILS (Israeli Shekels) - Fixed rates as of January 2026
  const GBP_TO_ILS = 4.23;  // £1 = ₪4.23
  const EUR_TO_ILS = 3.67;  // €1 = ₪3.67

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Payment Statistics</h2>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 3 months</option>
        </select>
      </div>

      {/* Chart - Full Width */}
      {stats.length > 0 ? (
        <div style={{ width: '100%', height: '350px', minHeight: '350px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      const day = String(date.getDate()).padStart(2, '0');
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const year = date.getFullYear();
                      return `${day}/${month}/${year}`;
                    }}
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                    }}
                    formatter={(value: number, name: string, props: any) => {
                      const symbol = name === 'GBP' ? '£' : '€';
                      return [`${symbol}${value.toFixed(2)}`, name];
                    }}
                    labelFormatter={(label) => {
                      const date = new Date(label);
                      const day = String(date.getDate()).padStart(2, '0');
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const year = date.getFullYear();
                      return `${day}/${month}/${year}`;
                    }}
                    content={(props: any) => {
                      if (!props.active || !props.payload || props.payload.length === 0) return null;
                      
                      const data = props.payload[0].payload;
                      const gbpAmount = data.GBP || 0;
                      const eurAmount = data.EUR || 0;
                      const ilsAmount = (gbpAmount * GBP_TO_ILS) + (eurAmount * EUR_TO_ILS);
                      
                      const date = new Date(data.date);
                      const day = String(date.getDate()).padStart(2, '0');
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const year = date.getFullYear();
                      
                      return (
                        <div style={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.5rem',
                          padding: '10px'
                        }}>
                          <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>{`${day}/${month}/${year}`}</p>
                          <p style={{ color: '#3b82f6', margin: '4px 0' }}>GBP: £{gbpAmount.toFixed(2)}</p>
                          <p style={{ color: '#eab308', margin: '4px 0' }}>EUR: €{eurAmount.toFixed(2)}</p>
                          <p style={{ color: '#000', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                            Total: ₪{ilsAmount.toFixed(2)}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="GBP" fill="#3b82f6" radius={[8, 8, 0, 0]} name="GBP" />
                  <Bar dataKey="EUR" fill="#eab308" radius={[8, 8, 0, 0]} name="EUR" />
                </BarChart>
              </ResponsiveContainer>
        </div>
      ) : (
        <div style={{ width: '100%', height: '350px' }} className="flex items-center justify-center text-gray-500">
              <div className="text-center">
                <svg
                  className="w-16 h-16 mx-auto mb-2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <p>No payment data available for this period</p>
              </div>
            </div>
      )}
    </div>
  );
}

export default PaymentStats;
