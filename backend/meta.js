import axios from "axios";
import "dotenv/config";

const API_VERSION = process.env.META_API_VERSION || "v25.0";
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

function getToken() {
  return process.env.META_ACCESS_TOKEN;
}

/**
 * Crée une campagne sur Meta (Facebook/Instagram).
 * Toujours créée en statut PAUSED par sécurité — l'utilisateur l'active manuellement.
 */
export async function createMetaCampaign({ adAccountId, name, objective }) {
  const token = getToken();
  if (!token) throw new Error("META_ACCESS_TOKEN manquant dans .env");

  const objectiveMap = {
    traffic: "OUTCOME_TRAFFIC",
    awareness: "OUTCOME_AWARENESS",
    engagement: "OUTCOME_ENGAGEMENT",
    leads: "OUTCOME_LEADS",
    sales: "OUTCOME_SALES",
  };

  const res = await axios.post(`${BASE_URL}/${adAccountId}/campaigns`, null, {
    params: {
      name,
      objective: objectiveMap[objective] || "OUTCOME_TRAFFIC",
      status: "PAUSED",
      special_ad_categories: JSON.stringify([]),
      access_token: token,
    },
  });

  return res.data; // { id: 'campaign_id' }
}

/**
 * Récupère les statistiques (insights) d'une campagne Meta.
 */
export async function getMetaCampaignInsights(campaignId) {
  const token = getToken();
  const res = await axios.get(`${BASE_URL}/${campaignId}/insights`, {
    params: {
      fields: "impressions,clicks,spend,reach",
      access_token: token,
    },
  });
  return res.data?.data?.[0] || { impressions: 0, clicks: 0, spend: 0, reach: 0 };
}

/**
 * Liste les comptes publicitaires accessibles avec le token actuel.
 */
export async function listMetaAdAccounts() {
  const token = getToken();
  const res = await axios.get(`${BASE_URL}/me/adaccounts`, {
    params: { access_token: token, fields: "id,name,account_status" },
  });
  return res.data?.data || [];
}
