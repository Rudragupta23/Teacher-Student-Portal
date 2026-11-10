// Shared helpers for showing and downloading homework files
// (PDF, images, Word .doc/.docx and HTML).

// The file types the admin/grader can attach to homework & tests
export const HOMEWORK_FILE_ACCEPT = '.pdf,image/*,.doc,.docx,.html,.htm';

const getExt = (str = '') => {
  const clean = String(str).toLowerCase().split('?')[0].split('#')[0];
  const match = clean.match(/\.([a-z0-9]+)$/);
  return match ? match[1] : '';
};

// Works out what kind of file it is: 'image' | 'pdf' | 'word' | 'html' | 'other'
export const getFileKind = (url = '', name = '') => {
  const u = String(url || '').toLowerCase();
  if (u.startsWith('data:image')) return 'image';
  if (u.startsWith('data:application/pdf')) return 'pdf';

  const ext = getExt(name) || getExt(u);
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'doc' || ext === 'docx') return 'word';
  if (ext === 'html' || ext === 'htm') return 'html';

  // Old behaviour kept for older uploads that have no extension
  if (u.includes('image')) return 'image';
  if (u.includes('pdf')) return 'pdf';
  return 'other';
};

// Shows a preview for a file. Word files use Microsoft's free online viewer,
// which needs the file URL to be public (your CloudFront/S3 links are).
export const FilePreview = ({ url, name, className = 'w-full h-full border-0 rounded-xl', imgClassName = 'w-full h-full object-contain rounded-xl' }) => {
  if (!url) return null;
  const kind = getFileKind(url, name);

  if (kind === 'image') return <img src={url} alt={name || 'Preview'} className={imgClassName} />;
  if (kind === 'pdf') return <iframe src={url} className={className} title={name || 'PDF Preview'}></iframe>;
  if (kind === 'word') {
    return (
      <iframe
        src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
        className={className}
        title={name || 'Word Preview'}
      ></iframe>
    );
  }
  if (kind === 'html') {
    // sandbox: the page can run its own scripts (e.g. interactive worksheet)
    // but cannot touch the portal or the logged-in user's data
    return <iframe src={url} sandbox="allow-scripts allow-forms allow-popups" className={className} title={name || 'HTML Preview'}></iframe>;
  }

  return (
    <div className="text-center p-6">
      <p className="text-xs text-slate-400 font-bold mb-3">Preview not available for this format.</p>
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs bg-indigo-500 text-white px-4 py-2 rounded-xl font-black shadow-md inline-block">Open File in New Tab</a>
    </div>
  );
};

// Downloads a file with a proper file name. If the direct download is blocked,
// it opens the file in a new tab instead.
export const downloadFile = async (url, fileName) => {
  if (!url) return;
  let finalName = fileName || 'file';
  if (!getExt(finalName)) {
    const ext = getExt(url);
    if (ext) finalName = `${finalName}.${ext}`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Download failed');
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = blobUrl;
    a.download = finalName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Direct download failed', error);
    window.open(url, '_blank');
  }
};