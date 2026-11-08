import {
  getConfiguredApiBaseUrl, configureApiBaseUrl, getCurrentPlayer,
  getPlayerCity, upgradeKeep, upgradeBuilding, logout, ApiError
} from './backend-api.js';

const panel = document.createElement('section');
panel.id = 'serverCityPanel';
panel.style.cssText = [
  'position:fixed','z-index:12','top:190px','right:10px',
  'width:min(310px,calc(100vw - 20px))','max-height:calc(100dvh - 390px)',
  'overflow:auto','padding:12px','border:1px solid #b99a67',
  'border-radius:12px','background:#14221fee','color:#f4ead6',
  'box-shadow:0 8px 24px #0008','font:12px/1.45 system-ui',
  'display:none'
].join(';');
document.body.append(panel);

const style = document.createElement('style');
style.textContent = `
#serverCityPanel h2{font-size:13px;margin:0 0 7px;color:#f3d69d}
#serverCityPanel p{margin:5px 0;color:#d9c7a4}
#serverCityPanel .server-resources{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin:8px 0}
#serverCityPanel .server-resources span{padding:5px;border:1px solid #56634e;border-radius:6px;background:#1c2b24}
#serverCityPanel button{border:1px solid #b99a67;border-radius:7px;background:#59452c;color:#fff1d9;padding:7px 8px;font-weight:700;font-size:11px}
#serverCityPanel button:disabled{opacity:.5}
#serverCityPanel .server-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:7px}
#serverCityPanel .server-status{font-size:11px;color:#d9c7a4;margin:7px 0}
#serverCityPanel .server-error{color:#ffc1a5}
#serverCityPanel .server-heading{display:flex;align-items:center;justify-content:space-between;gap:8px}
#serverCityPanel .server-heading button{padding:4px 7px}
@media(max-height:650px){#serverCityPanel{top:160px;max-height:calc(100dvh - 300px)}}
`;
document.head.append(style);

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
const heading = element('div', undefined, 'server-heading');
heading.append(element('h2', '🏰 Server şəhəri'));
const closeButton = element('button', 'Gizlət');
closeButton.type = 'button';
closeButton.addEventListener('click', () => { panel.style.display = 'none'; });
heading.append(closeButton);
panel.append(heading);
const status = element('p', 'Server ünvanı yoxlanılır…', 'server-status');
panel.append(status);
const content = element('div');
panel.append(content);

function showStatus(message, error = false) {
  status.textContent = message;
  status.className = error ? 'server-status server-error' : 'server-status';
}
function addButton(label, action, parent) {
  const button = element('button', label);
  button.type = 'button';
  button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      showStatus('Server əməliyyatı icra olunur…');
      await action();
      await refresh();
      showStatus('Server məlumatları yeniləndi.');
    } catch (error) {
      showStatus(error instanceof ApiError ? error.message : 'Server əməliyyatı alınmadı.', true);
    } finally {
      button.disabled = false;
    }
  });
  parent.append(button);
}
function resourceLine(label, value) {
  return element('span', label + ': ' + Number(value || 0).toLocaleString('az-AZ'));
}

async function refresh() {
  const [player, city] = await Promise.all([getCurrentPlayer(), getPlayerCity()]);
  content.replaceChildren();
  const name = element('p', 'Oyunçu: ' + player.nickname);
  const cityName = element('p', city.cityName || 'Krallığın şəhəri');
  content.append(name, cityName, element('p', 'Baş Qala səviyyəsi: ' + city.keepLevel));
  const resources = element('div', undefined, 'server-resources');
  resources.append(
    resourceLine('🪙 Qızıl', city.gold),
    resourceLine('🪵 Taxta', city.wood),
    resourceLine('🪨 Daş', city.stone),
    resourceLine('🌾 Ərzaq', city.food),
    resourceLine('⛓ Dəmir', city.iron)
  );
  content.append(resources);
  const actions = element('div', undefined, 'server-actions');
  addButton('Baş Qalanı yüksəlt', async () => { await upgradeKeep(); }, actions);
  addButton('Meşəçi binası', async () => { await upgradeBuilding('WOODCUTTER'); }, actions);
  addButton('Daş karxanası', async () => { await upgradeBuilding('QUARRY'); }, actions);
  addButton('Ferma', async () => { await upgradeBuilding('FARM'); }, actions);
  addButton('Dəmir mədəni', async () => { await upgradeBuilding('IRON_MINE'); }, actions);
  content.append(actions);
  const levels = element('p',
    'Bina səviyyələri — Meşəçi: ' + city.woodcutterLevel +
    ' · Karxana: ' + city.quarryLevel +
    ' · Ferma: ' + city.farmLevel +
    ' · Dəmir: ' + city.ironMineLevel);
  content.append(levels);
  const logoutButton = element('button', 'Hesabdan çıx');
  logoutButton.type = 'button';
  logoutButton.style.marginTop = '8px';
  logoutButton.addEventListener('click', () => {
    logout();
    configureApiBaseUrl('');
    panel.style.display = 'none';
    location.assign('./auth.html');
  });
  content.append(logoutButton);
  showStatus('Serverə qoşuldu · məlumatlar serverdən oxunur.');
}

const configuredUrl = getConfiguredApiBaseUrl();
if (!configuredUrl) {
  panel.style.display = 'block';
  showStatus('Server hələ qoşulmayıb. Hesab səhifəsində API ünvanı daxil ediləndən sonra burada server şəhəri görünəcək.');
} else {
  configureApiBaseUrl(configuredUrl);
  panel.style.display = 'block';
  refresh().catch(error => {
    showStatus(error instanceof ApiError ? error.message : 'Backend serverə qoşulmaq mümkün olmadı.', true);
    const retry = element('button', 'Yenidən yoxla');
    retry.type = 'button';
    retry.addEventListener('click', () => refresh().catch(err =>
      showStatus(err instanceof ApiError ? err.message : 'Server bağlantısı alınmadı.', true)));
    content.replaceChildren(retry);
  });
}
