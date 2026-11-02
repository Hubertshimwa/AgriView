import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, ArrowRight, ArrowUpRight, BarChart3, BookOpen,
  Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, ExternalLink,
  FileDown, Filter, Globe2, Leaf, Menu, Moon, Search, ShieldCheck, Sparkles,
  Sun, X,
} from 'lucide-react';
import {
  cropGroups, crops, fieldNotes, getCropData, news,
  photoCredits, practiceComparison2026, production2025B, seasonB2026, sources,
} from './data.js';
import { CountUp, Reveal } from './components/InteractionPrimitives.jsx';

const categories = [
  { label: 'Staples' },
  { label: 'Roots & tubers' },
  { label: 'Legumes & oilseeds' },
  { label: 'Export crops' },
  { label: 'Horticulture' },
];

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatDecimal(value) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value);
}

function SourceTag({ children = 'Official source' }) {
  return <span className="source-tag"><span className="source-dot" />{children}</span>;
}

function Eyebrow({ children }) {
  return <div className="eyebrow"><span>{children}</span></div>;
}

function SectionTitle({ eyebrow, title, text, action }) {
  return (
    <div className="section-title-row">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2>{title}</h2>
        {text && <p className="section-intro">{text}</p>}
      </div>
      {action}
    </div>
  );
}

function Photo({ src, alt, className = '', loading = 'lazy' }) {
  if (!src) return <div className={`crop-art ${className}`} aria-hidden="true"><span /><span /><span /><i /></div>;
  return <img className={className} src={src} alt={alt || ''} loading={loading} fetchPriority={loading === 'eager' ? 'high' : 'auto'} decoding="async" />;
}

function AccordionGallery({ items, openIndex, onToggle, className = '' }) {
  return <div className={`accordion-gallery ${className}`.trim()}>
    {items.map((item, index) => <article key={item.id || item.file || item.src} className={`gallery-panel ${openIndex === index ? 'gallery-open' : ''}`}>
      <button type="button" onClick={() => onToggle(openIndex === index ? -1 : index)} aria-expanded={openIndex === index} aria-label={`${openIndex === index ? 'Collapse' : 'Expand'} ${item.title} photo`} className="gallery-toggle">
        <Photo src={item.file || item.src} alt={item.description || item.alt} loading={className.includes('hero-') && index === 0 ? 'eager' : 'lazy'} />
        <span className="gallery-overlay" />
        <span className="gallery-panel-label"><small>{item.crop || 'Rwanda agriculture'}</small><b>{item.title}</b></span>
        <span className="gallery-open-icon">{openIndex === index ? <X size={18} /> : <ArrowUpRight size={18} />}</span>
      </button>
      {openIndex === index && <div className="gallery-caption">
        <p>{item.description || item.caption}</p>
        <span className="gallery-credit">Photo: {item.sourceUrl ? <a href={item.sourceUrl} target="_blank" rel="noreferrer">{item.credit}</a> : item.credit}{item.licenseUrl && <> · <a href={item.licenseUrl} target="_blank" rel="noreferrer">{item.license}</a></>}</span>
      </div>}
    </article>)}
  </div>;
}

function CropCard({ crop, Link }) {
  const info = getCropData(crop);
  const dataLabel = info ? '2025 Season B' : crop.export ? '2025 exports' : crop.sector ? 'Sector figures' : 'No Season B figure';
  return (
    <Link to={`/crops/${crop.slug}`} className="crop-card spotlight-card" onPointerMove={(event) => {
      if (event.pointerType !== 'mouse') return;
      const bounds = event.currentTarget.getBoundingClientRect();
      event.currentTarget.style.setProperty('--spotlight-x', `${event.clientX - bounds.left}px`);
      event.currentTarget.style.setProperty('--spotlight-y', `${event.clientY - bounds.top}px`);
    }}>
      <div className="crop-card-image">
        <Photo src={crop.image} alt={crop.imageAlt} />
        <span className="crop-group-pill">{crop.group}</span>
        <span className="crop-card-arrow"><ArrowUpRight size={18} /></span>
      </div>
      <div className="crop-card-copy">
        <div className="crop-title-line"><h3>{crop.name}</h3><ChevronRight size={16} /></div>
        <p>{crop.summary}</p>
        <div className="crop-card-meta">
          <span className={`availability ${info ? 'available' : ''}`}><span />{dataLabel}</span>
          <span>{crop.season === 'Perennial' ? 'Perennial' : `Seasons ${crop.season}`}</span>
        </div>
      </div>
    </Link>
  );
}

function Ring({ value, color = 'var(--blue)', label }) {
  return (
    <div className="ring" style={{ '--ring-value': `${value}%`, '--ring-color': color }} aria-label={`${label}: ${value}%`} role="img">
      <span>{value}<small>%</small></span>
    </div>
  );
}

function MetricCard({ label, value, unit, context, icon: Icon, accent = 'green', source }) {
  return (
    <article className={`metric-card metric-${accent}`}>
      <div className="metric-head"><span>{label}</span>{Icon && <Icon size={17} strokeWidth={1.7} />}</div>
      <strong><span className="sr-only">{value} {unit}</span><CountUp value={value} /><small aria-hidden="true">{unit}</small></strong>
      <p>{context}</p>
      {source && <span className="metric-source">{source}</span>}
    </article>
  );
}

function DataStamp({ source, text = 'Source' }) {
  return (
    <div className="data-stamp">
      <ShieldCheck size={16} />
      <span>{text}</span>
      {source && <a href={source.url} target="_blank" rel="noreferrer">{source.organization}<ExternalLink size={13} /></a>}
    </div>
  );
}

function App() {
  const [path, setPath] = useState(() => window.location.pathname || '/');
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('agri-view-theme') === 'dark' ? 'dark' : 'light'; }
    catch { return 'light'; }
  });
  const [cropMenuOpen, setCropMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCropsOpen, setMobileCropsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const normalizedPath = path.replace(/\/+$/, '') || '/';

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#111412' : '#f4f3ef');
    try { localStorage.setItem('agri-view-theme', theme); } catch {}
  }, [theme]);

  useEffect(() => {
    const update = () => setPath(window.location.pathname || '/');
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setCropMenuOpen(false);
        setMobileMenuOpen(false);
        setMobileCropsOpen(false);
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    setCropMenuOpen(false);
    setMobileMenuOpen(false);
    setMobileCropsOpen(false);
    setSearchOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [normalizedPath]);

  useEffect(() => {
    const crop = crops.find((item) => normalizedPath === `/crops/${item.slug}`);
    const pageName = crop?.name || ({ '/': 'Home', '/explore': 'Explore data', '/insights': 'Insights', '/crops': 'Crops', '/guides': 'Tips & guides', '/news': 'News', '/sources': 'Sources and method' }[normalizedPath] || 'Agri View');
    document.title = `${pageName} | Agri View Rwanda`;
  }, [normalizedPath]);

  const navigate = (to) => {
    if (!to) return;
    window.history.pushState({}, '', to);
    setPath(to);
    setCropMenuOpen(false);
    setMobileMenuOpen(false);
    setSearchOpen(false);
  };

  const Link = ({ to, children, className, onClick, ...props }) => (
    <a
      href={to}
      className={className}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (to?.startsWith('/')) { event.preventDefault(); navigate(to); }
      }}
      {...props}
    >{children}</a>
  );

  const selectedCrop = crops.find((item) => normalizedPath === `/crops/${item.slug}`);

  let page;
  if (normalizedPath === '/' || normalizedPath === '/home') page = <HomePage Link={Link} navigate={navigate} />;
  else if (normalizedPath === '/explore') page = <ExplorePage Link={Link} />;
  else if (normalizedPath === '/crops') page = <CropsPage Link={Link} />;
  else if (selectedCrop) page = <CropPage crop={selectedCrop} Link={Link} />;
  else if (normalizedPath === '/insights') page = <InsightsPage Link={Link} />;
  else if (normalizedPath === '/guides') page = <GuidesPage Link={Link} />;
  else if (normalizedPath === '/news') page = <NewsPage Link={Link} />;
  else if (normalizedPath === '/sources') page = <SourcesPage Link={Link} />;
  else page = <NotFound Link={Link} />;

  const filteredSearch = crops.filter((crop) => `${crop.name} ${crop.group} ${crop.summary}`.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 6);

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <div className="nav-wrap">
           <Link to="/" className="brand" aria-label="Agri View home">
            <img
            src="/images/agri-view-logo.png"
            alt="Agri View Rwanda"
            className="brand-logo"
            />
          </Link>
          <nav className="desktop-nav" aria-label="Main navigation">
            <Link to="/explore" aria-current={normalizedPath === '/explore' ? 'page' : undefined} className={normalizedPath === '/explore' ? 'nav-link active' : 'nav-link'}>Explore</Link>
            <div className="nav-dropdown-wrap">
              <button className={normalizedPath.startsWith('/crops') ? 'nav-link active' : 'nav-link'} type="button" aria-current={normalizedPath.startsWith('/crops') ? 'page' : undefined} aria-expanded={cropMenuOpen} aria-haspopup="true" onClick={() => setCropMenuOpen((open) => !open)}>
                Crops <ChevronDown size={14} className={cropMenuOpen ? 'rotate' : ''} />
              </button>
              {cropMenuOpen && <div className="mega-menu">
                <div className="mega-intro"><Eyebrow>Crop directory</Eyebrow><h3>crop stories</h3><p>Browse by crop, Across years where data and statistics are clearly showed.</p><Link to="/crops" className="text-link">All crops <ArrowRight size={15} /></Link></div>
                <div className="mega-groups">{categories.map((group) => <div key={group.label} className="mega-group"><b>{group.label}</b><div className="mega-crop-links">{crops.filter((crop) => crop.group === group.label).map((crop) => <Link key={crop.slug} to={`/crops/${crop.slug}`}>{crop.name}</Link>)}</div></div>)}</div>
              </div>}
            </div>
            <Link to="/insights" aria-current={normalizedPath === '/insights' ? 'page' : undefined} className={normalizedPath === '/insights' ? 'nav-link active' : 'nav-link'}>Insights</Link>
            <Link to="/guides" aria-current={normalizedPath === '/guides' ? 'page' : undefined} className={normalizedPath === '/guides' ? 'nav-link active' : 'nav-link'}>Tips & guides</Link>
            <Link to="/news" aria-current={normalizedPath === '/news' ? 'page' : undefined} className={normalizedPath === '/news' ? 'nav-link active' : 'nav-link'}>News</Link>
            <Link to="/sources" aria-current={normalizedPath === '/sources' ? 'page' : undefined} className={normalizedPath === '/sources' ? 'nav-link active' : 'nav-link'}>Sources</Link>
          </nav>
          <div className="nav-tools">
            <button className="tool-button" type="button" aria-label="Search crops" onClick={() => setSearchOpen(true)}><Search size={17} /></button>
            <button className="tool-button theme-button" type="button" aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'} onClick={() => setTheme((current) => current === 'light' ? 'dark' : 'light')}>
              {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
            </button>
            <button className="mobile-menu-button" type="button" aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)}>{mobileMenuOpen ? <X /> : <Menu />}</button>
          </div>
        </div>
        {mobileMenuOpen && <nav className="mobile-nav" aria-label="Mobile navigation">
          <Link to="/explore" aria-current={normalizedPath === '/explore' ? 'page' : undefined} className={`mobile-nav-link ${normalizedPath === '/explore' ? 'active' : ''}`}>Explore <ArrowRight size={16} /></Link>
          <button type="button" className={`mobile-nav-link ${normalizedPath.startsWith('/crops') ? 'active' : ''}`} aria-current={normalizedPath.startsWith('/crops') ? 'page' : undefined} aria-expanded={mobileCropsOpen} onClick={() => setMobileCropsOpen((open) => !open)}>Crops <ChevronDown size={16} className={mobileCropsOpen ? 'rotate' : ''} /></button>
          {mobileCropsOpen && <div className="mobile-crop-grid"><Link to="/crops" aria-current={normalizedPath === '/crops' ? 'page' : undefined}>All crops</Link>{crops.map((crop) => <Link to={`/crops/${crop.slug}`} aria-current={normalizedPath === `/crops/${crop.slug}` ? 'page' : undefined} key={crop.slug}>{crop.name}</Link>)}</div>}
          <Link to="/insights" aria-current={normalizedPath === '/insights' ? 'page' : undefined} className={`mobile-nav-link ${normalizedPath === '/insights' ? 'active' : ''}`}>Insights <ArrowRight size={16} /></Link>
          <Link to="/guides" aria-current={normalizedPath === '/guides' ? 'page' : undefined} className={`mobile-nav-link ${normalizedPath === '/guides' ? 'active' : ''}`}>Tips & guides <ArrowRight size={16} /></Link>
          <Link to="/news" aria-current={normalizedPath === '/news' ? 'page' : undefined} className={`mobile-nav-link ${normalizedPath === '/news' ? 'active' : ''}`}>News <ArrowRight size={16} /></Link>
          <Link to="/sources" aria-current={normalizedPath === '/sources' ? 'page' : undefined} className={`mobile-nav-link ${normalizedPath === '/sources' ? 'active' : ''}`}>Sources <ArrowRight size={16} /></Link>
        </nav>}
      </header>

      <main id="main-content">{page}</main>
      <Footer Link={Link} />

      {searchOpen && <div className="search-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSearchOpen(false); }}>
        <section className="search-dialog" role="dialog" aria-modal="true" aria-labelledby="search-title">
          <div className="search-dialog-head"><div><Eyebrow>Find a crop</Eyebrow><h2 id="search-title">Search Agri View</h2></div><button className="tool-button" type="button" aria-label="Close search" onClick={() => setSearchOpen(false)}><X size={19} /></button></div>
          <label className="search-input-wrap"><Search size={19} /><input autoFocus type="search" placeholder="Try coffee, cassava, maize..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} /></label>
          <div className="search-results" aria-live="polite">{filteredSearch.length ? filteredSearch.map((crop) => <Link key={crop.slug} to={`/crops/${crop.slug}`} className="search-result"><span className="search-result-mark"><Leaf size={17} /></span><span><b>{crop.name}</b><small>{crop.group}</small></span><ArrowUpRight size={16} /></Link>) : <p className="empty-state">No crop matches. Try a different name.</p>}</div>
          <div className="search-dialog-foot"><span>ESC to close</span><Link to="/crops" className="text-link">Browse all crops <ArrowRight size={14} /></Link></div>
        </section>
      </div>}
    </div>
  );
}

function HomePage({ Link }) {
  const featured = ['maize', 'coffee', 'cassava', 'tea'].map((slug) => crops.find((crop) => crop.slug === slug));
  const latestSource = sources.find((source) => source.id === 'nisr-sas-2026b');
  const heroGalleryItems = ['cassava-user', 'maize-user', 'coffee-user-harvest', 'tea-user'].map((id) => photoCredits.find((photo) => photo.id === id));
  const [activeHeroPhoto, setActiveHeroPhoto] = useState(0);
  return <>
    <section className="hero-section page-gutter">
      <Reveal className="hero-copy">
        <Eyebrow><span className="eyebrow-line" /> Rwandan agriculture, in view</Eyebrow>
        <h1>See the season statistics.<br /><em>Understand clearly</em> the harvest.</h1>
        <p className="hero-lede">Reliable official agricultural statistics and practical knowledge for the people who grow and all stakeholders, study and shape Rwanda's crop system.</p>
        <div className="hero-actions"><Link to="/explore" className="button button-primary">Explore the data <ArrowRight size={17} /></Link><Link to="/crops" className="button button-quiet">Browse crops <ArrowUpRight size={16} /></Link></div>
        <div className="hero-proof"><div className="proof-avatars"><span>N</span><span>M</span><span>R</span></div><span>from national sources<br /><b>NISR · MINAGRI · RAB · NAEB</b></span></div>
      </Reveal>
      <Reveal className="hero-visual hero-gallery-wrap" delay={100}><AccordionGallery items={heroGalleryItems} openIndex={activeHeroPhoto} onToggle={setActiveHeroPhoto} className="hero-accordion-gallery" /></Reveal>
    </section>

    <section className="source-ribbon page-gutter"><span className="ribbon-label">Coverage</span><div><span>Land & seasons</span><i /> <span>Crop production</span><i /> <span>Farmer practices</span><i /> <span>Markets & exports</span></div><Link to="/sources" className="ribbon-link">Sources and method <ArrowUpRight size={15} /></Link></section>

    <section className="section-block page-gutter">
      <Reveal>
      <SectionTitle eyebrow="National indicators" title="Rwandan agriculture in numbers." text="Season B 2026 results from the national agricultural survey." action={<Link to="/explore" className="text-link">Open data explorer <ArrowRight size={15} /></Link>} />
      <div className="metric-grid metric-grid-four">
        <MetricCard label="Agricultural land" value="1.414" unit="M ha" context="Approximately 59% of the country's total land area." icon={Leaf} accent="green" source="NISR · Season B 2026" />
        <MetricCard label="Improved seeds" value="20.9" unit="%" context="Share of farmers who used improved seeds in Season B." icon={Sparkles} accent="blue" source="NISR · Season B 2026" />
        <MetricCard label="Agroforestry" value="58" unit="%" context="Farmers reporting agroforestry practices in the season." icon={Leaf} accent="amber" source="NISR · Season B 2026" />
        <MetricCard label="Survey coverage" value="30" unit=" districts" context="1,200 segments and 505 large-scale farmers surveyed." icon={Globe2} accent="ink" source="NISR · Season B 2026" />
      </div>
      <div className="metric-foot"><DataStamp source={latestSource} text="Official national survey" /><span>Reference period: {seasonB2026.period}. Values are survey estimates.</span></div>
      </Reveal>
    </section>

    <section className="split-feature topography page-gutter">
      <div className="split-feature-copy">
        <Eyebrow>Farmer practices</Eyebrow>
        <h2>Practices<br /><em>by season.</em></h2>
        <p>Comparing practices in Season A and Season B 2026.</p>
        <Link to="/explore" className="button button-outline">Compare practices <ArrowRight size={16} /></Link>
        <div className="comparison-legend"><span><i className="legend-a" />Season A 2026</span><span><i className="legend-b" />Season B 2026</span></div>
      </div>
      <div className="practice-preview-card">
        <div className="chart-card-top"><div><span className="chart-kicker">FARMER'S PRACTICES</span><h3>Seasonal choices</h3></div><span className="chart-period">2026 · A / B</span></div>
        <div className="practice-preview-list">{practiceComparison2026.slice(0, 5).map((item) => <div className="practice-preview-row" key={item.label}><span>{item.label}</span><div className="practice-preview-bars"><i className="bar-a" style={{ width: `${item.seasonA}%` }} /><i className="bar-b" style={{ width: `${item.seasonB}%` }} /></div><b>{item.seasonB}%</b></div>)}</div>
        <div className="chart-card-bottom"><span>Share of farmers, not share of land</span><Link to="/explore" aria-label="View all practice statistics"><ArrowUpRight size={18} /></Link></div>
      </div>
    </section>

    <section className="section-block alt-section page-gutter">
      <Reveal>
      <SectionTitle eyebrow="Crop production" title="2025 Season B crop output." text="NISR production and yield figures for the reported season." action={<Link to="/explore" className="text-link">Explore the full table <ArrowRight size={15} /></Link>} />
      <ProductionChart compact Link={Link} />
      </Reveal>
    </section>

    <section className="section-block page-gutter">
      <Reveal>
      <SectionTitle eyebrow="Crop directory" title="Start with a crop." text="Follow the data, field context and source notes crop by crop." action={<Link to="/crops" className="text-link">See all 14 crops <ArrowRight size={15} /></Link>} />
      <div className="crop-feature-grid">{featured.map((crop, index) => <CropCard key={crop.slug} crop={crop} Link={Link} />)}</div>
      </Reveal>
    </section>

    <section className="news-guide-band page-gutter">
      <div className="news-band-panel"><div className="band-heading"><div><Eyebrow>Official updates</Eyebrow><h2>Recent agricultural updates.</h2></div><Link to="/news" className="round-arrow" aria-label="See all news"><ArrowUpRight size={19} /></Link></div>
        <div className="home-news-list">{news.slice(0, 2).map((item) => <article className="home-news-item" key={item.title}><div className="home-news-date"><span>{item.date.slice(0, 2)}</span><small>{item.date.slice(3)}</small></div><div><span className="news-category">{item.category} · {item.source}</span><h3>{item.title}</h3><p>{item.summary}</p></div><a href={item.url} target="_blank" rel="noreferrer" className="news-external" aria-label={`Open original source: ${item.title}`}><ArrowUpRight size={17} /></a></article>)}</div>
      </div>
      <div className="guide-band-panel"><div className="guide-band-graphic"><div className="guide-orbit orbit-one"/><div className="guide-orbit orbit-two"/><div className="guide-orbit orbit-three"/><span><Leaf size={30} /></span></div><Eyebrow>Field guidance</Eyebrow><h2>Tips for<br />the season.</h2><p>Practical notes on planning, record-keeping and safe decisions, with links to official guidance.</p><Link to="/guides" className="button button-light">Browse tips & guides <ArrowRight size={16} /></Link></div>
    </section>

    <section className="closing-cta topography page-gutter"><div className="cta-contour" aria-hidden="true"/><Eyebrow>Agri View</Eyebrow><h2>Find data<br />behind each agricultural story.</h2><p>Explore national statistics and crop profiles, linked to original sources.</p><div className="hero-actions"><Link to="/explore" className="button button-light">Open data explorer <ArrowRight size={16} /></Link><Link to="/sources" className="cta-source-link">View sources <ArrowUpRight size={15} /></Link></div><div className="cta-mark" aria-hidden="true">AV</div></section>
  </>;
}

function PageIntro({ eyebrow, title, text, note, action }) {
  return <Reveal as="section" className="page-intro page-gutter"><div><Eyebrow>{eyebrow}</Eyebrow><h1>{title}</h1><p>{text}</p>{note && <div className="page-intro-note"><CircleHelp size={15} />{note}</div>}</div>{action}</Reveal>;
}

function ExplorePage({ Link }) {
  const [tab, setTab] = useState('practices');
  const [showTable, setShowTable] = useState(false);
  const [cropLimit, setCropLimit] = useState(8);
  const rows = production2025B.slice(0, cropLimit);
  const downloadCsv = () => {
    const csvRows = tab === 'practices'
      ? [
          ['Indicator', 'Season A 2026 (%)', 'Season B 2026 (%)', 'Unit', 'Source'],
          ...practiceComparison2026.map((row) => [row.label, row.seasonA, row.seasonB, 'Percent of farmers', sources[0].name]),
        ]
      : [
          ['Crop or category', 'Production (metric tonnes)', 'Yield (tonnes per hectare)', 'Season', 'Source'],
          ...production2025B.map((row) => [row.crop, row.production, row.yield, 'Season B 2025', sources[2].name]),
        ];
    const quote = (cell) => `"${String(cell).replaceAll('"', '""')}"`;
    const csv = csvRows.map((row) => row.map(quote).join(',')).join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = tab === 'practices' ? 'agriview-practices-2026.csv' : 'agriview-crop-production-2025-season-b.csv';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <>
    <PageIntro eyebrow="Explore the data" title={<>Numbers with<br /><em>their context.</em></>} text="Browse national indicators and crop output with the period, unit and original source alongside each figure." />
    <section className="explore-summary page-gutter"><div className="explore-summary-info"><span className="summary-index">NATIONAL STATISTICS</span><h2>Seasonal agriculture<br />survey, 2026.</h2><p>Season A and B results from the National Institute of Statistics of Rwanda.</p><a className="text-link" href={sources[0].url} target="_blank" rel="noreferrer">Open NISR release <ExternalLink size={14} /></a></div><div className="explore-summary-cards"><div><span>LAND USED FOR AGRICULTURE</span><b>1.414 <small>million ha</small></b><p>Season B 2026 · about 59% of total land area</p></div><div><span>FARMERS SURVEYED</span><b>1,200 <small>segments</small></b><p>All 30 districts · 505 large-scale farmers</p></div></div></section>
    <section className="section-block page-gutter">
      <Reveal>
      <div className="dashboard-head"><div><Eyebrow>Data explorer</Eyebrow><h2>Read across a season.</h2><p className="section-intro">Compare farmer practices or explore reported crop output.</p></div><div className="dashboard-tabs" role="tablist" aria-label="Choose data view"><button role="tab" aria-selected={tab === 'practices'} className={tab === 'practices' ? 'selected' : ''} onClick={() => setTab('practices')}>Farmer practices <span>2026</span></button><button role="tab" aria-selected={tab === 'production'} className={tab === 'production' ? 'selected' : ''} onClick={() => setTab('production')}>Crop output <span>2025 B</span></button></div></div>
      {tab === 'practices' ? <PracticeChart /> : <ProductionChart Link={Link} />}
      <div className="data-tools"><div className="data-tool-actions"><button type="button" className="text-link" onClick={() => setShowTable((shown) => !shown)}><BarChart3 size={15} />{showTable ? 'Hide accessible table' : 'Show data table'}</button><button type="button" className="text-link" onClick={downloadCsv}><FileDown size={15} />Download CSV</button></div>{tab === 'practices' ? <span><span className="legend-dot legend-a" />Season A 2026 <span className="legend-dot legend-b" />Season B 2026</span> : <span><span className="legend-dot legend-b" />Season B 2025 · NISR</span>}</div>
      {showTable && <AccessibleDataTable tab={tab} />}
      <div className="method-callout"><ShieldCheck size={17} /><div><b>How to read this</b><p>{tab === 'practices' ? 'Practice indicators are shares of farmers. The two observations are from separate 2026 agricultural seasons.' : 'Production is measured in metric tonnes and yield in tonnes per hectare for Season B 2025. These figures should not be read as 2026 output.'}</p></div><a href={tab === 'practices' ? sources[0].url : sources[2].url} target="_blank" rel="noreferrer" className="text-link">Source details <ExternalLink size={14} /></a></div>
      </Reveal>
    </section>
    <section className="section-block alt-section page-gutter"><SectionTitle eyebrow="Production table" title="Season B 2025, crop by crop." text="Ranked by NISR-reported production. Crop pages include source links and additional context." /><div className="production-full"><ProductionRows rows={rows} max={production2025B[0].production} Link={Link} /></div><button className="button button-quiet load-more" onClick={() => setCropLimit((current) => current === production2025B.length ? 8 : production2025B.length)}>{cropLimit === production2025B.length ? 'Show fewer crops' : 'Show all 11 categories'} <ChevronDown size={15} className={cropLimit > 8 ? 'rotate' : ''} /></button></section>
  </>;
}

function PracticeChart() {
  return <div className="data-chart-card">
    <div className="data-chart-heading"><div><span className="chart-kicker">FARMER PRACTICES · SHARE OF FARMERS</span><h3>Use of selected inputs and practices</h3></div><span className="chart-year-pill">2026 · National</span></div>
    <div className="practice-chart-grid">{practiceComparison2026.map((row, index) => <div className="practice-chart-row" key={row.label}>
      <div className="practice-chart-label"><span className="practice-chart-index">{String(index + 1).padStart(2, '0')}</span><b>{row.label}</b></div>
      <div className="practice-bars"><div className="season-bar-line"><span className="bar-season-label">A</span><div className="bar-track"><span className="bar-fill fill-a" style={{ width: `${row.seasonA}%` }} /></div><strong>{row.seasonA}%</strong></div><div className="season-bar-line"><span className="bar-season-label">B</span><div className="bar-track"><span className="bar-fill fill-b" style={{ width: `${row.seasonB}%` }} /></div><strong>{row.seasonB}%</strong></div></div>
    </div>)}</div>
    <div className="chart-footnote"><span>Season A: Sep 2025-Feb 2026</span><span>Season B: Mar-Jun 2026</span><span>Source: NISR Seasonal Agricultural Survey</span></div>
  </div>;
}

function ProductionRows({ rows = production2025B.slice(0, 7), max = production2025B[0].production, Link }) {
  return <div className="production-rows">{rows.map((row, index) => <div className="production-row" key={row.slug}>
    <span className="production-row-no">{String(index + 1).padStart(2, '0')}</span><Link to={`/crops/${row.slug}`} className="production-name">{row.crop}<ArrowUpRight size={13} /></Link>
    <div className="production-track"><span style={{ width: `${Math.max(2, row.production / max * 100)}%` }} /></div>
    <strong>{formatNumber(row.production)} <small>t</small></strong><span className="production-yield">{row.yield} t/ha</span>
  </div>)}</div>;
}

function ProductionChart({ compact = false, Link }) {
  const rows = compact ? production2025B.slice(0, 6) : production2025B.slice(0, 8);
  return <div className={`production-chart-card ${compact ? 'compact' : ''}`}>
    <div className="data-chart-heading"><div><span className="chart-kicker">PRODUCTION · METRIC TONNES</span><h3>{compact ? 'Largest reported Season B outputs' : 'National crop production and yield'}</h3></div><span className="chart-year-pill season-b-pill">2025 · Season B</span></div>
    <ProductionRows rows={rows} max={production2025B[0].production} Link={Link} />
    <div className="chart-footnote"><span>Bars compare reported output within this table.</span><span>Yield is shown separately in t/h.</span><span>Source: NISR SAS 2025 Season B</span></div>
  </div>;
}

function AccessibleDataTable({ tab }) {
  if (tab === 'production') return <div className="table-scroll"><table><caption>NISR crop production and yield, 2025 Season B</caption><thead><tr><th scope="col">Crop / category</th><th scope="col">Production (metric tonnes)</th><th scope="col">Yield (tonnes/hectare)</th><th scope="col">Season</th></tr></thead><tbody>{production2025B.map((row) => <tr key={row.slug}><th scope="row">{row.crop}</th><td>{formatNumber(row.production)}</td><td>{row.yield}</td><td>2025 B</td></tr>)}</tbody></table></div>;
  return <div className="table-scroll"><table><caption>NISR farmer practices by season, 2026</caption><thead><tr><th scope="col">Indicator</th><th scope="col">Season A 2026</th><th scope="col">Season B 2026</th><th scope="col">Unit</th></tr></thead><tbody>{practiceComparison2026.map((row) => <tr key={row.label}><th scope="row">{row.label}</th><td>{row.seasonA}</td><td>{row.seasonB}</td><td>% of farmers</td></tr>)}</tbody></table></div>;
}

function CropsPage({ Link }) {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('All crops');
  const filtered = crops.filter((crop) => `${crop.name} ${crop.summary}`.toLowerCase().includes(query.toLowerCase()) && (group === 'All crops' || crop.group === group));
  return <>
    <PageIntro eyebrow="Crop directory" title={<>Every crop has<br /><em>a different story.</em></>} text="Explore Rwanda's food, export and horticulture crops, with statistics, field context and source links." />
    <section className="crop-directory page-gutter">
      <div className="crop-directory-tools"><label className="directory-search"><Search size={18} /><input type="search" placeholder="Find a crop..." value={query} onChange={(event) => setQuery(event.target.value)} /><kbd>/</kbd></label><div className="filter-buttons" aria-label="Filter crops by group"><Filter size={15} /><button type="button" aria-pressed={group === 'All crops'} onClick={() => setGroup('All crops')} className={group === 'All crops' ? 'filter-active' : ''}>All crops</button>{cropGroups.map((item) => <button type="button" key={item} aria-pressed={group === item} className={group === item ? 'filter-active' : ''} onClick={() => setGroup(item)}>{item}</button>)}</div></div>
      <div className="directory-count"><span>{filtered.length} crops</span></div>
      {filtered.length ? <Reveal className="crop-directory-grid">{filtered.map((crop) => <CropCard key={crop.slug} crop={crop} Link={Link} />)}</Reveal> : <div className="empty-state">No crop matches those filters.</div>}
    </section>
    <section className="directory-note page-gutter"><div className="note-icon"><CircleHelp size={19} /></div><div><b>About missing figures</b><p>A blank value means the selected source did not report a comparable figure for that crop.</p></div><Link to="/sources" className="text-link">Sources and method <ArrowRight size={14} /></Link></section>
  </>;
}

function CropPage({ crop, Link }) {
  const data = getCropData(crop);
  const coffeeSource = sources.find((source) => source.id === 'naeb-coffee-2025');
  const source = crop.export ? coffeeSource : crop.sector ? sources.find((item) => item.id === crop.sector.sourceId) : sources.find((item) => item.id === 'nisr-sas-2025b');
  const related = crops.filter((item) => item.group === crop.group && item.slug !== crop.slug).slice(0, 3);
  const galleryItems = (crop.gallery || []).map((id) => photoCredits.find((photo) => photo.id === id)).filter(Boolean);
  const [openGallery, setOpenGallery] = useState(0);
  return <>
    <div className="crop-breadcrumb page-gutter"><Link to="/crops"><ArrowLeft size={15} /> All crops</Link><span>/</span><span>{crop.group}</span><span>/</span><b>{crop.name}</b></div>
    <section className="crop-hero page-gutter">
      <div className="crop-hero-copy"><Eyebrow>{crop.group}</Eyebrow><h1>{crop.name}<span className="crop-title-period">.</span></h1><p>{crop.summary}</p><div className="crop-hero-tags"><span><Leaf size={15} /> {crop.season === 'Perennial' ? 'Perennial crop' : `Season ${crop.season}`}</span>{data ? <span><Check size={15} /> 2025 Season B data</span> : crop.export ? <span><Check size={15} /> 2025 export data</span> : crop.sector ? <span><Check size={15} /> Sector data</span> : <span><CircleHelp size={15} /> No Season B figure</span>}</div><Link to="/guides" className="text-link">Read practical field notes <ArrowRight size={15} /></Link></div>
      <div className="crop-hero-visual"><div className="crop-hero-photo"><Photo src={crop.image} alt={crop.imageAlt} loading="eager" /></div>{crop.imageCaption && <small className="crop-photo-caption">{crop.imageCaption}</small>}</div>
    </section>
    <section className="crop-stat-section page-gutter">
      <div className="crop-stat-heading"><div><Eyebrow>Statistics</Eyebrow><h2>{data ? 'Season B 2025 crop statistics.' : crop.export ? 'Coffee exports in 2025.' : crop.sector ? 'Tea sector data.' : 'Data availability.'}</h2></div><span>{data ? 'NISR · 2025 Season B' : crop.export ? 'NAEB · Calendar year 2025' : crop.sector ? 'NAEB · 2023/24–June 2024' : 'No Season B 2025 figure reported'}</span></div>
      {data ? <div className="crop-stat-grid"><MetricCard label="Production" value={formatNumber(data.production)} unit="t" context="National crop production reported by NISR." accent="green" source="Season B 2025" /><MetricCard label="Yield" value={data.yield} unit="t/ha" context="Reported tonnes per harvested hectare." accent="blue" source="Season B 2025" /><div className="crop-data-note"><span className="note-index">2025 B</span><h3>Season B 2025</h3><p>Compare with the same crop, unit and season.</p><a href={sources[2].url} target="_blank" rel="noreferrer" className="text-link">NISR source <ExternalLink size={14} /></a></div></div> : crop.export ? <div className="crop-stat-grid"><MetricCard label="Green coffee exports" value={formatNumber(crop.export.volume)} unit="t" context="Unroasted green coffee exported in calendar year 2025." accent="green" source="Export volume · NAEB" /><MetricCard label="Export revenue" value="$148.6" unit="M+" context="NAEB reported revenue above US$148.6 million." accent="amber" source="Export revenue · NAEB" /><div className="crop-data-note"><span className="note-index">EXPORT DATA</span><h3>Coffee exports</h3><p>These figures describe exports, not farm production.</p><a href={coffeeSource.url} target="_blank" rel="noreferrer" className="text-link">NAEB source <ExternalLink size={14} /></a></div></div> : crop.sector ? <div className="crop-stat-grid"><MetricCard label="Made tea production" value={formatNumber(crop.sector.madeTea)} unit="t" context={`NAEB reports this volume ${crop.sector.productionPeriod}.`} accent="green" source="Made tea · NAEB" /><MetricCard label="Tea export sales" value="$114.8" unit="M" context={`Revenue from ${formatDecimal(crop.sector.exportedMadeTea)} tonnes of made tea in ${crop.sector.exportPeriod}.`} accent="amber" source="Exports · NAEB" /><div className="crop-data-note"><span className="note-index">NAEB DATA</span><h3>Two reporting periods</h3><p>Made tea production runs through June 2024; export sales are for 2023/24.</p><a href={source.url} target="_blank" rel="noreferrer" className="text-link">NAEB source <ExternalLink size={14} /></a></div></div> : <div className="no-data-panel"><span className="no-data-mark"><CircleHelp size={20} /></span><div><b>No comparable Season B 2025 figure</b><p>The selected NISR release are not in this table.</p></div><a href={sources[2].url} target="_blank" rel="noreferrer" className="text-link">Open the NISR release <ExternalLink size={14} /></a></div>}
    </section>
    <section className="crop-context-grid page-gutter">
      <div className="context-panel"><Eyebrow>Field context</Eyebrow><h2>Questions for<br />the next season.</h2><p>Discuss varieties, planting windows and crop protection with a local extension worker.</p><ul className="context-list"><li>Which variety suits this district and season?</li><li>What planting window and crop protection guidance does RAB recommend?</li><li>How will harvest quality, storage and buyer requirements be recorded?</li></ul><a href="https://www.rab.gov.rw/rw/agriculture-development/crop-innovation-tech-transfer" target="_blank" rel="noreferrer" className="text-link">RAB crop extension services <ExternalLink size={14} /></a></div>
    </section>
    {galleryItems.length > 0 && <section className="section-block crop-gallery-section page-gutter"><SectionTitle eyebrow="Photos" title={`${crop.name} in the field and at harvest`} /><AccordionGallery items={galleryItems} openIndex={openGallery} onToggle={setOpenGallery} /></section>}
    <section className="crop-footer-grid page-gutter"><div className="crop-source-panel"><Eyebrow>Source</Eyebrow><h2>Read the<br />publication.</h2><p>{source?.name || 'NISR Seasonal Agricultural Survey - Season B, 2025'}</p><div className="crop-source-meta"><span>{source?.organization || 'NISR'}</span><span>{source?.period || 'March-June 2025'}</span></div><a href={source?.url || sources[2].url} target="_blank" rel="noreferrer" className="button button-outline">Open original source <ExternalLink size={15} /></a></div><div className="related-crops"><Eyebrow>Keep exploring</Eyebrow><h2>Related crops</h2>{related.length ? related.map((item) => <Link key={item.slug} to={`/crops/${item.slug}`} className="related-crop-link"><span>{item.name}<small>{item.group}</small></span><ArrowUpRight size={17} /></Link>) : crops.filter((item) => item.slug !== crop.slug).slice(0, 3).map((item) => <Link key={item.slug} to={`/crops/${item.slug}`} className="related-crop-link"><span>{item.name}<small>{item.group}</small></span><ArrowUpRight size={17} /></Link>)}</div></section>
  </>;
}

function InsightsPage({ Link }) {
  return <>
    <PageIntro eyebrow="Insights" title={<>What the data<br /><em>can tell us.</em></>} text="Source-led reads that explain agricultural statistics and how to interpret them." />
    <section className="insight-feature page-gutter"><div className="insight-cover"><div className="insight-cover-top"><span>LAND USE</span><span>2026</span></div><div className="insight-cover-chart"><div className="insight-donut"><span>59<small>%</small></span></div><div className="insight-bars"><i /><i /><i /><i /><i /></div></div><div className="insight-cover-bottom"><span>Land use</span><span>Season A / Season B</span></div></div><div className="insight-feature-copy"><Eyebrow>Reading statistics</Eyebrow><h2>Why a percentage<br />needs a denominator.</h2><p>“Share of farmers”, “share of land” and “share of plots” describe different measures. Check the survey wording before comparing percentages.</p><div className="insight-reading-list"><div><b>Who was counted?</b><small>Farmers, plots or hectares?</small></div><div><b>Which reference period?</b><small>Compare like seasons.</small></div><div><b>What does it exclude?</b><small>Check the survey notes.</small></div></div><a href={sources[0].url} target="_blank" rel="noreferrer" className="text-link">Read the NISR Season B release <ExternalLink size={14} /></a></div></section>
    <section className="section-block alt-section page-gutter"><SectionTitle eyebrow="Selected reads" title="Reading the numbers." text="Explore seasonal comparisons, crop output and export statistics." /><div className="insight-grid">{[
      { tag: 'Seasonal comparison', title: 'Why 2025 crop output and 2026 farmer practices stay separate', text: 'Crop production in tonnes and farmer practices in percentages belong to different releases and units.', to: '/explore', action: 'Open the explorer' },
      { tag: 'Exports & production', title: 'Coffee exports and farm production measure different things', text: 'NAEB export statistics describe shipments and revenue; the NISR survey reports farm production.', to: '/crops/coffee', action: 'Read the coffee profile' },
      { tag: 'Data coverage', title: 'What a missing figure means', text: 'When a crop value is absent, Agri View links to the original release so readers can check its coverage.', to: '/sources', action: 'See sources and method' },
    ].map((item) => <article className="insight-card" key={item.title}><Eyebrow>{item.tag}</Eyebrow><h3>{item.title}</h3><p>{item.text}</p><Link to={item.to} className="text-link">{item.action} <ArrowRight size={14} /></Link></article>)}</div></section>
    <section className="page-gutter insight-data-footer"><DataStamp source={sources[0]} text="NISR Season B 2026" /></section>
  </>;
}

function GuidesPage({ Link }) {
  return <>
    <PageIntro eyebrow="Tips & guides" title={<>Practical notes for<br /><em>better decisions.</em></>} text="Use these planning prompts alongside district-level extension advice, current weather information and product guidance." />
    <section className="guide-intro-card page-gutter"><div className="guide-intro-mark"><BookOpen size={28} /></div><div><Eyebrow>How to use this section</Eyebrow><h2>Start with context.<br />Then check locally.</h2><p>National statistics help with comparison. Local conditions and official technical recommendations guide farm-level decisions.</p></div><div className="guide-official-links"><a href="https://www.rab.gov.rw/rw/agriculture-development/crop-innovation-tech-transfer" target="_blank" rel="noreferrer">RAB crop research & extension <ExternalLink size={14} /></a><a href="https://www.meteorwanda.gov.rw/" target="_blank" rel="noreferrer">Meteo Rwanda forecasts <ExternalLink size={14} /></a></div></section>
    <section className="section-block page-gutter"><SectionTitle eyebrow="Field notes" title="Practical steps for the season." /><div className="guide-grid">{fieldNotes.map((note) => <article className="guide-card" key={note.title}><div className="guide-card-top"><span className="guide-topic">{note.topic}</span></div><h3>{note.title}</h3><p>{note.text}</p>{note.url && <div className="guide-card-bottom"><a href={note.url} target="_blank" rel="noreferrer" aria-label={`Open ${note.label} for ${note.title}`}>{note.label}<ArrowUpRight size={14} /></a></div>}</article>)}</div></section>
    <section className="safety-panel page-gutter"><span className="safety-icon"><ShieldCheck size={19} /></span><div><b>Before using crop protection products</b><p>Follow the product label and current RAB guidance. Ask a competent local advisor when needed.</p></div><a href="https://www.rab.gov.rw/rw/agriculture-development/crop-innovation-tech-transfer" target="_blank" rel="noreferrer" className="text-link">RAB extension resources <ExternalLink size={14} /></a></section>
  </>;
}

function NewsPage() {
  const [filter, setFilter] = useState('All updates');
  const filters = ['All updates', 'Statistics', 'Policy & sector', 'Exports & markets'];
  const filtered = news.filter((item) => filter === 'All updates' || item.category === filter);
  return <>
    <PageIntro eyebrow="News" title={<>Rwanda agriculture<br /><em>news and updates.</em></>} text="Announcements and sector updates from Rwanda's agriculture agencies." />
    <section className="news-page-list page-gutter"><div className="news-filter-row"><div className="filter-buttons" aria-label="Filter news by topic">{filters.map((item) => <button type="button" key={item} aria-pressed={filter === item} className={filter === item ? 'filter-active' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div><span>{filtered.length} updates</span></div>
      {filtered.map((item) => <article className="news-story" key={item.title}><div className="story-date">{item.date}<small>{item.source}</small></div><div className="story-content"><span className="news-category">{item.category}</span><h2>{item.title}</h2><p>{item.summary}</p></div><a href={item.url} target="_blank" rel="noreferrer" className="story-open" aria-label={`Read the full announcement: ${item.title}`}><ArrowUpRight size={19} /></a></article>)}
    </section>
  </>;
}

function SourcesPage() {
  return <>
    <PageIntro eyebrow="Sources and method" title={<>Where the data<br /><em>comes from.</em></>} text="Agri View brings together Rwanda's agricultural statistics, crop information and sector updates. Figures link to their original publications." note="Agri View is independent of NISR, MINAGRI, RAB and NAEB." />
    <section className="source-method page-gutter"><div className="method-copy"><Eyebrow>Method</Eyebrow><h2>Each figure keeps<br />its context.</h2><p>We record the source, period, unit and geography for each statistic. Crop production, farmer practices and export.</p><div className="method-principles"><div><b>Releases</b><small>Survey reports and publications.</small></div><div><b>Comparable measures</b><small>Farmers, land, production and exports.</small></div><div><b>Data gaps</b><small>Unavailable figures are not zero.</small></div></div></div><div className="method-side"><div className="method-side-top"><span>DATA PERIODS</span></div><div className="method-periods"><div className="method-period"><span>2026</span><b>Farmer practices</b></div><div className="method-period"><span>2025</span><b>Crop production</b></div></div><p>National statistics, agency updates and RAB resources.</p></div></section>
    <section className="section-block alt-section page-gutter"><SectionTitle eyebrow="Source register" title="Official publications and guidance." text="Original releases and agency resources used across Agri View." /><div className="source-list">{sources.map((source) => <article className="source-list-item" key={source.id}><div className="source-list-main"><span className="source-list-type">{source.type}</span><h3>{source.name}</h3><p>{source.note}</p><div className="source-metadata"><span>{source.organization}</span><span>{source.period}</span>{source.updated && <span>Published {source.updated}</span>}</div></div><div className="source-list-links"><a href={source.url} target="_blank" rel="noreferrer" aria-label={`Open ${source.name}`}><ExternalLink size={17} /></a>{source.reportUrl && <a href={source.reportUrl} target="_blank" rel="noreferrer" aria-label="Open NISR annual report"><FileDown size={17} /></a>}</div></article>)}</div></section>
    <section className="asset-note page-gutter"><div><Eyebrow>Photos</Eyebrow><h2>Image sources and licences</h2><div className="photo-credit-list">{photoCredits.map((photo) => <article className="photo-credit-item" key={photo.id}><div><b>{photo.title}</b><small>{photo.crop} · Photo: {photo.credit}</small></div><div className="photo-credit-links">{photo.sourceUrl && <a href={photo.sourceUrl} target="_blank" rel="noreferrer">Image source</a>}{photo.licenseUrl && <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a>}</div></article>)}</div></div></section>
    <section className="corrections-panel page-gutter"><div><Eyebrow>Corrections and updates</Eyebrow><h2>Keeping the record accurate.</h2></div><p>Agri View updates statistics against the original release and retains each figure with its reference period and source.</p></section>
  </>;
}

function NotFound({ Link }) {
  return <section className="not-found page-gutter"><span>404 · PAGE NOT FOUND</span><h1>We couldn't find<br /><em>that page.</em></h1><p>Check the address, or continue to the crop directory and data explorer.</p><div className="hero-actions"><Link to="/crops" className="button button-primary">Browse crops <ArrowRight size={16} /></Link><Link to="/explore" className="button button-quiet">Explore data</Link></div></section>;
}

function Footer({ Link }) {
  return <footer className="site-footer page-gutter"><div className="footer-main"><div className="footer-brand-column"><Link to="/" className="brand" aria-label="Agri View home"><span className="brand-mark"><span /><span /><span /></span><span className="brand-word">agri<span>view</span><small>RWANDA AGRICULTURE</small></span></Link><p>Agricultural data, crops and sector updates from Rwanda.</p></div><div className="footer-links"><div><b>Explore</b><Link to="/explore">Agricultural data</Link><Link to="/crops">Crop directory</Link><Link to="/insights">Insights</Link></div><div><b>Knowledge</b><Link to="/guides">Tips & guides</Link><Link to="/news">Sector news</Link><Link to="/sources">Sources and method</Link></div><div><b>Official sources</b><a href="https://www.statistics.gov.rw/" target="_blank" rel="noreferrer">NISR <ExternalLink size={14} /></a><a href="https://www.minagri.gov.rw/" target="_blank" rel="noreferrer">MINAGRI <ExternalLink size={12} /></a><a href="https://www.rab.gov.rw/" target="_blank" rel="noreferrer">RAB <ExternalLink size={12} /></a><a href="https://www.naeb.gov.rw/" target="_blank" rel="noreferrer">NAEB <ExternalLink size={12} /></a></div></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Agri View Rwanda</span><Link to="/sources">Sources and method</Link></div></footer>;
}

export default App;
