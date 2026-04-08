import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const MyFiles = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');

  const fetchMyNotes = async () => {
    try {
      setLoading(true);
      let query = '?';
      if (search) query += `search=${search}&`;
      if (semesterFilter) query += `semester=${semesterFilter}&`;
      
      const res = await axios.get(`/notes/my-notes${query}`);
      setNotes(res.data);
    } catch (error) {
      console.error('Failed to fetch your notes', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchMyNotes();
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [search, semesterFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this file? This will also reduce your score.')) return;
    try {
      await axios.delete(`/notes/${id}`);
      setNotes(notes.filter(n => n._id !== id));
    } catch (error) {
      alert('Failed to delete file');
    }
  };

  const handlePreview = (id) => {
    axios.get(`/notes/preview/${id}`, { responseType: 'blob' })
      .then(response => {
        const fileURL = URL.createObjectURL(response.data);
        window.open(fileURL, '_blank');
      });
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="page-wrapper">
        <div className="main-container">
          <div className="page-header animate-fade-in" style={{ marginBottom: '48px' }}>
            <div>
              <h2 className="page-title">My Uploaded Materials</h2>
              <p style={{ color: 'var(--subtext)', marginTop: '8px' }}>Manage and edit the study resources you've contributed.</p>
            </div>
          </div>

          <div className="card animate-fade-in" style={{ padding: '32px', animationDelay: '0.1s' }}>
            <div className="search-container" style={{ marginBottom: '32px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <div className="search-input-wrapper" style={{ flex: 1 }}>
                <input 
                  type="text" 
                  className="input"
                  placeholder="Search your notes by title..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ background: 'transparent', border: 'none' }}
                />
              </div>
              <div style={{ height: '24px', width: '1px', background: 'var(--border)', margin: '0 16px' }}></div>
              <select 
                className="select"
                style={{ background: 'transparent', border: 'none', width: 'auto', padding: '0 10px', color: 'var(--subtext)', fontWeight: '600' }}
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
              >
                <option value="">Semesters: All</option>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                <thead>
                  <tr style={{ color: 'var(--subtext)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    <th style={{ textAlign: 'left', padding: '0 16px' }}>Material Detail</th>
                    <th style={{ textAlign: 'left', padding: '0 16px' }}>Semester</th>
                    <th style={{ textAlign: 'left', padding: '0 16px' }}>Stats</th>
                    <th style={{ textAlign: 'right', padding: '0 16px' }}>Management</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '60px' }}>Loading your contribution vault...</td></tr>
                  ) : notes.length > 0 ? (
                    notes.map((note) => (
                      <tr key={note._id} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '14px', transition: 'var(--transition)' }}>
                        <td style={{ padding: '20px 16px', borderTopLeftRadius: '14px', borderBottomLeftRadius: '14px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '4px', color: '#fff' }}>{note.title}</span>
                            <span style={{ fontSize: '0.75rem', background: 'rgba(124, 92, 255, 0.1)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '4px', width: 'fit-content', fontWeight: '800' }}>
                              {note.subject}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '20px 16px' }}>
                           <span style={{ fontWeight: '600' }}>SEM {note.semester}</span>
                        </td>
                        <td style={{ padding: '20px 16px' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--subtext)', fontSize: '0.9rem' }}>
                             <span style={{ fontSize: '1rem' }}>📥</span> {note.downloadCount} downloads
                           </div>
                        </td>
                        <td style={{ padding: '20px 16px', borderTopRightRadius: '14px', borderBottomRightRadius: '14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => handlePreview(note._id)}>
                              View
                            </button>
                            <button className="btn btn-danger" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => handleDelete(note._id)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '80px' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📤</div>
                        <p style={{ color: 'var(--subtext)', marginBottom: '24px' }}>Empty contribution vault? Start sharing to earn points!</p>
                        <button className="btn btn-primary" onClick={() => window.location.href='/upload'}>Upload My First Note</button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyFiles;
