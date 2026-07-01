import React, { useEffect, useState } from "react";

const API = "https://abdoul-pub-production.up.railway.app/api";

export default function App() {
  const [tab, setTab] = useState("campaigns");

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">Abdoul <span>PUB</span></div>
        <div className={`nav-item ${tab === "campaigns" ? "active" : ""}`} onClick={() => setTab("campaigns")}>Campagnes</div>
        <div className={`nav-item ${tab === "clients" ? "active" : ""}`} onClick={() => setTab("clients")}>Clients</div>
        <div className={`nav-item ${tab === "stats" ? "active" : ""}`} onClick={() => setTab("stats")}>Statistiques</div>
      </aside>
      <main className="main">
        {tab === "campaigns" && <Campaigns />}
        {tab === "clients" && <Clients />}
        {tab === "stats" && <Stats />}
      </main>
    </div>
  );
}

// ---------------- CLIENTS ----------------

function Clients() {
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", meta_ad_account_id: "", tiktok_advertiser_id: "" });
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch(`${API}/clients`).then(r => r.json()).then(d => { setClients(d); setLoading(false); });
  };
  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    await fetch(`${API}/clients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowModal(false);
    setForm({ name: "", company: "", email: "", phone: "", meta_ad_account_id: "", tiktok_advertiser_id: "" });
    load();
  };

  const remove = async (id) => {
    await fetch(`${API}/clients/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <>
      <div className="header-row">
        <div>
          <h1>Clients</h1>
          <div className="subtitle">Les comptes que tu gères pour ton agence</div>
        </div>
        <button className="btn" onClick={() => setShowModal(true)}>+ Nouveau client</button>
      </div>

      {loading && <div className="loading-text">Chargement…</div>}
      {!loading && clients.length === 0 && (
        <div className="empty-state">
          <div className="big">Aucun client pour l'instant</div>
          Ajoute ton premier client pour pouvoir créer des campagnes pour lui.
        </div>
      )}

      {clients.map(c => (
        <div className="card campaign-row" key={c.id}>
          <div>
            <div className="card-title">{c.name}{c.company ? ` — ${c.company}` : ""}</div>
            <div className="card-meta">{c.email || "Pas d'email"} {c.phone ? `· ${c.phone}` : ""}</div>
          </div>
          <button className="btn danger" onClick={() => remove(c.id)}>Supprimer</button>
        </div>
      ))}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Nouveau client</h2>
            <form onSubmit={submit}>
              <div className="field">
                <label>Nom *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="field">
                <label>Entreprise</label>
                <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="field">
                <label>Téléphone</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="field">
                <label>ID compte pub Meta (optionnel, ex: act_123...)</label>
                <input value={form.meta_ad_account_id} onChange={e => setForm({ ...form, meta_ad_account_id: e.target.value })} />
              </div>
              <div className="field">
                <label>ID Advertiser TikTok (optionnel)</label>
                <input value={form.tiktok_advertiser_id} onChange={e => setForm({ ...form, tiktok_advertiser_id: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn secondary" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn">Créer le client</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ---------------- CAMPAIGNS ----------------

function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState(null);
  const [form, setForm] = useState({
    client_id: "", name: "", objective: "traffic", budget_amount: "", budget_type: "daily",
    platforms: [], start_date: "", end_date: "",
  });

  const load = () => {
    Promise.all([
      fetch(`${API}/campaigns`).then(r => r.json()),
      fetch(`${API}/clients`).then(r => r.json()),
    ]).then(([camps, cls]) => { setCampaigns(camps); setClients(cls); setLoading(false); });
  };
  useEffect(load, []);

  const togglePlatform = (p) => {
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(p) ? f.platforms.filter(x => x !== p) : [...f.platforms, p],
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setWarning(null);
    const res = await fetch(`${API}/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setWarning(data.error); return; }
    if (data.warnings) setWarning(data.warnings.join(" · "));
    setShowModal(false);
    setForm({ client_id: "", name: "", objective: "traffic", budget_amount: "", budget_type: "daily", platforms: [], start_date: "", end_date: "" });
    load();
  };

  const setStatus = async (id, status) => {
    await fetch(`${API}/campaigns/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const remove = async (id) => {
    await fetch(`${API}/campaigns/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <>
      <div className="header-row">
        <div>
          <h1>Campagnes</h1>
          <div className="subtitle">Création et planification multi-réseaux</div>
        </div>
        <button className="btn" onClick={() => setShowModal(true)} disabled={clients.length === 0}>+ Nouvelle campagne</button>
      </div>

      {clients.length === 0 && !loading && (
        <div className="alert">Crée d'abord un client avant de lancer une campagne.</div>
      )}

      {loading && <div className="loading-text">Chargement…</div>}
      {!loading && campaigns.length === 0 && clients.length > 0 && (
        <div className="empty-state">
          <div className="big">Aucune campagne créée</div>
          Lance ta première campagne — elle sera créée en pause par sécurité, à activer manuellement.
        </div>
      )}

      {campaigns.map(c => {
        const platforms = JSON.parse(c.platforms || "[]");
        return (
          <div className="card campaign-row" key={c.id}>
            <div>
              <div className="card-title">{c.name}</div>
              <div className="card-meta">
                Client : {c.client_name} · Objectif : {c.objective || "—"} · Budget : {c.budget_amount ? `${c.budget_amount} (${c.budget_type})` : "—"}
              </div>
              <div style={{ marginTop: 6 }}>
                {platforms.includes("meta") && <span className="platform-tag meta">META</span>}
                {platforms.includes("tiktok") && <span className="platform-tag tiktok">TIKTOK</span>}
                <span className={`status-badge ${c.status}`}>{c.status}</span>
              </div>
            </div>
            <div className="campaign-row-right">
              {c.status === "paused" && <button className="btn secondary" onClick={() => setStatus(c.id, "active")}>Activer</button>}
              {c.status === "active" && <button className="btn secondary" onClick={() => setStatus(c.id, "paused")}>Mettre en pause</button>}
              <button className="btn danger" onClick={() => remove(c.id)}>Supprimer</button>
            </div>
          </div>
        );
      })}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Nouvelle campagne</h2>
            {warning && <div className="alert">{warning}</div>}
            <form onSubmit={submit}>
              <div className="field">
                <label>Client *</label>
                <select required value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })}>
                  <option value="">— Sélectionner —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Nom de la campagne *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="field">
                <label>Objectif</label>
                <select value={form.objective} onChange={e => setForm({ ...form, objective: e.target.value })}>
                  <option value="traffic">Trafic</option>
                  <option value="awareness">Notoriété</option>
                  <option value="engagement">Engagement</option>
                  <option value="leads">Leads</option>
                  <option value="sales">Ventes</option>
                </select>
              </div>
              <div className="field">
                <label>Réseaux *</label>
                <div className="checkbox-row">
                  <div className={`checkbox-pill ${form.platforms.includes("meta") ? "checked" : ""}`} onClick={() => togglePlatform("meta")}>
                    <input type="checkbox" readOnly checked={form.platforms.includes("meta")} /> Facebook/Instagram
                  </div>
                  <div className={`checkbox-pill ${form.platforms.includes("tiktok") ? "checked" : ""}`} onClick={() => togglePlatform("tiktok")}>
                    <input type="checkbox" readOnly checked={form.platforms.includes("tiktok")} /> TikTok
                  </div>
                </div>
              </div>
              <div className="field">
                <label>Budget (FCFA)</label>
                <input type="number" value={form.budget_amount} onChange={e => setForm({ ...form, budget_amount: e.target.value })} />
              </div>
              <div className="field">
                <label>Type de budget</label>
                <select value={form.budget_type} onChange={e => setForm({ ...form, budget_type: e.target.value })}>
                  <option value="daily">Journalier</option>
                  <option value="lifetime">Total (durée de la campagne)</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn secondary" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn" disabled={form.platforms.length === 0}>Créer (en pause)</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ---------------- STATS ----------------

function Stats() {
  const [campaigns, setCampaigns] = useState([]);
  const [selected, setSelected] = useState(null);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    fetch(`${API}/campaigns`).then(r => r.json()).then(setCampaigns);
  }, []);

  const viewStats = async (c) => {
    setSelected(c);
    setLoadingStats(true);
    const res = await fetch(`${API}/campaigns/${c.id}/stats`);
    setStats(await res.json());
    setLoadingStats(false);
  };

  return (
    <>
      <div className="header-row">
        <div>
          <h1>Statistiques</h1>
          <div className="subtitle">Performances par campagne, tous réseaux</div>
        </div>
      </div>

      {campaigns.length === 0 && (
        <div className="empty-state">
          <div className="big">Aucune campagne à analyser</div>
          Crée une campagne pour voir ses statistiques ici.
        </div>
      )}

      {campaigns.map(c => (
        <div className="card campaign-row" key={c.id} style={{ cursor: "pointer" }} onClick={() => viewStats(c)}>
          <div>
            <div className="card-title">{c.name}</div>
            <div className="card-meta">{c.client_name}</div>
          </div>
          <span className={`status-badge ${c.status}`}>{c.status}</span>
        </div>
      ))}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 520 }}>
            <h2>{selected.name}</h2>
            {loadingStats && <div className="loading-text">Récupération des statistiques…</div>}
            {!loadingStats && stats && (
              <>
                {stats.meta && (
                  <div style={{ marginBottom: 18 }}>
                    <span className="platform-tag meta">META</span>
                    {stats.meta.error ? (
                      <div className="alert">{stats.meta.error}</div>
                    ) : (
                      <div className="stats-grid">
                        <StatBox label="Impressions" value={stats.meta.impressions} />
                        <StatBox label="Clics" value={stats.meta.clicks} />
                        <StatBox label="Dépense" value={stats.meta.spend} />
                        <StatBox label="Portée" value={stats.meta.reach} />
                      </div>
                    )}
                  </div>
                )}
                {stats.tiktok && (
                  <div>
                    <span className="platform-tag tiktok">TIKTOK</span>
                    {stats.tiktok.error ? (
                      <div className="alert">{stats.tiktok.error}</div>
                    ) : (
                      <div className="stats-grid">
                        <StatBox label="Impressions" value={stats.tiktok.impressions} />
                        <StatBox label="Clics" value={stats.tiktok.clicks} />
                        <StatBox label="Dépense" value={stats.tiktok.spend} />
                        <StatBox label="Portée" value={stats.tiktok.reach} />
                      </div>
                    )}
                  </div>
                )}
                {!stats.meta && !stats.tiktok && <div className="loading-text">Pas encore de données disponibles pour cette campagne.</div>}
              </>
            )}
            <div className="modal-actions">
              <button className="btn secondary" onClick={() => setSelected(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="stat-box">
      <div className="label">{label}</div>
      <div className="value">{value ?? "—"}</div>
    </div>
  );
}
