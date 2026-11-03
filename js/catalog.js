(function (root) {
/* ---------- Glyphs (simple, original line icons) ---------- */
const GLYPHS = {
  mail: '<path d="M4 7.5 12 13l8-5.5"/><rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/>',
  cal: '<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 9.5h16M8.5 3v4M15.5 3v4"/><path d="M9 14.5h2M13 14.5h2M9 17h2"/>',
  drive: '<path d="M9 4h6l6 10.5-3 5H6l-3-5z"/><path d="M9 4 6 9.5M15 4l-6 10.5M3 14.5h18"/>',
  doc: '<path d="M7 3.5h7l4.5 4.5v12.5H7z"/><path d="M14 3.5V8h4.5M9.5 12h6M9.5 15h6M9.5 18h4"/>',
  sheet: '<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M5 9.5h14M5 14.5h14M11 9.5v11"/>',
  slide: '<rect x="3.5" y="5" width="17" height="12" rx="2"/><path d="M12 17v3M8.5 20.5h7"/><rect x="8" y="8.5" width="8" height="5" rx="1"/>',
  form: '<rect x="5" y="3.5" width="14" height="17" rx="2"/><circle cx="9" cy="9" r="1"/><circle cx="9" cy="13" r="1"/><circle cx="9" cy="17" r="1"/><path d="M12 9h4M12 13h4M12 17h4"/>',
  keep: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  task: '<circle cx="12" cy="12" r="8.5"/><path d="m8.2 12.3 2.6 2.6 5-5.4"/>',
  meet: '<rect x="3" y="6.5" width="12.5" height="11" rx="2.5"/><path d="m15.5 10.5 5.5-3.5v10l-5.5-3.5"/>',
  chat: '<path d="M5 4.5h14a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 16.5H10L5.5 20v-3.5H5A1.5 1.5 0 0 1 3.5 15V6A1.5 1.5 0 0 1 5 4.5z"/>',
  person: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>',
  photo: '<path d="M12 12V3.5A4.3 4.3 0 0 1 16.3 8H12M12 12h8.5a4.3 4.3 0 0 1-4.3 4.3V12M12 12v8.5A4.3 4.3 0 0 1 7.7 16.2H12M12 12H3.5A4.3 4.3 0 0 1 7.8 7.7V12"/>',
  play: '<rect x="3" y="5.5" width="18" height="13" rx="4"/><path d="m10.5 9.3 4.5 2.7-4.5 2.7z" fill="currentColor"/>',
  music: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/><path d="m11 10.3 3 1.7-3 1.7z" fill="currentColor"/>',
  map: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.5"/>',
  translate: '<path d="M4 5.5h9M8.5 3.5v2M6 5.5c.5 3 2.5 5.5 5.5 7M11 5.5c-.6 3.4-3 6.4-6.5 8"/><path d="m12.5 20.5 4-9.5 4 9.5M14 17h5"/>',
  spark: '<path d="M12 3c.7 4.6 4.4 8.3 9 9-4.6.7-8.3 4.4-9 9-.7-4.6-4.4-8.3-9-9 4.6-.7 8.3-4.4 9-9z"/>',
  book: '<path d="M4 5.5c2.7-1 5.3-1 8 1 2.7-2 5.3-2 8-1v13c-2.7-1-5.3-1-8 1-2.7-2-5.3-2-8-1z"/><path d="M12 6.5v13"/>',
  news: '<rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M7 9h5v4H7zM14.5 9H17M14.5 12h2.5M7 16h10"/>',
  site: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M3.5 9h17"/><circle cx="6.5" cy="6.8" r=".6" fill="currentColor"/><circle cx="8.8" cy="6.8" r=".6" fill="currentColor"/><path d="M7 13h10M7 16h6"/>',
  bars: '<path d="M6 20V13M12 20V8M18 20V4"/>',
  search: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5.5 5.5"/>',
  ad: '<path d="M4 18 10 6l6 12"/><path d="M6.5 13.5h7"/><circle cx="18.5" cy="16.5" r="2"/>',
  shield: '<path d="M12 3 5 6v5.5c0 4.4 3 8 7 9.5 4-1.5 7-5.1 7-9.5V6z"/><circle cx="12" cy="10.5" r="2.2"/><path d="M8.6 16c.7-1.6 2-2.4 3.4-2.4s2.7.8 3.4 2.4"/>',
  cloud: '<path d="M7 18.5a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.4 1.6A3.8 3.8 0 0 1 17.5 18.5z"/>',
  bag: '<path d="M5 8h14l-1 12.5H6z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/><path d="m10.5 12 4 2.2-4 2.2z" fill="currentColor"/>',
  chart: '<path d="M4 4v16h16"/><path d="m7 15 4-4.5 3 3L20 7"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.2 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.2-3.6-8.5S9.6 5.8 12 3.5z"/>',
  school: '<path d="m2.5 9.5 9.5-5 9.5 5-9.5 5z"/><path d="M6.5 11.6V16c1.6 1.4 3.4 2 5.5 2s3.9-.6 5.5-2v-4.4"/>',
  pie: '<path d="M12 3.5v8.5h8.5A8.5 8.5 0 1 1 12 3.5z"/><path d="M15 3.8A8.5 8.5 0 0 1 20.2 9H15z"/>',
  dollar: '<path d="M16 7.5c-.8-1.3-2.2-2-4-2-2.3 0-3.8 1.2-3.8 3 0 4 8 2.3 8 6.5 0 1.8-1.6 3.2-4.2 3.2-2 0-3.5-.8-4.3-2.2M12 3.5v17"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>',
  wallet: '<rect x="3.5" y="6" width="17" height="13" rx="2.5"/><path d="M3.5 10h17M15.5 14.5h2"/><path d="M6 6l9.5-2.5 1 2.5"/>',
};

/* ---------- Google brand-ish colors ---------- */
const C = { blue:'#4285F4', red:'#EA4335', yellow:'#F5B400', green:'#34A853', docs:'#4A7FEE', sheets:'#1E9E5A', slides:'#F4A100', forms:'#7248B9', yt:'#FF0033', gem:'#6C63FF', teal:'#00A08A', gray:'#5F6368', orange:'#F57C00' };

/* ---------- Catalog ---------- */
const APPS = [
  // Trabalho
  { id:'gmail', n:'Gmail', d:'E-mail', u:'https://mail.google.com/', i:'mail', c:C.red, cat:'Trabalho' },
  { id:'calendar', n:'Agenda', d:'Compromissos', u:'https://calendar.google.com/', i:'cal', c:C.blue, cat:'Trabalho', k:'calendar' },
  { id:'drive', n:'Drive', d:'Arquivos', u:'https://drive.google.com/', i:'drive', c:C.green, cat:'Trabalho' },
  { id:'docs', n:'Docs', d:'Documentos', u:'https://docs.google.com/document/', i:'doc', c:C.docs, cat:'Trabalho', k:'documentos texto' },
  { id:'sheets', n:'Planilhas', d:'Sheets', u:'https://docs.google.com/spreadsheets/', i:'sheet', c:C.sheets, cat:'Trabalho', k:'sheets excel' },
  { id:'slides', n:'Apresentações', d:'Slides', u:'https://docs.google.com/presentation/', i:'slide', c:C.slides, cat:'Trabalho', k:'slides powerpoint' },
  { id:'forms', n:'Formulários', d:'Forms', u:'https://docs.google.com/forms/', i:'form', c:C.forms, cat:'Trabalho', k:'forms pesquisa' },
  { id:'keep', n:'Keep', d:'Notas', u:'https://keep.google.com/', i:'keep', c:C.yellow, cat:'Trabalho', k:'notas lembretes' },
  { id:'tasks', n:'Tarefas', d:'Tasks', u:'https://tasks.google.com/', i:'task', c:C.blue, cat:'Trabalho', k:'tasks todo' },
  { id:'sites', n:'Sites', d:'Páginas', u:'https://sites.google.com/', i:'site', c:'#3F51B5', cat:'Trabalho' },
  // Comunicação
  { id:'meet', n:'Meet', d:'Videochamadas', u:'https://meet.google.com/', i:'meet', c:C.teal, cat:'Comunicação', k:'reunião video' },
  { id:'chat', n:'Chat', d:'Mensagens', u:'https://chat.google.com/', i:'chat', c:C.green, cat:'Comunicação' },
  { id:'contacts', n:'Contatos', d:'Pessoas', u:'https://contacts.google.com/', i:'person', c:C.blue, cat:'Comunicação', k:'contacts' },
  // IA & Pesquisa
  { id:'gemini', n:'Gemini', d:'Assistente de IA', u:'https://gemini.google.com/', i:'spark', c:C.gem, cat:'IA & Pesquisa', k:'ai ia bard' },
  { id:'notebooklm', n:'NotebookLM', d:'Pesquisa com IA', u:'https://notebooklm.google.com/', i:'book', c:'#1F1F1F', cat:'IA & Pesquisa', k:'ai ia' },
  { id:'search', n:'Pesquisa', d:'Google Search', u:'https://www.google.com/', i:'search', c:C.blue, cat:'IA & Pesquisa', k:'google buscar' },
  { id:'scholar', n:'Acadêmico', d:'Scholar', u:'https://scholar.google.com/', i:'school', c:'#4D90FE', cat:'IA & Pesquisa', k:'scholar artigos' },
  { id:'translate', n:'Tradutor', d:'Translate', u:'https://translate.google.com/', i:'translate', c:C.blue, cat:'IA & Pesquisa', k:'translate idioma' },
  { id:'news', n:'Notícias', d:'News', u:'https://news.google.com/', i:'news', c:C.gray, cat:'IA & Pesquisa', k:'news' },
  { id:'finance', n:'Finanças', d:'Mercado', u:'https://www.google.com/finance/', i:'dollar', c:C.green, cat:'IA & Pesquisa', k:'finance bolsa ações' },
  // Mídia
  { id:'youtube', n:'YouTube', d:'Vídeos', u:'https://www.youtube.com/', i:'play', c:C.yt, cat:'Mídia & Lugares' },
  { id:'ytmusic', n:'YouTube Music', d:'Músicas', u:'https://music.youtube.com/', i:'music', c:C.yt, cat:'Mídia & Lugares', k:'musica' },
  { id:'photos', n:'Fotos', d:'Galeria', u:'https://photos.google.com/', i:'photo', c:C.orange, cat:'Mídia & Lugares', k:'photos' },
  { id:'maps', n:'Maps', d:'Mapas', u:'https://maps.google.com/', i:'map', c:C.green, cat:'Mídia & Lugares', k:'mapa' },
  { id:'earth', n:'Earth', d:'Globo 3D', u:'https://earth.google.com/web/', i:'globe', c:'#1A73E8', cat:'Mídia & Lugares' },
  { id:'play', n:'Play Store', d:'Apps e jogos', u:'https://play.google.com/', i:'bag', c:C.teal, cat:'Mídia & Lugares' },
  // Negócios
  { id:'analytics', n:'Analytics', d:'Métricas do site', u:'https://analytics.google.com/', i:'bars', c:C.orange, cat:'Negócios & Marketing', k:'ga4' },
  { id:'searchconsole', n:'Search Console', d:'SEO', u:'https://search.google.com/search-console', i:'chart', c:'#458CF5', cat:'Negócios & Marketing', k:'seo gsc' },
  { id:'ads', n:'Google Ads', d:'Anúncios', u:'https://ads.google.com/', i:'ad', c:C.yellow, cat:'Negócios & Marketing', k:'adwords' },
  { id:'looker', n:'Looker Studio', d:'Relatórios', u:'https://lookerstudio.google.com/', i:'pie', c:'#4285F4', cat:'Negócios & Marketing', k:'data studio dashboard' },
  { id:'business', n:'Perfil da Empresa', d:'Business Profile', u:'https://business.google.com/', i:'site', c:C.blue, cat:'Negócios & Marketing', k:'meu negocio' },
  { id:'trends', n:'Trends', d:'Tendências', u:'https://trends.google.com/', i:'chart', c:'#1A73E8', cat:'Negócios & Marketing', k:'tendencias' },
  { id:'classroom', n:'Classroom', d:'Sala de aula', u:'https://classroom.google.com/', i:'school', c:'#1E8E3E', cat:'Negócios & Marketing' },
  // Conta
  { id:'account', n:'Minha Conta', d:'Configurações', u:'https://myaccount.google.com/', i:'shield', c:C.blue, cat:'Conta', k:'account senha segurança' },
  { id:'one', n:'Google One', d:'Armazenamento', u:'https://one.google.com/', i:'cloud', c:C.blue, cat:'Conta', k:'storage' },
  { id:'wallet', n:'Wallet', d:'Pagamentos', u:'https://wallet.google.com/', i:'wallet', c:C.gray, cat:'Conta', k:'pay pagamento' },
  { id:'passwords', n:'Senhas', d:'Gerenciador', u:'https://passwords.google.com/', i:'gear', c:C.gray, cat:'Conta', k:'passwords' },
];

const QUICK = [
  { n:'Documento', u:'https://docs.new', c:C.docs, l:'D' },
  { n:'Planilha', u:'https://sheets.new', c:C.sheets, l:'P' },
  { n:'Apresentação', u:'https://slides.new', c:C.slides, l:'A' },
  { n:'Formulário', u:'https://forms.new', c:C.forms, l:'F' },
  { n:'Evento', u:'https://cal.new', c:C.blue, l:'+' },
  { n:'Reunião', u:'https://meet.new', c:C.teal, l:'▶' },
  { n:'Nota', u:'https://keep.new', c:C.yellow, l:'✎' },
  { n:'E-mail', u:'https://mail.google.com/mail/?view=cm', c:C.red, l:'@' },
];

const CATEGORIES = ["Trabalho", "Comunicação", "IA & Pesquisa", "Mídia & Lugares", "Negócios & Marketing", "Conta"];

const api = { APPS, QUICK, CATEGORIES, GLYPHS, COLORS: C };
root.GH = root.GH || {}; root.GH.catalog = api;
if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
