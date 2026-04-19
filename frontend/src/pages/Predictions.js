import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { predictionsAPI, dashboardAPI } from '../services/api';

const fmt = n => Number(n).toLocaleString('vi-VN') + '₫';

export default function Predictions() {
  const [prediction, setPrediction] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([predictionsAPI.monthly(), dashboardAPI.monthlyTrend()])
      .then(([p, t]) => {
        setPrediction(p.data);
        const trendData = t.data.map(d => ({ month: d.month.slice(0, 7), expense: Number(d.expense), income: Number(d.income) }));
        // Add prediction point
        const predMonth = `${p.data.year}-${String(p.data.month).padStart(2, '0')}`;
        setTrend([...trendData, { month: predMonth + ' (dự đoán)', expense: Number(p.data.predicted_amount), income: null, predicted: true }]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, color: '#9ca3af' }}>Đang tính toán...</div>;

  const now = new Date();
  const nextMonth = now.getMonth() + 2 > 12 ? 1 : now.getMonth() + 2;
  const nextYear = now.getMonth() + 2 > 12 ? now.getFullYear() + 1 : now.getFullYear();

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dự đoán chi tiêu / Forecast</h1>
      </div>

      {prediction && (
        <div className="prediction-highlight">
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>
            Dự đoán chi tiêu tháng {nextMonth}/{nextYear}
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#1D9E75' }}>
            {fmt(prediction.predicted_amount)}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
            📊 Dựa trên trung bình chi tiêu 3 tháng gần nhất
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: '#374151' }}>
          Xu hướng chi tiêu / Expense trend
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={trend} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => Math.round(v / 1000000) + 'M'} />
            <Tooltip formatter={v => v ? fmt(v) : 'N/A'} />
            <Line type="monotone" dataKey="expense" name="Chi tiêu" stroke="#E24B4A" strokeWidth={2} dot={{ r: 4 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>ℹ️ Cách tính dự đoán</div>
        <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7 }}>
          Hệ thống tính trung bình chi tiêu của 3 tháng gần nhất để dự đoán tháng tiếp theo.
          Khi có nhiều dữ liệu lịch sử hơn, độ chính xác sẽ được cải thiện.
          Trong tương lai có thể nâng cấp lên mô hình học máy để phân tích sâu hơn.
        </div>
      </div>
    </div>
  );
}
