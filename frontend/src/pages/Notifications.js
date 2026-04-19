import React, { useEffect, useState } from 'react';
import { notificationsAPI } from '../services/api';

export default function Notifications() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    try { const res = await notificationsAPI.list(); setNotifs(res.data); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const markAll = async () => {
    await notificationsAPI.markAllRead();
    setNotifs(n => n.map(x => ({ ...x, is_read: true })));
  };

  const unread = notifs.filter(n => !n.is_read).length;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Thông báo / Notifications {unread > 0 && <span style={{ fontSize: 14, background: '#E24B4A', color: 'white', borderRadius: 99, padding: '2px 8px', marginLeft: 8 }}>{unread}</span>}</h1>
        {unread > 0 && <button className="btn" onClick={markAll} style={{ fontSize: 12 }}>Đánh dấu tất cả đã đọc</button>}
      </div>

      {loading ? <div style={{ color: '#9ca3af', padding: 40 }}>Đang tải...</div> :
        notifs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
            <div style={{ fontSize: 14 }}>Không có thông báo nào</div>
          </div>
        ) : (
          notifs.map(n => (
            <div key={n.id} className={`notif-item notif-${n.type}`} style={{ opacity: n.is_read ? 0.6 : 1, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div className="notif-title">{n.title}</div>
                <div className="notif-msg">{n.message}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                  {new Date(n.created_at).toLocaleString('vi-VN')}
                </div>
              </div>
              {!n.is_read && (
                <button className="btn" style={{ fontSize: 11, padding: '3px 8px' }}
                  onClick={async () => { await notificationsAPI.markRead(n.id); fetch(); }}>
                  Đã đọc
                </button>
              )}
            </div>
          ))
        )}
    </div>
  );
}
