import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { AuthContext } from '../context/AuthContext';

const Upload = () => {
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    semester: '1',
    course: 'Btech'
  });
  const [file, setFile] = useState(null);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherValue, setOtherValue] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { updateUploadCount } = useContext(AuthContext);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      return alert('Please select a file');
    }

    const data = new FormData();
    data.append('title', formData.title);
    data.append('subject', formData.subject);
    data.append('semester', formData.semester);
    data.append('course', showOtherInput ? otherValue : formData.course);
    data.append('file', file);

    try {
      setLoading(true);
      await axios.post('/notes', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      updateUploadCount();
      alert('File uploaded successfully! Your score has increased.');
      navigate('/dashboard');
    } catch (error) {
      alert(error.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="page-wrapper">
        <div className="main-container">
          <div className="page-header animate-fade-in" style={{ textAlign: 'center', justifyContent: 'center', marginBottom: '60px' }}>
            <div>
              <h2 className="page-title">Share Study Material</h2>
              <p style={{ color: 'var(--subtext)', marginTop: '8px' }}>Contribute high-quality notes and help the community grow.</p>
            </div>
          </div>
          
          <div className="card animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', animationDelay: '0.1s' }}>
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label>Title</label>
                <input 
                  type="text" 
                  className="input"
                  placeholder="e.g. Thermodynamics Full Notes" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Subject</label>
                <input 
                  type="text" 
                  className="input"
                  placeholder="e.g. Physics II" 
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Semester</label>
                <select 
                  className="select"
                  value={formData.semester}
                  onChange={(e) => setFormData({...formData, semester: e.target.value})}
                >
                  {[1,2,3,4,5,6,7,8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Course</label>
                <select 
                  className="select"
                  value={formData.course}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({...formData, course: val});
                    setShowOtherInput(val === 'Other');
                  }}
                >
                  <option value="Btech">Btech</option>
                  <option value="MBA">MBA</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {showOtherInput && (
                <div className="form-group animate-fade-in">
                  <label>Enter Course Name</label>
                  <input 
                    type="text" 
                    className="input"
                    placeholder="e.g. B.Sc, B.Com, Medical" 
                    value={otherValue}
                    onChange={(e) => setOtherValue(e.target.value)}
                    required={showOtherInput}
                  />
                </div>
              )}
              
              <div className="form-group">
                <label>File (PDF, Word, or PPT)</label>
                <div style={{ position: 'relative', overflow: 'hidden' }}>
                    <input 
                    type="file" 
                    className="input"
                    onChange={handleFileChange}
                    required
                    style={{ opacity: 1 }}
                    />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--subtext)', marginTop: '8px' }}>Allowed: PDF, DOC, DOCX, PPT, PPTX (Max 10MB)</p>
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '16px', marginTop: '12px' }}
                disabled={loading}
              >
                {loading ? 'Processing Upload...' : 'Publish to Dashboard'}
              </button>
            </form>
          </div>

          <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '40px auto', padding: '24px', background: 'rgba(124, 92, 255, 0.05)', borderRadius: '16px', border: '1px solid var(--border)', animationDelay: '0.2s' }}>
             <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>💡</span> Why share?
             </h4>
             <ul style={{ color: 'var(--subtext)', fontSize: '0.9rem', paddingLeft: '20px', lineHeight: '1.8' }}>
                <li>Get 10 points instantly upon successful upload.</li>
                <li>Unlock all premium downloads for free.</li>
                <li>Help students in junior semesters excel.</li>
                <li>Stay anonymous - your identity is never revealed.</li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
