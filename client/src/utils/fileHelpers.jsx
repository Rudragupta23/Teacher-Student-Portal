import { useState, useEffect } from 'react';

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
  if (kind === 'html') return <HtmlPreview url={url} name={name} className={className} />;

  return (
    <div className="text-center p-6">
      <p className="text-xs text-slate-400 font-bold mb-3">Preview not available for this format.</p>
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs bg-indigo-500 text-white px-4 py-2 rounded-xl font-black shadow-md inline-block">Open File in New Tab</a>
    </div>
  );
};

// Shows an HTML file as a working page.
const HtmlPreview = ({ url, name, className }) => {
  const [html, setHtml] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setHtml(null);
    setFailed(false);
    fetch(url)
      .then(res => { if (!res.ok) throw new Error('Could not load'); return res.text(); })
      .then(text => { if (!cancelled) setHtml(text); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [url]);

  const sandbox = 'allow-scripts allow-forms allow-popups';
  if (html !== null) return <iframe srcDoc={html} sandbox={sandbox} className={className} title={name || 'HTML Preview'}></iframe>;
  if (failed) return <iframe src={url} sandbox={sandbox} className={className} title={name || 'HTML Preview'}></iframe>;
  return <p className="text-xs text-slate-400 font-bold p-6 text-center">Loading preview...</p>;
};

// A list of files with Preview / Open / Download buttons.
export const AttachmentList = ({ files = [], emptyText = 'No files.' }) => {
  const [openUrl, setOpenUrl] = useState(null);
  const list = files.filter(f => f && f.url);

  if (list.length === 0) {
    return <p className="text-xs font-bold text-slate-400 bg-white rounded-xl border border-dashed border-slate-200 p-4 text-center">{emptyText}</p>;
  }

  return (
    <div className="space-y-2">
      {list.map((file, idx) => (
        <div key={`${file.url}-${idx}`} className="bg-white p-3 border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-[#1B2559] truncate" title={file.name}>📎 {file.name || `File ${idx + 1}`}</p>
            <div className="flex gap-1.5 shrink-0">
              <button type="button" onClick={() => setOpenUrl(openUrl === file.url ? null : file.url)} className="text-cyan-600 hover:text-cyan-700 font-bold text-xs bg-cyan-50 px-2.5 py-1.5 rounded-lg">
                {openUrl === file.url ? 'Close' : 'Preview'}
              </button>
              <button type="button" onClick={() => window.open(file.url, '_blank')} className="text-indigo-600 hover:text-indigo-700 font-bold text-xs bg-indigo-50 px-2.5 py-1.5 rounded-lg">
                Open
              </button>
              <button type="button" onClick={() => downloadFile(file.url, file.name)} className="text-emerald-600 hover:text-emerald-700 font-bold text-xs bg-emerald-50 px-2.5 py-1.5 rounded-lg">
                ⬇️
              </button>
            </div>
          </div>
          {openUrl === file.url && (
            <div className="w-full h-72 mt-2 border-2 border-slate-100 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center">
              <FilePreview url={file.url} name={file.name} className="w-full h-full border-0" imgClassName="w-full h-full object-contain" />
            </div>
          )}
        </div>
      ))}
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