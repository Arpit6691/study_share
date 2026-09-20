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
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const navigate = useNavigate();

  const { updateUploadCount } = useContext(AuthContext);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setErrorMessage(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      return alert('Please select a file');
    }

    setErrorMessage(null);
    const isPdf = file.name.toLowerCase().endsWith('.pdf');

    const data = new FormData();
    data.append('title', formData.title);
    data.append('subject', formData.subject);
    data.append('semester', formData.semester);
    data.append('course', showOtherInput ? otherValue : formData.course);
    data.append('file', file);

    try {
      setLoading(true);
      setStatusMessage(isPdf ? 'Checking document content...' : 'Uploading document...');
      
      const res = await axios.post('/notes', data);
      updateUploadCount();
      
      const categoryMsg = res.data.validation?.category ? ` [Category: ${res.data.validation.category}]` : '';
      alert(`File uploaded successfully!${categoryMsg} Your score has increased.`);
      navigate('/dashboard');
    } catch (error) {
      console.error('Upload error:', error);
      const resp = error.response?.data;
      const mainMsg = resp?.message || error.message || 'Upload failed';
      const reasonMsg = resp?.reason;

      setErrorMessage({
        title: mainMsg,
        reason: reasonMsg
      });
    } finally {
      setLoading(false);
      setStatusMessage('');
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
            {errorMessage && (
              <div style={{
                padding: '16px',
                marginBottom: '20px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#ef4444'
              }}>
                <div style={{ fontWeight: '600', marginBottom: errorMessage.reason ? '4px' : '0' }}>
                  {errorMessage.title}
                </div>
                {errorMessage.reason && (
                  <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                    <strong>Reason:</strong> {errorMessage.reason}
                  </div>
                )}
              </div>
            )}

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
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label>Semester</label>
                <select 
                  className="select"
                  value={formData.semester}
                  onChange={(e) => setFormData({...formData, semester: e.target.value})}
                  disabled={loading}
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
                  disabled={loading}
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
                    disabled={loading}
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
                    disabled={loading}
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
                {loading ? (statusMessage || 'Processing Upload...') : 'Publish to Dashboard'}
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
