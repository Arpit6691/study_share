import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import NoteCard from '../components/NoteCard';

const Dashboard = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [fileType, setFileType] = useState('');
  
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        let query = '?';
        if (search) query += `search=${search}&`;
        if (subjectFilter) query += `subject=${subjectFilter}&`;
        if (semesterFilter) query += `semester=${semesterFilter}&`;
        if (courseFilter) query += `course=${courseFilter}&`;
        if (fileType) query += `fileType=${fileType}&`;
        
        const res = await axios.get(`/notes${query}`);
        setNotes(res.data);
      } catch (error) {
        console.error('Failed to fetch notes', error);
      } finally {
        setLoading(false);
      }
    };
    
    const timeoutId = setTimeout(() => {
      fetchNotes();
    }, 400);
    
    return () => clearTimeout(timeoutId);
  }, [search, subjectFilter, semesterFilter, courseFilter, fileType]);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="page-wrapper">
        <div className="main-container">
          <div className="page-header animate-fade-in">
            <div>
              <h2 className="page-title">Available Materials</h2>
              <p style={{ color: 'var(--subtext)', marginTop: '8px' }}>Unlock study notes from fellow students across semesters.</p>
            </div>
            {user?.uploadCount > 0 && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(124, 92, 255, 0.1)', padding: '10px 20px', borderRadius: '12px' }}>
                <span style={{ fontSize: '1.2rem' }}>⭐</span>
                <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{user.score} Points</span>
              </div>
            )}
          </div>

          <div className="search-container animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="search-input-wrapper">
              <input 
                type="text" 
                className="input"
                placeholder="Search by title, subject, or topic..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select 
              className="select"
              style={{ width: 'auto', minWidth: '160px' }}
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
            >
              <option value="">All Semesters</option>
              {[1,2,3,4,5,6,7,8].map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
            <select 
              className="select"
              style={{ width: 'auto', minWidth: '160px' }}
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
            >
              <option value="">All Courses</option>
              <option value="Btech">Btech</option>
              <option value="MBA">MBA</option>
              <option value="Other">Other</option>
            </select>
            <select 
              className="select"
              style={{ width: 'auto', minWidth: '160px' }}
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
            >
              <option value="">All Formats</option>
              <option value="pdf">PDF Docs</option>
              <option value="doc">Word Files</option>
              <option value="ppt">PowerPoint</option>
            </select>
          </div>

          {user?.uploadCount === 0 && (
            <div className="card animate-fade-in" style={{ border: '1px solid #ef4444', marginBottom: '40px', background: 'rgba(239, 68, 68, 0.05)', animationDelay: '0.2s', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', fontSize: '1.5rem' }}>⚠️</div>
              <div>
                <h4 style={{ color: '#ef4444', marginBottom: '4px' }}>Action Required to Download</h4>
                <p style={{ color: '#fca5a5', fontSize: '0.9rem' }}>You must upload at least one study material before you can download others. Join the community today!</p>
              </div>
              <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => window.location.href='/upload'}>Upload Material</button>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
              <p style={{ color: 'var(--subtext)' }}>Fetching the best notes for you...</p>
            </div>
          ) : notes.length > 0 ? (
            <div className="grid animate-fade-in" style={{ animationDelay: '0.3s' }}>
              {notes.map(note => (
                <NoteCard key={note._id} note={note} />
              ))}
            </div>
          ) : (
            <div className="card animate-fade-in" style={{ textAlign: 'center', padding: '100px 0', borderStyle: 'dashed', animationDelay: '0.3s' }}>
              <div style={{ fontSize: '3rem', marginBottom: '24px' }}>🔍</div>
              <h3 style={{ marginBottom: '12px' }}>No materials found</h3>
              <p style={{ color: 'var(--subtext)' }}>Try adjusting your search filters or search keywords.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
