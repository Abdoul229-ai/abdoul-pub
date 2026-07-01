import express from "express";
import cors from "cors";
import "dotenv/config";
import db from "./db.js";
import { createMetaCampaign, getMetaCampaignInsights, listMetaAdAccounts } from "./meta.js";
import { createTikTokCampaign, getTikTokCampaignInsights, isTikTokConfigured } from "./tiktok.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// ---------- CLIENTS ----------

app.get("/api/clients", (req, res) => {
  res.json(db.getClients());
});

app.post("/api/clients", (req, res) => {
  const { name, company, email, phone, meta_ad_account_id, tiktok_advertiser_id } = req.body;
  if (!name) return res.status(400).json({ error: "Le nom du client est requis." });
  const client = db.createClient({ name, company: company || null, email: email || null, phone: phone || null, meta_ad_account_id: meta_ad_account_id || null, tiktok_advertiser_id: tiktok_advertiser_id || null });
  res.status(201).json(client);
});

app.delete("/api/clients/:id", (req, res) => {
  db.deleteClient(req.params.id);
  res.status(204).end();
});

// ---------- CAMPAIGNS ----------

app.get("/api/campaigns", (req, res) => {
  res.json(db.getCampaigns());
});

app.post("/api/campaigns", async (req, res) => {
  const { client_id, name, objective, budget_amount, budget_type, platforms, start_date, end_date } = req.body;

  if (!client_id || !name || !platforms || platforms.length === 0) {
    return res.status(400).json({ error: "client_id, name et platforms sont requis." });
  }

  const client = db.getClient(client_id);
  if (!client) return res.status(404).json({ error: "Client introuvable." });

  let metaCampaignId = null;
  let tiktokCampaignId = null;
  const errors = [];

  if (platforms.includes("meta")) {
    try {
      const adAccountId = client.meta_ad_account_id || process.env.META_AD_ACCOUNT_ID;
      const result = await createMetaCampaign({ adAccountId, name, objective });
      metaCampaignId = result.id;
    } catch (e) {
      errors.push(`Meta: ${e.response?.data?.error?.message || e.message}`);
    }
  }

  if (platforms.includes("tiktok")) {
    try {
      const advertiserId = client.tiktok_advertiser_id || process.env.TIKTOK_ADVERTISER_ID;
      const result = await createTikTokCampaign({ advertiserId, name, objective });
      tiktokCampaignId = result?.campaign_id || null;
    } catch (e) {
      errors.push(`TikTok: ${e.message}`);
    }
  }

  const campaign = db.createCampaign({
    client_id: Number(client_id),
    name,
    objective: objective || null,
    budget_amount: budget_amount || null,
    budget_type: budget_type || "daily",
    platforms: JSON.stringify(platforms),
    status: "paused",
    start_date: start_date || null,
    end_date: end_date || null,
    meta_campaign_id: metaCampaignId,
    tiktok_campaign_id: tiktokCampaignId,
  });

  res.status(201).json({ campaign, warnings: errors.length ? errors : undefined });
});

app.patch("/api/campaigns/:id/status", (req, res) => {
  const { status } = req.body;
  const campaign = db.updateCampaignStatus(req.params.id, status);
  res.json(campaign);
});

app.delete("/api/campaigns/:id", (req, res) => {
  db.deleteCampaign(req.params.id);
  res.status(204).end();
});

// ---------- STATS ----------

app.get("/api/campaigns/:id/stats", async (req, res) => {
  const campaign = db.getCampaign(req.params.id);
  if (!campaign) return res.status(404).json({ error: "Campagne introuvable." });

  const stats = { meta: null, tiktok: null };

  if (campaign.meta_campaign_id) {
    try {
      stats.meta = await getMetaCampaignInsights(campaign.meta_campaign_id);
    } catch (e) {
      stats.meta = { error: e.response?.data?.error?.message || e.message };
    }
  }

  if (campaign.tiktok_campaign_id) {
    try {
      const client = db.getClient(campaign.client_id);
      stats.tiktok = await getTikTokCampaignInsights(campaign.tiktok_campaign_id, client.tiktok_advertiser_id);
    } catch (e) {
      stats.tiktok = { error: e.message };
    }
  }

  res.json(stats);
});

// ---------- STATUS ----------

app.get("/api/status", async (req, res) => {
  const status = { meta: { connected: false }, tiktok: { connected: isTikTokConfigured() } };
  try {
    const accounts = await listMetaAdAccounts();
    status.meta.connected = true;
    status.meta.accounts = accounts;
  } catch (e) {
    status.meta.error = e.response?.data?.error?.message || e.message;
  }
  res.json(status);
});

app.listen(PORT, () => {
  console.log(`Abdoul Pub backend démarré sur http://localhost:4000`);
});
