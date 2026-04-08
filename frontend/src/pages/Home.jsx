import React from 'react';
import { Link } from 'react-router-dom';
const Home = () => {
  const features = [
    {
      title: 'Anonymous Sharing',
      desc: 'Contribute resources without revealing your identity. Privacy is our top priority.',
      icon: '🛡️'
    },
    {
      title: 'Upload to Unlock',
      desc: 'Access unlimited downloads by contributing your own notes to the community.',
      icon: '🔓'
    },
    {
      title: 'Organized Library',
      desc: 'Easily find what you need by subject and semester in our clean library.',
      icon: '📚'
    }
  ];

  return (
    <div className="main-container" style={{ padding: '0 24px' }}>
      <div className="hero animate-fade-in">
        <div style={{ display: 'inline-block', padding: '8px 20px', borderRadius: '40px', background: 'rgba(124, 92, 255, 0.1)', color: 'var(--primary)', fontWeight: '700', fontSize: '0.85rem', marginBottom: '24px', letterSpacing: '1px' }}>
          ✨ THE ULTIMATE STUDY HUB
        </div>
        <h1>Knowledge is Free.<br/><span style={{ color: 'var(--primary-light)' }}>Sharing it is power.</span></h1>
        <p>A simple, secure platform to share study materials and unlock a world of student-contributed resources. Join thousands of students today.</p>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <Link to="/signup" className="btn btn-primary" style={{ padding: '16px 40px', fontSize: '1.1rem' }}>
            Get Started Now
          </Link>
          <Link to="/dashboard" className="btn btn-outline" style={{ padding: '16px 40px', fontSize: '1.1rem' }}>
            Browse Materials
          </Link>
        </div>

        <div className="feature-cards">
          {features.map((f, i) => (
            <div key={i} className="card feature-card animate-fade-in" style={{ animationDelay: `${0.2 + i * 0.1}s` }}>
              <div className="feature-icon">{f.icon}</div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '16px', fontWeight: '800' }}>{f.title}</h3>
              <p style={{ color: 'var(--subtext)', lineHeight: '1.7' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="section animate-fade-in" style={{ textAlign: 'center', marginTop: '100px', animationDelay: '0.5s' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '60px', fontWeight: '800' }}>How it works</h2>
        <div className="grid" style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {[
            { step: '01', title: 'Create Account', desc: 'Sign up in seconds and join the community.' },
            { step: '02', title: 'Upload Notes', desc: 'Share your PDF or Document files securely.' },
            { step: '03', title: 'Gain Access', desc: 'Get points and unlock all files immediately.' }
          ].map((item, i) => (
            <div key={i} className="card" style={{ textAlign: 'left', padding: '40px' }}>
              <div style={{ fontSize: '3rem', fontWeight: '900', color: 'rgba(124, 92, 255, 0.1)', position: 'absolute', top: '10px', right: '20px' }}>{item.step}</div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '12px' }}>{item.title}</h3>
              <p style={{ color: 'var(--subtext)' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="section animate-fade-in" style={{ marginTop: '120px', padding: '80px 40px', background: 'linear-gradient(135deg, rgba(124, 92, 255, 0.1) 0%, transparent 100%)', borderRadius: '32px', textAlign: 'center', border: '1px solid var(--border)', animationDelay: '0.6s' }}>
        <h2 style={{ fontSize: '2.2rem', marginBottom: '20px' }}>Ready to boost your grades?</h2>
        <p style={{ color: 'var(--subtext)', marginBottom: '40px', fontSize: '1.1rem' }}>Start sharing and downloading materials for free today.</p>
        <Link to="/signup" className="btn btn-primary" style={{ padding: '16px 48px', fontSize: '1.1rem' }}>
          Join StudyShare
        </Link>
      </div>
    </div>
  );
};

export default Home;
