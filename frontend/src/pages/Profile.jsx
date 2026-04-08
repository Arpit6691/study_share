import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

const Profile = () => {
  const { user } = useContext(AuthContext);

  const formatDate = (dateString) => {
    if (!dateString) return 'Member since 2026';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently joined';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="page-wrapper">
        <div className="main-container">
          <div className="page-header animate-fade-in">
            <div>
              <h2 className="page-title">Personal Overview</h2>
              <p style={{ color: 'var(--subtext)', marginTop: '8px' }}>Manage your account and track your contribution impact.</p>
            </div>
          </div>

          <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '24px', animationDelay: '0.1s', alignItems: 'start' }}>
            <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: '800', color: 'white', border: '2px solid rgba(255,255,255,0.05)' }}>
                {user?.username?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '8px', fontWeight: '800' }}>{user?.username || 'Anonymous Student'}</h3>
              <p style={{ color: 'var(--subtext)', fontSize: '0.9rem', marginBottom: '20px' }}>{user?.email}</p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.7rem', background: 'rgba(124, 92, 255, 0.1)', color: 'var(--primary)', padding: '6px 14px', borderRadius: '40px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Member</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="grid">
                    <div className="card" style={{ padding: '32px' }}>
                        <div style={{ fontSize: '1.8rem', marginBottom: '12px' }}>🏆</div>
                        <p style={{ color: 'var(--subtext)', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Score</p>
                        <h3 style={{ marginTop: '8px', color: 'var(--primary)', fontSize: '2.2rem', fontWeight: '900' }}>{user?.score || 0}</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--subtext)', marginTop: '8px' }}>Points earned by sharing.</p>
                    </div>
                    
                    <div className="card" style={{ padding: '32px' }}>
                        <div style={{ fontSize: '1.8rem', marginBottom: '12px' }}>📂</div>
                        <p style={{ color: 'var(--subtext)', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Shared Notes</p>
                        <h3 style={{ marginTop: '8px', color: 'var(--primary)', fontSize: '2.2rem', fontWeight: '900' }}>{user?.uploadCount || 0}</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--subtext)', marginTop: '8px' }}>Contribution</p>
                    </div>
                </div>

                <div className="card" style={{ padding: '32px' }}>
                     <h4 style={{ marginBottom: '24px', fontWeight: '800', fontSize: '1.1rem', letterSpacing: '-0.2px' }}>Account Settings</h4>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ color: 'var(--subtext)', fontSize: '0.9rem' }}>Full Name</span>
                            <span style={{ fontWeight: '600', color: '#fff' }}>{user?.name || 'Not Provided'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ color: 'var(--subtext)', fontSize: '0.9rem' }}>Username</span>
                            <span style={{ fontWeight: '600', color: '#fff' }}>@{user?.username || 'anonymous'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ color: 'var(--subtext)', fontSize: '0.9rem' }}>Email Address</span>
                            <span style={{ fontWeight: '600', color: '#fff' }}>{user?.email}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--subtext)', fontSize: '0.9rem' }}>Join Date</span>
                            <span style={{ fontWeight: '600', color: '#fff' }}>{formatDate(user?.createdAt)}</span>
                        </div>
                     </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
