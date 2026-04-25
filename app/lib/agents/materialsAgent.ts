import type { BudgetLine, Domain, FeedbackEntry, MaterialLine, ParsedQuestion } from '../types';
import { tavilySearch, TAVILY_DOMAINS } from './tavily';

const supplierCatalog: Record<
  Domain,
  Array<Omit<MaterialLine, 'purpose' | 'leadTime'> & { cues: string[]; leadTime?: string }>
> = {
  diagnostics: [
    {
      name: 'Anti-human CRP capture antibody',
      supplier: 'Thermo Fisher / Abcam equivalent',
      catalogNumber: 'MA5-17130 or ab32412',
      quantity: '100 ug',
      estimatedUnitCostUsd: 395,
      cues: ['antibody', 'CRP recognition chemistry'],
    },
    {
      name: 'Screen-printed carbon electrodes',
      supplier: 'Metrohm DropSens',
      catalogNumber: 'DRP-110',
      quantity: '75 electrodes',
      estimatedUnitCostUsd: 520,
      cues: ['paper-based electrode build'],
    },
    {
      name: 'CRP protein standard',
      supplier: 'Sigma-Aldrich',
      catalogNumber: 'C1617',
      quantity: '100 ug',
      estimatedUnitCostUsd: 280,
      cues: ['calibration curve'],
    },
  ],
  gut: [
    {
      name: 'Lactobacillus rhamnosus GG culture',
      supplier: 'ATCC',
      catalogNumber: '53103',
      quantity: '1 vial',
      estimatedUnitCostUsd: 640,
      cues: ['defined probiotic strain'],
    },
    {
      name: 'FITC-dextran 4 kDa',
      supplier: 'Sigma-Aldrich',
      catalogNumber: 'FD4',
      quantity: '1 g',
      estimatedUnitCostUsd: 425,
      cues: ['intestinal permeability readout'],
    },
    {
      name: 'Anti-claudin-1 antibody',
      supplier: 'Thermo Fisher',
      catalogNumber: '37-4900',
      quantity: '100 ug',
      estimatedUnitCostUsd: 415,
      cues: ['tight junction validation'],
    },
  ],
  cell: [
    {
      name: 'HeLa cells',
      supplier: 'ATCC',
      catalogNumber: 'CCL-2',
      quantity: '1 vial',
      estimatedUnitCostUsd: 515,
      cues: ['model cell line'],
    },
    {
      name: 'D-(+)-Trehalose dihydrate',
      supplier: 'Sigma-Aldrich',
      catalogNumber: 'T9531',
      quantity: '100 g',
      estimatedUnitCostUsd: 160,
      cues: ['alternative cryoprotectant'],
    },
    {
      name: 'DMSO cell culture grade',
      supplier: 'Sigma-Aldrich',
      catalogNumber: 'D2650',
      quantity: '100 mL',
      estimatedUnitCostUsd: 125,
      cues: ['standard control freezing medium'],
    },
  ],
  climate: [
    {
      name: 'Sporomusa ovata',
      supplier: 'DSMZ',
      catalogNumber: 'DSM 2662',
      quantity: '1 culture',
      estimatedUnitCostUsd: 520,
      cues: ['acetogenic biocatalyst'],
    },
    {
      name: 'H-type bioelectrochemical cell',
      supplier: 'Adams & Chittenden / Pine Research equivalent',
      catalogNumber: 'custom H-cell',
      quantity: '2 assemblies',
      estimatedUnitCostUsd: 2400,
      cues: ['controlled cathode compartment'],
    },
    {
      name: 'Carbon cloth cathode',
      supplier: 'Fuel Cell Store',
      catalogNumber: 'AvCarb 1071 HCB',
      quantity: '5 sheets',
      estimatedUnitCostUsd: 275,
      cues: ['working electrode'],
    },
  ],
  general: [
    {
      name: 'Assay-specific positive control',
      supplier: 'Thermo Fisher / Sigma-Aldrich',
      catalogNumber: 'TBD by protocol',
      quantity: '1 kit',
      estimatedUnitCostUsd: 450,
      cues: ['anchors assay performance'],
    },
    {
      name: 'Consumables and sterile plastics',
      supplier: 'VWR / Fisher Scientific',
      catalogNumber: 'mixed',
      quantity: 'project pack',
      estimatedUnitCostUsd: 850,
      cues: ['pipette tips, plates, tubes, PPE'],
    },
  ],
};

function directLabor(parsed: ParsedQuestion) {
  if (parsed.domain === 'gut') return { hours: 90, cost: 6750 };
  if (parsed.domain === 'climate') return { hours: 120, cost: 9000 };
  if (parsed.domain === 'diagnostics') return { hours: 80, cost: 6000 };
  return { hours: 64, cost: 4800 };
}

export async function runMaterialsAgent(parsed: ParsedQuestion, feedback: FeedbackEntry[]) {
  const supplierHits = await tavilySearch(`${parsed.question} supplier catalog reagents protocol`, {
    includeDomains: [...TAVILY_DOMAINS.supplier],
    maxResults: 5,
  }).catch(() => []);

  const materials: MaterialLine[] = (supplierCatalog[parsed.domain] ?? supplierCatalog.general).map((line, index) => ({
    name: line.name,
    supplier: line.supplier,
    catalogNumber: line.catalogNumber,
    quantity: line.quantity,
    estimatedUnitCostUsd: line.estimatedUnitCostUsd,
    purpose: supplierHits[index]?.url
      ? `${line.cues[0]}; verify availability and current price against ${supplierHits[index].url}`
      : line.cues[0],
    leadTime: line.leadTime ?? '1-2 weeks, confirm with supplier',
  }));

  const consumables =
    parsed.domain === 'general'
      ? []
      : supplierCatalog.general.map((line) => ({
          name: line.name,
          supplier: line.supplier,
          catalogNumber: line.catalogNumber,
          quantity: line.quantity,
          estimatedUnitCostUsd: line.estimatedUnitCostUsd,
          purpose: line.cues[0],
          leadTime: line.leadTime ?? '1-2 weeks, confirm with supplier',
        }));

  const allMaterials = [...materials, ...consumables];
  const materialTotal = allMaterials.reduce((sum, line) => sum + line.estimatedUnitCostUsd, 0);
  const labor = directLabor(parsed);
  const overhead = Math.round((materialTotal + labor.cost) * 0.18);
  const feedbackAdjustment = feedback.some((entry) =>
    entry.corrections.some((correction) => correction.section === 'budget' || correction.section === 'materials'),
  )
    ? 500
    : 0;

  const budget: BudgetLine[] = [
    {
      category: 'Reagents, standards, and biological materials',
      estimatedCostUsd: materialTotal,
      assumption: 'Supplier list prices or catalog-equivalent estimates; confirm before ordering',
    },
    {
      category: 'Labor',
      estimatedCostUsd: labor.cost,
      assumption: `${labor.hours} scientist/technician hours at a $75/hour blended CRO or academic core rate`,
    },
    {
      category: 'Instrument/core usage',
      estimatedCostUsd: parsed.domain === 'climate' ? 3500 : 1800,
      assumption: 'Assay readers, incubators, analytical chemistry, imaging, or potentiostat core recharge estimate',
    },
    {
      category: 'Contingency and overhead',
      estimatedCostUsd: overhead + feedbackAdjustment,
      assumption: '18% of direct materials and labor for shipping, failed lots, repeated calibration, and procurement overhead',
    },
  ];

  return { materials: allMaterials, budget };
}
