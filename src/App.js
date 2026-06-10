import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import './App.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

function StatusBadge({ status }) {
  const color = status === 'NOMINAL' ? '#4ade80' : '#ef4444';
  return (
    <span style={{ color, fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.1em', border: `1px solid ${color}`, padding: '2px 8px' }}>
      {status}
    </span>
  );
}

function SatelliteCard({ sat, onClick, selected }) {
  return (
    <div onClick={() => onClick(sat)} style={{
      background: selected ? 'rgba(255,107,43,0.08)' : '#1a1a2e',
      border: selected ? '1px solid #ff6b2b' : '1px solid rgba(255,255,255,0.08)',
      padding: '20px', cursor: 'pointer', transition: 'all 0.3s',
      marginBottom: '12px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ color: '#fff', fontFamily: 'monospace', margin: 0 }}>{sat.name}</h3>
        <StatusBadge status={sat.status} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <Metric label="ALT" value={`${sat.altitude.toFixed(1)} km`} />
        <Metric label="VEL" value={`${sat.velocity.toFixed(0)} km/h`} />
        <Metric label="BAT" value={`${sat.battery.toFixed(1)}%`} color={sat.battery < 20 ? '#ef4444' : '#4ade80'} />
        <Metric label="TEMP" value={`${sat.temperature.toFixed(1)}°C`} color={sat.temperature > 50 ? '#ef4444' : '#60a5fa'} />
      </div>
    </div>
  );
}

function Metric({ label, value, color }) {
  return (
    <div>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.15em' }}>{label}</div>
      <div style={{ color: color || '#ff6b2b', fontFamily: 'monospace', fontSize: '14px', fontWeight: 'bold' }}>{value}</div>
    </div>
  );
}

export default function App() {
  const [satellites, setSatellites] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sats, alts] = await Promise.all([
          axios.get(`${API}/satellites`),
          axios.get(`${API}/alerts`)
        ]);
        setSatellites(sats.data);
        setAlerts(alts.data.slice(-10).reverse());
        if (selected) {
          const updated = sats.data.find(s => s.id === selected.id);
          if (updated) {
            setSelected(updated);
            setHistory(prev => [...prev.slice(-20), {
              time: new Date().toLocaleTimeString(),
              velocity: parseFloat(updated.velocity.toFixed(0)),
              battery: parseFloat(updated.battery.toFixed(1)),
            }]);
          }
        }
      } catch (e) { console.error(e); }
    };
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [selected]);

  return (
    <div style={{ background: '#0a0a1a', minHeight: '100vh', color: '#fff', fontFamily: 'monospace' }}>
      <header style={{ background: '#111127', borderBottom: '1px solid rgba(255,107,43,0.2)', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '20px' }}></span>
        <h1 style={{ margin: 0, fontSize: '16px', letterSpacing: '0.2em', color: '#ff6b2b' }}>MISSION CONTROL DASHBOARD</h1>
        <span style={{ marginLeft: 'auto', color: '#4ade80', fontSize: '11px', letterSpacing: '0.1em' }}>● LIVE</span>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 0, height: 'calc(100vh - 57px)' }}>

        <div style={{ borderRight: '1px solid rgba(255,255,255,0.08)', padding: '24px', overflowY: 'auto' }}>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.2em', marginBottom: '16px' }}>SATELLITES ({satellites.length})</div>
          {satellites.map(sat => (
            <SatelliteCard key={sat.id} sat={sat} onClick={setSelected} selected={selected?.id === sat.id} />
          ))}
        </div>

        <div style={{ padding: '24px', overflowY: 'auto' }}>
          {selected ? (
            <>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ color: '#ff6b2b', margin: '0 0 4px', letterSpacing: '0.1em' }}>{selected.name}</h2>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>Real-time telemetry · Updates every 3s</div>
              </div>

              <div style={{ background: '#111127', border: '1px solid rgba(255,255,255,0.08)', padding: '24px', marginBottom: '24px' }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.2em', marginBottom: '16px' }}>VELOCITY & BATTERY HISTORY</div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #ff6b2b', color: '#fff' }} />
                    <Line type="monotone" dataKey="velocity" stroke="#ff6b2b" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="battery" stroke="#4ade80" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
              ← Select a satellite to view telemetry
            </div>
          )}

          <div style={{ background: '#111127', border: '1px solid rgba(255,255,255,0.08)', padding: '24px' }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.2em', marginBottom: '16px' }}>ALERTS LOG ({alerts.length})</div>
            {alerts.length === 0 ? (
              <div style={{ color: '#4ade80', fontSize: '12px' }}>✓ All systems nominal</div>
            ) : alerts.map(a => (
              <div key={a.id} style={{ borderLeft: '2px solid #ef4444', paddingLeft: '12px', marginBottom: '10px' }}>
                <div style={{ color: '#ef4444', fontSize: '11px', letterSpacing: '0.1em' }}>⚠ {a.type} · {a.satelliteName}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>{a.message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
