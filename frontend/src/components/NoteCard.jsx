import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const NoteCard = ({ note }) => {
  const { user } = useContext(AuthContext);
  const canDownload = user && user.uploadCount > 0;
  
  const [downloadCount] = useState(note.downloadCount || 0);
  const [downloading, setDownloading] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  // Helper: read error message from blob response (axios blob responseType returns error body as Blob)
  const parseBlobError = async (error) => {
    try {
      if (error.response?.data instanceof Blob) {
        const text = await error.response.data.text();
        const json = JSON.parse(text);
        return json.message || 'Unknown error';
      }
      return error.response?.data?.message || error.message || 'Unknown error';
    } catch {
      return error.message || 'Unknown error';
    }
  };

  const handleDownload = async () => {
    if (!canDownload || downloading) return;
    
    setDownloading(true);
    try {
      const response = await axios.get(`/notes/download/${note._id}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', note.originalFileName || `${note.title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed', error);
      const msg = await parseBlobError(error);
      alert(`Download failed: ${msg}`);
    } finally {
      setDownloading(false);
    }
  };

  const handlePreview = async () => {
    if (!canDownload || previewing) return;
    setPreviewing(true);
    try {
      const response = await axios.get(`/notes/preview/${note._id}`, { responseType: 'blob' });
      const fileURL = URL.createObjectURL(response.data);
      window.open(fileURL, '_blank');
    } catch (error) {
      console.error("Preview failed", error);
      const msg = await parseBlobError(error);
      alert(`Preview failed: ${msg}`);
    } finally {
      setPreviewing(false);
    }
  };

  // Get file icon based on extension
  const getIcon = (filename) => {
    const ext = filename?.split('.').pop().toLowerCase();
    if (ext === 'pdf') return '📄';
    if (ext === 'doc' || ext === 'docx') return '📝';
    if (ext === 'ppt' || ext === 'pptx') return '📽️';
    return '📁';
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div style={{ fontSize: '2rem', padding: '10px', background: 'rgba(124, 92, 255, 0.05)', borderRadius: '12px' }}>
          {getIcon(note.originalFileName)}
        </div>
        <div style={{ textAlign: 'right' }}>
           <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--subtext)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Semester</span>
           <span style={{ fontWeight: '800', color: 'var(--primary)' }}>S{note.semester}</span>
        </div>
      </div>
      
      <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
        <span style={{ fontSize: '0.7rem', background: 'rgba(124, 92, 255, 0.1)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '6px', fontWeight: '800', textTransform: 'uppercase' }}>
          {note.course}
        </span>
        <span style={{ fontSize: '0.7rem', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--subtext)', padding: '4px 10px', borderRadius: '6px', fontWeight: '800', textTransform: 'uppercase' }}>
          {note.subject}
        </span>
      </div>

      <h3 style={{ marginBottom: '8px', fontSize: '1.2rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.2px', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '3.4rem' }}>
        {note.title}
      </h3>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', color: 'var(--subtext)', fontSize: '0.85rem' }}>
        <span>📥</span>
        <span>{downloadCount} downloads so far</span>
      </div>
      
      {canDownload ? (
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-outline"
            style={{ flex: 1, padding: '10px', opacity: previewing ? 0.6 : 1 }}
            onClick={handlePreview}
            disabled={previewing || downloading}
          >
            {previewing ? '...' : 'View'}
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 2, padding: '10px', opacity: downloading ? 0.6 : 1 }}
            onClick={handleDownload}
            disabled={downloading || previewing}
          >
            {downloading ? 'Downloading...' : 'Download'}
          </button>
        </div>
      ) : (
        <div style={{ padding: '12px', background: 'rgba(255,100,100,0.05)', border: '1px dashed rgba(239, 68, 68, 0.2)', borderRadius: '12px', textAlign: 'center', fontSize: '0.85rem', color: '#fca5a5', fontWeight: '600' }}>
          Locked Content
        </div>
      )}
    </div>
  );
};

export default NoteCard;
