import axios from "axios";
import "dotenv/config";

const BASE_URL = "https://business-api.tiktok.com/open_api/v1.3";

function getToken() {
  return process.env.TIKTOK_ACCESS_TOKEN;
}

function isConfigured() {
  return Boolean(process.env.TIKTOK_ACCESS_TOKEN && process.env.TIKTOK_ADVERTISER_ID);
}

/**
 * Crée une campagne sur TikTok. Créée en pause par sécurité.
 */
export async function createTikTokCampaign({ advertiserId, name, objective }) {
  if (!isConfigured()) {
    throw new Error("Identifiants TikTok manquants dans .env — configure-les pour activer TikTok.");
  }

  const objectiveMap = {
    traffic: "TRAFFIC",
    awareness: "REACH",
    engagement: "ENGAGEMENT",
    leads: "LEAD_GENERATION",
    sales: "CONVERSIONS",
  };

  const res = await axios.post(
    `${BASE_URL}/campaign/create/`,
    {
      advertiser_id: advertiserId,
      campaign_name: name,
      objective_type: objectiveMap[objective] || "TRAFFIC",
      budget_mode: "BUDGET_MODE_INFINITE",
      operation_status: "DISABLE", // équivalent "pause" chez TikTok
    },
    { headers: { "Access-Token": getToken(), "Content-Type": "application/json" } }
  );

  return res.data?.data;
}

export async function getTikTokCampaignInsights(campaignId, advertiserId) {
  if (!isConfigured()) {
    return { impressions: 0, clicks: 0, spend: 0, reach: 0 };
  }
  const res = await axios.get(`${BASE_URL}/report/integrated/get/`, {
    headers: { "Access-Token": getToken() },
    params: {
      advertiser_id: advertiserId,
      report_type: "BASIC",
      dimensions: JSON.stringify(["campaign_id"]),
      metrics: JSON.stringify(["impressions", "clicks", "spend", "reach"]),
      filters: JSON.stringify([{ field_name: "campaign_ids", filter_type: "IN", filter_value: JSON.stringify([campaignId]) }]),
    },
  });
  return res.data?.data?.list?.[0]?.metrics || { impressions: 0, clicks: 0, spend: 0, reach: 0 };
}

export { isConfigured as isTikTokConfigured };
