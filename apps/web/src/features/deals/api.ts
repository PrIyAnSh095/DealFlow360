import { Deal, DealStatus } from "./types";

// Hardcoded mock data for Phase 4 UI implementation
const MOCK_DEALS: Deal[] = [
  {
    id: "d-1",
    name: "Acme Renewal",
    customerName: "Acme Corp",
    value: 125000,
    margin: 18.2,
    discount: 15,
    status: "approval",
    risk: "high",
    ownerId: "u-1",
    ownerInitials: "AJ",
    updatedAt: new Date().toISOString(),
    nextAction: "Review Margin"
  },
  {
    id: "d-2",
    name: "Globex Server Expansion",
    customerName: "Globex Ltd",
    value: 85000,
    margin: 24.1,
    discount: 10,
    status: "review",
    risk: "medium",
    ownerId: "u-2",
    ownerInitials: "SM",
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    nextAction: "Check Inventory"
  },
  {
    id: "d-3",
    name: "Initech Fleet Upgrade",
    customerName: "Initech",
    value: 420000,
    margin: 32.0,
    discount: 5,
    status: "draft",
    risk: "low",
    ownerId: "u-1",
    ownerInitials: "AJ",
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    nextAction: "Add Products"
  },
  {
    id: "d-4",
    name: "Stark Ind. Phase 1",
    customerName: "Stark Industries",
    value: 2100000,
    margin: 45.5,
    discount: 0,
    status: "negotiation",
    risk: "medium",
    ownerId: "u-3",
    ownerInitials: "TS",
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    nextAction: "Awaiting Customer"
  },
  {
    id: "d-5",
    name: "Wayne Ent. Security",
    customerName: "Wayne Enterprises",
    value: 850000,
    margin: 28.4,
    discount: 12,
    status: "confirmed",
    risk: "low",
    ownerId: "u-2",
    ownerInitials: "SM",
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
  }
];

export const dealsApi = {
  getDeals: async (): Promise<Deal[]> => {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 800));
    // In real app: return apiClient.get('/deals').then(res => res.data);
    
    // Check localStorage for persisted mock data across reloads
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mock_deals');
      if (stored) return JSON.parse(stored);
      
      localStorage.setItem('mock_deals', JSON.stringify(MOCK_DEALS));
    }
    return MOCK_DEALS;
  },
  
  updateDealStatus: async (id: string, status: DealStatus): Promise<Deal> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    // In real app: return apiClient.patch(`/deals/${id}`, { status }).then(res => res.data);
    
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mock_deals');
      const deals: Deal[] = stored ? JSON.parse(stored) : MOCK_DEALS;
      const updatedDeals = deals.map(d => d.id === id ? { ...d, status, updatedAt: new Date().toISOString() } : d);
      localStorage.setItem('mock_deals', JSON.stringify(updatedDeals));
      return updatedDeals.find(d => d.id === id)!;
    }
    return MOCK_DEALS.find(d => d.id === id)!;
  }
};
