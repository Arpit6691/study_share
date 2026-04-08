import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await axios.get('/auth/leaderboard');
        setLeaders(res.data);
      } catch (error) {
        console.error('Failed to fetch leaderboard window', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getRankEmoji = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="page-wrapper">
        <div className="main-container">
          <div className="page-header animate-fade-in">
            <div>
              <h2 className="page-title">Community Top Contributors</h2>
              <p style={{ color: 'var(--subtext)', marginTop: '8px' }}>Recognizing the students who share the most knowledge.</p>
            </div>
            <div style={{ padding: '12px 24px', background: 'rgba(124, 92, 255, 0.1)', border: '1px solid var(--border)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.4rem' }}>⭐</span>
                <span style={{ fontWeight: '700' }}>{leaders.length} Rankers</span>
            </div>
          </div>
          
          <div className="card animate-fade-in" style={{ padding: '0', animationDelay: '0.1s', overflow: 'hidden' }}>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Rank</th>
                    <th>Contributor</th>
                    <th style={{ textAlign: 'right' }}>Score</th>
                    <th style={{ textAlign: 'right' }}>Resources Shared</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '100px 0', color: 'var(--subtext)' }}>Gathering contribution data...</td></tr>
                  ) : leaders.length > 0 ? (
                    leaders.map((user, index) => (
                      <tr key={user._id} className={index < 3 ? 'row-highlight' : ''}>
                        <td>
                           <span style={{ 
                             fontSize: index < 3 ? '1.4rem' : '1rem', 
                             fontWeight: index < 3 ? '900' : '600',
                             color: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : index === 2 ? '#cd7f32' : 'var(--subtext)'
                           }}>
                             {getRankEmoji(index)}
                           </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ 
                                background: index === 0 ? 'linear-gradient(135deg, #fbbf24, #d97706)' : 'rgba(255,255,255,0.03)', 
                                width: '44px', 
                                height: '44px', 
                                borderRadius: '12px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontWeight: '800',
                                color: index === 0 ? '#000' : 'var(--primary)',
                                border: index === 0 ? 'none' : '1px solid var(--border)',
                                fontSize: '1.1rem'
                            }}>
                              {user.username?.charAt(0).toUpperCase() || user.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>
                                  {user.username ? `@${user.username}` : user.name || 'Anonymous Contributor'}
                                </span>
                                {user.username && user.name && (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--subtext)', fontWeight: 500 }}>
                                    {user.name}
                                  </span>
                                )}
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span style={{ 
                            fontWeight: 800, 
                            color: 'var(--primary)', 
                            fontSize: '1.2rem',
                            background: 'rgba(124, 92, 255, 0.05)',
                            padding: '6px 14px',
                            borderRadius: '10px'
                          }}>
                            {user.score?.toLocaleString() || 0}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ color: 'var(--text)', fontWeight: '700' }}>
                            {user.uploadCount || 0} <span style={{ color: 'var(--subtext)', fontWeight: '500', fontSize: '0.85rem' }}>files</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '60px' }}>No contributors found yet. Be the first!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="animate-fade-in" style={{ marginTop: '40px', textAlign: 'center', color: 'var(--subtext)', animationDelay: '0.2s' }}>
             <p>Earn points by uploading study materials. Each upload gives 10 points.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
