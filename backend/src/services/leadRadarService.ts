/**
 * GFB Growth OS — LeadRadar B2B Outbound Search & Contact Enrichment Service
 * Prospecção inteligente de empresas e profissionais por nicho e localização geográfica
 * com validação de WhatsApp e importação com 1 clique para o CRM.
 */

import { mockDb, MockLead } from "./mockDb.js";
import { identityService } from "./identityService.js";
import { eventBus } from "./eventBus.js";

export interface LeadRadarResult {
  id: string;
  businessName: string;
  contactName: string;
  category: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  formattedPhone: string;
  hasWhatsApp: boolean;
  rating: number;
  reviewCount: number;
  website?: string;
  instagram?: string;
  isImported: boolean;
}

export class LeadRadarService {
  private databaseMockPool: LeadRadarResult[] = [
    {
      id: "radar_01",
      businessName: "Instituto Shen de Medicina Chinesa",
      contactName: "Dra. Helena Chang",
      category: "Clínica de Acupuntura & Fitoterapia",
      address: "Av. Paulista, 1842 - Bela Vista",
      city: "São Paulo",
      state: "SP",
      phone: "+5511991234567",
      formattedPhone: "+55 (11) 99123-4567",
      hasWhatsApp: true,
      rating: 4.9,
      reviewCount: 142,
      website: "https://institutoshen.med.br",
      instagram: "@institutoshen",
      isImported: false,
    },
    {
      id: "radar_02",
      businessName: "Espaço Tao Saúde Integrativa",
      contactName: "Dr. Marcelo Nogueira",
      category: "Acupuntura Médica & Ozonioterapia",
      address: "Rua Oscar Freire, 381 - Jardins",
      city: "São Paulo",
      state: "SP",
      phone: "+5511982345678",
      formattedPhone: "+55 (11) 98234-5678",
      hasWhatsApp: true,
      rating: 4.8,
      reviewCount: 98,
      instagram: "@espacotaosaude",
      isImported: false,
    },
    {
      id: "radar_03",
      businessName: "Clínica Equilíbrio Vital",
      contactName: "Dra. Renata Vasconcelos",
      category: "Fisioterapia & Acupuntura Tradicional",
      address: "Rua Sete de Setembro, 4520 - Batel",
      city: "Curitiba",
      state: "PR",
      phone: "+5541993456789",
      formattedPhone: "+55 (41) 99345-6789",
      hasWhatsApp: true,
      rating: 5.0,
      reviewCount: 76,
      website: "https://equilibriovital.com.br",
      isImported: false,
    },
    {
      id: "radar_04",
      businessName: "Centro de Terapias Orientais Lotus",
      contactName: "Rodrigo Takahashi",
      category: "Massoterapia & Acupuntura",
      address: "Av. Atlântica, 1020 - Copacabana",
      city: "Rio de Janeiro",
      state: "RJ",
      phone: "+5521974567890",
      formattedPhone: "+55 (21) 97456-7890",
      hasWhatsApp: true,
      rating: 4.7,
      reviewCount: 110,
      isImported: false,
    },
    {
      id: "radar_05",
      businessName: "Consultório Dr. André Mendes",
      contactName: "Dr. André Mendes",
      category: "Médico Integrativo & Acupunturiatra",
      address: "Rua Paraíba, 1352 - Savassi",
      city: "Belo Horizonte",
      state: "MG",
      phone: "+5531985678901",
      formattedPhone: "+55 (31) 98567-8901",
      hasWhatsApp: true,
      rating: 4.9,
      reviewCount: 88,
      website: "https://drandremendes.com",
      isImported: false,
    },
  ];

  /**
   * Realiza busca geolocalizada e por nicho no radar
   */
  public search(params: { niche?: string; location?: string; onlyWithWhatsApp?: boolean }): {
    results: LeadRadarResult[];
    totalFound: number;
    filters: typeof params;
  } {
    const nicheTerm = (params.niche || "").toLowerCase().trim();
    const locTerm = (params.location || "").toLowerCase().trim();

    let filtered = this.databaseMockPool.filter((item) => {
      const matchNiche =
        !nicheTerm ||
        item.category.toLowerCase().includes(nicheTerm) ||
        item.businessName.toLowerCase().includes(nicheTerm);

      const matchLoc =
        !locTerm ||
        item.city.toLowerCase().includes(locTerm) ||
        item.state.toLowerCase().includes(locTerm) ||
        item.address.toLowerCase().includes(locTerm);

      const matchWpp = !params.onlyWithWhatsApp || item.hasWhatsApp;

      return matchNiche && matchLoc && matchWpp;
    });

    // Se a busca for genérica e não retornar nada no filtro exato, retorna amostras relevantes
    if (filtered.length === 0) {
      filtered = this.databaseMockPool.slice(0, 4);
    }

    // Marca status se já está no CRM
    const leadsPhones = new Set(mockDb.leads.map((l) => l.phone));
    const enriched = filtered.map((item) => ({
      ...item,
      isImported: item.isImported || leadsPhones.has(item.phone),
    }));

    return {
      results: enriched,
      totalFound: enriched.length,
      filters: params,
    };
  }

  /**
   * Importa um ou vários contatos do LeadRadar para o CRM
   */
  public importToCrm(
    items: LeadRadarResult[],
    clientId: string = "cli_bruna_ppp"
  ): { importedCount: number; leads: MockLead[] } {
    const importedLeads: MockLead[] = [];

    for (const item of items) {
      const lead = identityService.resolveOrCreateLead({
        clientId,
        name: item.contactName || item.businessName,
        phone: item.phone,
        sourceTag: `LeadRadar (${item.category} - ${item.city}/${item.state})`,
      });

      lead.temperature = "COLD";
      lead.stage = "LEAD";

      // Marca item como importado no pool
      const poolItem = this.databaseMockPool.find((p) => p.id === item.id);
      if (poolItem) poolItem.isImported = true;

      importedLeads.push(lead);
    }

    eventBus.broadcast({
      type: "TASK_UPDATED",
      payload: {
        action: "LEADRADAR_IMPORTED",
        count: items.length,
      },
    });

    return {
      importedCount: importedLeads.length,
      leads: importedLeads,
    };
  }
}

export const leadRadarService = new LeadRadarService();
