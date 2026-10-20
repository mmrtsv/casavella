// Google Drive for the guests' ID documents: one folder per booking inside DOCS_FOLDER ("05.01 Documentació checkin").
// A service account has no storage of its own, so DOCS_FOLDER must be on a shared drive the account can edit,
// or GOOGLE_DRIVE_AS names the Workspace user it acts for (domain-wide delegation, scope drive).
import { googleToken } from './booking.js';

const API = 'https://www.googleapis.com/drive/v3/files', UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';
const FOLDER = 'application/vnd.google-apps.folder';

export const driveConfigured = env => !!(env.DOCS_FOLDER && env.GOOGLE_SA_EMAIL && env.GOOGLE_SA_KEY);

export async function drive(env) {
  const token = await googleToken(env, 'https://www.googleapis.com/auth/drive', env.GOOGLE_DRIVE_AS || '');
  const auth = { authorization: 'Bearer ' + token };
  const call = async (url, opt = {}) => {
    const r = await fetch(url, { ...opt, headers: { ...auth, ...opt.headers } });
    if (!r.ok) throw new Error(`drive ${opt.method || 'GET'} ${r.status}`);
    return r.json();
  };
  const all = 'supportsAllDrives=true&includeItemsFromAllDrives=true';
  return {
    get: id => call(`${API}/${encodeURIComponent(id)}?fields=id,name&supportsAllDrives=true`),
    folders: async parent => (await call(`${API}?${all}&pageSize=1000&fields=files(id,name)&q=${encodeURIComponent(`'${parent}' in parents and mimeType='${FOLDER}' and trashed=false`)}`)).files || [],
    folder: (name, parent) => call(`${API}?supportsAllDrives=true&fields=id,name`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, mimeType: FOLDER, parents: [parent] }) }),
    // One multipart request: the file's name and folder, then its bytes
    async upload(parent, name, type, bytes) {
      const cut = 'maite' + crypto.randomUUID();
      const head = `--${cut}\r\ncontent-type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name, parents: [parent] })}\r\n--${cut}\r\ncontent-type: ${type}\r\n\r\n`;
      const body = new Blob([head, bytes, `\r\n--${cut}--`]);
      return call(`${UPLOAD}?uploadType=multipart&supportsAllDrives=true&fields=id,name`, { method: 'POST', headers: { 'content-type': `multipart/related; boundary=${cut}` }, body });
    },
  };
}
