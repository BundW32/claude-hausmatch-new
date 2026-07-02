import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchLatestIndustryBlog } from '../services/geminiService';
import { BlogArticle } from '../types';

const SectionHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="text-center mb-16">
    <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">{title}</h1>
    <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">{subtitle}</p>
  </div>
);

// Eddy die Eule — für About-Seite
const EDDY_URL = "https://cdn.jsdelivr.net/gh/BundW32/claude-hausmatch-new@main/hf_20260616_092652_b3b38af5-a913-44c1-80ef-1ac5d9adedb4.png";

const EddyOwl = ({ size = 120 }: { size?: number }) => (
  <div style={{ width: size, height: size, borderRadius: '1.5rem', overflow: 'hidden', background: '#2563FF', display: 'inline-block', flexShrink: 0 }}>
    <img src={EDDY_URL} width={size} height={size} alt="Eddy die HausMatch-Eule" style={{ display: 'block', objectFit: 'cover' }} />
  </div>
);

export const AboutPage: React.FC = () => (
  <div className="max-w-7xl mx-auto px-4 py-20">
    <SectionHeader
      title="Über HausMatch"
      subtitle="Wir revolutionieren die Art und Weise, wie Eigentümer und Hausverwaltungen zueinander finden."
    />
    <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
      <div className="space-y-6 text-slate-600">
        <p>HausMatch ist die Antwort auf die wachsende Komplexität im Immobilienmanagement. Wir glauben, dass die richtige Verwaltung der Schlüssel zu wertbeständigen Immobilien und zufriedenen Hausgemeinschaften ist.</p>
        <p>Unser Team kombiniert jahrzehntelange Erfahrung in der Immobilienwirtschaft mit modernster KI-Technologie, um den Matching-Prozess so effizient wie möglich zu gestalten.</p>
        <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
          <h4 className="font-bold text-indigo-900 mb-2">Unsere Mission</h4>
          <p className="text-indigo-800">Transparenz und Vertrauen in den oft unübersichtlichen Markt der Hausverwaltungen bringen.</p>
        </div>
      </div>
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 aspect-video rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-center gap-4">
        <EddyOwl size={120} />
        <div className="text-white text-center">
          <p className="font-black text-lg tracking-tight">Eddy — Ihr KI-Assistent 🦉</p>
          <p className="text-indigo-200 text-sm font-medium">Rund um die Uhr für Sie da</p>
        </div>
      </div>
    </div>

    <div className="bg-slate-50 rounded-[3rem] p-12 md:p-16 border border-slate-100">
      <div className="max-w-3xl">
        <h3 className="text-3xl font-black text-slate-900 mb-6 tracking-tighter">Das HausMatch Netzwerk</h3>
        <p className="text-lg text-slate-600 mb-10 leading-relaxed">
          Wir bringen Verwalter und Eigentümer in einem exklusiven Netzwerk zusammen. Tauschen Sie sich aus, vernetzen Sie sich mit Experten und finden Sie die passenden Partner für Ihre Immobilienprojekte.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link to="/network" className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-600 transition-all shadow-2xl shadow-slate-200 flex items-center gap-3">
            Netzwerk entdecken
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
          <Link to="/forum" className="bg-white text-slate-900 border border-slate-200 px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3">
            Zum Experten-Forum
          </Link>
        </div>
      </div>
    </div>
  </div>
);

export const BlogPage: React.FC = () => {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<BlogArticle | null>(null);

  useEffect(() => {
    const loadBlog = async () => {
      setLoading(true);
      const data = await fetchLatestIndustryBlog();
      setArticles(data);
      setLoading(false);
    };
    loadBlog();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      <div className="flex flex-col items-center mb-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest mb-6 shadow-xl shadow-slate-200">
           <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
           Live Update: Jeden Montag &amp; Freitag
        </div>
        <SectionHeader
          title="Verwalter-Wissen"
          subtitle="Die wichtigsten Updates zu Recht, Technik und Management – kuratiert von HausMatch KI."
        />
      </div>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-white rounded-[2.5rem] border border-slate-100 p-8 h-96">
              <div className="h-4 w-24 bg-slate-100 rounded mb-6"></div>
              <div className="h-8 w-full bg-slate-100 rounded mb-4"></div>
              <div className="h-4 w-3/4 bg-slate-100 rounded mb-8"></div>
              <div className="h-24 w-full bg-slate-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : articles.length > 0 ? (
        <div className="space-y-24">
          {/* Top Article */}
          <div className="relative group">
             <div className="absolute -inset-4 bg-indigo-50 rounded-[4rem] opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <div className="relative bg-white p-12 md:p-16 rounded-[3.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row gap-12 items-center">
                <div className="w-full md:w-1/3">
                   <div className="w-full aspect-square bg-slate-900 rounded-[3rem] flex items-center justify-center text-white relative overflow-hidden">
                      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                      <span className="text-5xl font-black italic relative z-10 text-indigo-400 uppercase tracking-tighter">Top</span>
                   </div>
                </div>
                <div className="flex-1">
                   <div className="flex items-center gap-4 mb-6">
                      <span className="bg-indigo-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">{articles[0].category}</span>
                      <span className="text-xs font-black text-slate-300 uppercase tracking-widest">{articles[0].date}</span>
                   </div>
                   <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tighter leading-tight">{articles[0].title}</h2>
                   <p className="text-xl text-slate-500 font-medium leading-relaxed mb-8">{articles[0].summary}</p>
                   <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 mb-8">
                      <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4">Seriöse Quellen &amp; Referenzen</h4>
                      <div className="flex flex-wrap gap-3">
                         {articles[0].sources?.map((s, idx) => (
                           <a key={idx} href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-slate-400 hover:text-indigo-600 underline decoration-2 underline-offset-4 flex items-center gap-1">
                             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                             {s.title}
                           </a>
                         ))}
                      </div>
                   </div>
                   <button
                    onClick={() => setSelectedArticle(articles[0])}
                    className="text-slate-900 font-black uppercase text-xs tracking-widest border-b-2 border-slate-900 pb-1 hover:text-indigo-600 hover:border-indigo-600 transition-all"
                   >
                    Vollständigen Bericht lesen
                   </button>
                </div>
             </div>
          </div>

          {/* More Articles */}
          <div className="grid md:grid-cols-2 gap-12">
            {articles.slice(1).map((post) => (
              <div key={post.id} className="bg-white rounded-[3rem] border border-slate-100 p-10 hover:shadow-2xl transition-all group flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest px-3 py-1 bg-indigo-50 rounded-full">{post.category}</span>
                  <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">{post.date}</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-indigo-600 transition-colors tracking-tight">{post.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed mb-8 flex-1">{post.summary}</p>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-6">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Quellen</h4>
                  <div className="flex flex-wrap gap-3">
                    {post.sources?.map((s, idx) => (
                      <a key={idx} href={s.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1">
                        <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        {s.title}
                      </a>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedArticle(post)}
                  className="text-slate-900 font-black uppercase text-[10px] tracking-widest border-b border-slate-900 self-start hover:text-indigo-600 hover:border-indigo-600 transition-all"
                >
                  Bericht lesen
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-slate-300 font-black uppercase tracking-[0.2em]">Keine neuen Updates verfügbar.</div>
      )}

      {/* Article Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] overflow-hidden shadow-2xl flex flex-col animate-fade-in-up">
            <div className="p-8 md:p-12 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex-1 pr-8">
                <span className="bg-indigo-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-4 inline-block">{selectedArticle.category}</span>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter leading-tight">{selectedArticle.title}</h2>
              </div>
              <button onClick={() => setSelectedArticle(null)} className="p-4 bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-slate-900 transition-colors shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
              <div className="prose prose-slate prose-lg max-w-none">
                <p className="text-xl font-bold text-slate-900 mb-8 leading-relaxed italic border-l-4 border-indigo-600 pl-6 bg-indigo-50/30 py-4 rounded-r-2xl">
                  {selectedArticle.summary}
                </p>
                <div className="text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                  {selectedArticle.fullContent}
                </div>
              </div>
              <div className="mt-12 pt-12 border-t border-slate-100">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Referenzen &amp; Weiterführende Links</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  {selectedArticle.sources?.map((s, idx) => (
                    <a key={idx} href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-300 hover:bg-white transition-all group">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{s.title}</p>
                        <p className="text-[10px] text-slate-400 font-bold truncate">{s.url}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-center">
              <button onClick={() => setSelectedArticle(null)} className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">Schließen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ContactPage: React.FC = () => {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Fehler beim Senden');
      setStatus('success');
      setForm({ firstName: '', lastName: '', email: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-20">
      <SectionHeader
        title="Kontaktieren Sie uns"
        subtitle="Wir sind für Sie da. Senden Sie uns eine Nachricht."
      />
      {status === 'success' ? (
        <div className="bg-green-50 border border-green-200 rounded-3xl p-12 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-2xl font-black text-green-900 mb-2">Nachricht gesendet!</h3>
          <p className="text-green-700 font-medium">Wir melden uns in Kürze bei Ihnen.</p>
          <button onClick={() => setStatus('idle')} className="mt-6 px-6 py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-all">Weitere Nachricht senden</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">Vorname</label>
              <input
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Franz-Josef"
                value={form.firstName}
                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Nachname</label>
              <input
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Mustermann"
                value={form.lastName}
                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">E-Mail</label>
            <input
              required
              type="email"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="ihre@email.de"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Nachricht</label>
            <textarea
              required
              className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
              placeholder="Wie können wir helfen?"
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            />
          </div>
          {status === 'error' && (
            <p className="text-red-600 text-sm font-medium bg-red-50 p-3 rounded-xl">Beim Senden ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut oder schreiben Sie uns direkt an info@bundwimmobilien.de.</p>
          )}
          <button
            type="submit"
            disabled={status === 'sending'}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-60"
          >
            {status === 'sending' ? 'Wird gesendet…' : 'Nachricht senden'}
          </button>
        </form>
      )}
    </div>
  );
};

export const LegalPage: React.FC<{ type: 'impressum' | 'privacy' | 'agb' }> = ({ type }) => (
  <div className="max-w-4xl mx-auto px-4 py-20">
    <SectionHeader
      title={type === 'impressum' ? 'Impressum' : type === 'privacy' ? 'Datenschutzerklärung' : 'Allgemeine Geschäftsbedingungen'}
      subtitle="Rechtliche Informationen zur Nutzung von HausMatch."
    />
    <div className="prose prose-slate max-w-none text-slate-600 space-y-8">
      {type === 'impressum' && (
        <>
          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Angaben gemäß § 5 TMG</h3>
            <p>
              B &amp; W Immobilien Management UG (haftungsbeschränkt)<br />
              Goethestraße 42<br />
              45964 Gladbeck<br />
              Deutschland
            </p>
          </section>
          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Vertreten durch:</h3>
            <p>
              Franz-Josef Barth (Geschäftsführer)<br />
              Alexander Wachtel (stellvertretender Geschäftsführer)
            </p>
          </section>
          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Kontakt:</h3>
            <p>
              Telefon: +49 151 29468127<br />
              E-Mail: info@bundwimmobilien.de<br />
              Web: www.bundwimmobilien.de
            </p>
          </section>
          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Registereintrag:</h3>
            <p>
              Eingetragen im Handelsregister beim Amtsgericht Gelsenkirchen<br />
              Handelsregisternummer: HRB 19149
            </p>
          </section>
          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Umsatzsteuer-ID:</h3>
            <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz: DE456949310</p>
          </section>
          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Erlaubnis nach § 34c GewO:</h3>
            <p>
              Erteilt durch: Ordnungsamt Recklinghausen<br />
              Kurt-Schumacher-Allee 1<br />
              45657 Recklinghausen
            </p>
          </section>
          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Berufshaftpflichtversicherung:</h3>
            <p>
              Provinzial<br />
              Asselner Hellweg 131<br />
              44319 Dortmund<br />
              Geltungsraum der Versicherung: Deutschland
            </p>
          </section>
          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:</h3>
            <p>
              Franz-Josef Barth<br />
              Goethestraße 42<br />
              45964 Gladbeck
            </p>
          </section>
        </>
      )}

      {type === 'privacy' && (
        <>
          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4">1. Verantwortlicher</h3>
            <p>Verantwortlicher im Sinne der DSGVO ist:<br />
            B &amp; W Immobilien Management UG (haftungsbeschränkt)<br />
            Goethestraße 42, 45964 Gladbeck<br />
            E-Mail: info@bundwimmobilien.de</p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4">2. Erhebung und Verarbeitung personenbezogener Daten</h3>
            <p>Wir erheben personenbezogene Daten nur, soweit dies für die Bereitstellung unserer Dienste erforderlich ist. Dazu gehören bei Registrierung: Name, E-Mail-Adresse, Rollenangabe (Eigentümer/Verwalter). Diese Daten werden für den Betrieb der Plattform genutzt und nicht an Dritte verkauft.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4">3. Eingesetzte Dienste und Drittanbieter</h3>

            <h4 className="font-bold text-slate-800 mb-2">3.1 Google Firebase (Authentifizierung &amp; Datenbank)</h4>
            <p>Wir nutzen Google Firebase (Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA) für Nutzeranmeldung und Datenspeicherung. Daten können auf Servern in den USA verarbeitet werden. Grundlage ist ein Standardvertragsklauseln-Abkommen gemäß Art. 46 DSGVO. Datenschutzerklärung Google: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">policies.google.com/privacy</a></p>

            <h4 className="font-bold text-slate-800 mb-2 mt-4">3.2 Google Gemini KI</h4>
            <p>Unser KI-Assistent „Eddy" und die Suchfunktion nutzen Google Gemini (Google LLC). Anfragen, die Sie an Eddy stellen, werden zur Verarbeitung an die Google Gemini API übertragen. Wir empfehlen, keine sensiblen personenbezogenen Daten in Chat-Anfragen einzugeben. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung / Bereitstellung des Dienstes).</p>

            <h4 className="font-bold text-slate-800 mb-2 mt-4">3.3 Resend (E-Mail-Versand)</h4>
            <p>Für den Versand von E-Mails (Anfragen, Kontaktformular) nutzen wir Resend (Resend Inc., USA). Dabei werden Name und E-Mail-Adresse der Absender an Resend übermittelt. Datenschutzerklärung: <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">resend.com/legal/privacy-policy</a></p>

            <h4 className="font-bold text-slate-800 mb-2 mt-4">3.4 Vercel (Hosting)</h4>
            <p>Die Plattform wird auf Vercel (Vercel Inc., USA) gehostet. Beim Seitenaufruf werden technische Daten (IP-Adresse, Browsertyp, Zugriffszeit) im Rahmen des regulären Serverbetriebs verarbeitet. Datenschutzerklärung: <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">vercel.com/legal/privacy-policy</a></p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4">4. Cookies</h3>
            <p>Diese Website verwendet ausschließlich technisch notwendige Cookies (z. B. für die Anmeldesitzung). Es werden keine Tracking- oder Marketing-Cookies gesetzt. Eine Cookie-Einwilligung ist daher nicht erforderlich.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4">5. Speicherdauer</h3>
            <p>Nutzerdaten werden gespeichert, solange das Konto aktiv ist. Nach Kontolöschung werden alle personenbezogenen Daten innerhalb von 30 Tagen gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4">6. Ihre Rechte</h3>
            <p>Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) sowie Widerspruch (Art. 21 DSGVO). Beschwerden können an die zuständige Datenschutzaufsichtsbehörde gerichtet werden (Landesbeauftragte für Datenschutz NRW).</p>
            <p className="mt-2">Anfragen richten Sie bitte an: <a href="mailto:info@bundwimmobilien.de" className="text-indigo-600 underline">info@bundwimmobilien.de</a></p>
          </section>
        </>
      )}

      {type === 'agb' && (
        <>
          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4">§ 1 Geltungsbereich</h3>
            <p>Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der Plattform HausMatch, betrieben von der B &amp; W Immobilien Management UG (haftungsbeschränkt), Goethestraße 42, 45964 Gladbeck (nachfolgend „Betreiber"). Mit der Registrierung akzeptieren Sie diese AGB in der jeweils gültigen Fassung.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4">§ 2 Leistungsbeschreibung</h3>
            <p>HausMatch ist eine digitale Vermittlungsplattform, die Eigentümer von Immobilien mit professionellen Hausverwaltungsunternehmen zusammenführt. Der Betreiber vermittelt lediglich den Kontakt zwischen den Parteien und ist nicht Vertragspartner der zwischen Eigentümern und Verwaltern geschlossenen Verwaltungsverträge.</p>
            <p className="mt-2">Die Plattform bietet zusätzlich einen KI-gestützten Assistenten („Eddy"), der allgemeine Informationen zu Immobilienthemen bereitstellt. Eddy ersetzt keine Rechts-, Steuer- oder Finanzberatung.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4">§ 3 Registrierung und Nutzerkonto</h3>
            <p>Die Nutzung bestimmter Funktionen setzt eine Registrierung voraus. Nutzer müssen volljährig sein und die angegebenen Daten wahrheitsgemäß angeben. Pro Person ist nur ein Konto zulässig. Der Betreiber behält sich vor, Konten bei Verstößen gegen diese AGB zu sperren oder zu löschen.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4">§ 4 Pflichten der Nutzer</h3>
            <p>Nutzer verpflichten sich, die Plattform nicht für rechtswidrige Zwecke zu nutzen, keine falschen Angaben zu machen, keine Spam-Nachrichten oder Werbung ohne Zustimmung zu versenden und keine Inhalte zu veröffentlichen, die gegen geltendes Recht, Rechte Dritter oder die guten Sitten verstoßen.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4">§ 5 Haftungsbeschränkung</h3>
            <p>Der Betreiber übernimmt keine Haftung für die Qualität, Zuverlässigkeit oder Bonität der auf der Plattform gelisteten Hausverwaltungsunternehmen. Angaben zu Bewertungen und Spezialisierungen basieren auf öffentlich verfügbaren Informationen und KI-Auswertungen — eine Garantie für deren Richtigkeit wird nicht gegeben.</p>
            <p className="mt-2">Die Haftung des Betreibers für Schäden aus einfacher Fahrlässigkeit ist — außer bei Verletzung wesentlicher Vertragspflichten sowie bei Schäden aus der Verletzung von Leben, Körper oder Gesundheit — ausgeschlossen.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4">§ 6 KI-Assistent (Eddy)</h3>
            <p>Der KI-Assistent Eddy stellt automatisch generierte Informationen bereit. Diese Informationen sind allgemeiner Natur und stellen keine Rechts-, Steuer- oder Finanzberatung dar. Für Entscheidungen, die auf Eddy-Antworten basieren, übernimmt der Betreiber keine Haftung. Nutzer werden ausdrücklich aufgefordert, bei rechtlichen oder finanziellen Fragen einen zugelassenen Fachberater hinzuzuziehen.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4">§ 7 Änderungen der AGB</h3>
            <p>Der Betreiber behält sich vor, diese AGB jederzeit zu ändern. Registrierte Nutzer werden über wesentliche Änderungen per E-Mail informiert. Die fortgesetzte Nutzung der Plattform nach Bekanntgabe der Änderungen gilt als Zustimmung.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4">§ 8 Kündigung</h3>
            <p>Nutzer können ihr Konto jederzeit ohne Angabe von Gründen löschen. Der Betreiber kann Konten bei schwerwiegenden Verstößen gegen diese AGB fristlos sperren oder kündigen.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4">§ 9 Anwendbares Recht und Gerichtsstand</h3>
            <p>Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand für alle Streitigkeiten aus oder im Zusammenhang mit diesen AGB ist, soweit gesetzlich zulässig, Gelsenkirchen.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4">§ 10 Salvatorische Klausel</h3>
            <p>Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.</p>
          </section>

          <p className="text-sm text-slate-400 italic mt-8">Stand: Juni 2026 | B &amp; W Immobilien Management UG (haftungsbeschränkt)</p>
        </>
      )}
    </div>
  </div>
);

