import fs from "fs";
import path from "path";

const DB_FILE = path.resolve("./data.json");

function loadData() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ clients: [], campaigns: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

function saveData(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function nextId(arr) {
  return arr.length === 0 ? 1 : Math.max(...arr.map(x => x.id)) + 1;
}

const db = {
  // CLIENTS
  getClients() {
    return loadData().clients.sort((a, b) => b.id - a.id);
  },
  createClient(fields) {
    const data = loadData();
    const client = { id: nextId(data.clients), ...fields, created_at: new Date().toISOString() };
    data.clients.push(client);
    saveData(data);
    return client;
  },
  deleteClient(id) {
    const data = loadData();
    data.clients = data.clients.filter(c => c.id !== Number(id));
    saveData(data);
  },
  getClient(id) {
    return loadData().clients.find(c => c.id === Number(id));
  },

  // CAMPAIGNS
  getCampaigns() {
    const data = loadData();
    return data.campaigns
      .sort((a, b) => b.id - a.id)
      .map(camp => {
        const client = data.clients.find(c => c.id === camp.client_id);
        return { ...camp, client_name: client?.name || "Inconnu" };
      });
  },
  createCampaign(fields) {
    const data = loadData();
    const campaign = { id: nextId(data.campaigns), ...fields, created_at: new Date().toISOString() };
    data.campaigns.push(campaign);
    saveData(data);
    return campaign;
  },
  updateCampaignStatus(id, status) {
    const data = loadData();
    const camp = data.campaigns.find(c => c.id === Number(id));
    if (camp) camp.status = status;
    saveData(data);
    return camp;
  },
  deleteCampaign(id) {
    const data = loadData();
    data.campaigns = data.campaigns.filter(c => c.id !== Number(id));
    saveData(data);
  },
  getCampaign(id) {
    return loadData().campaigns.find(c => c.id === Number(id));
  },
};

export default db;
