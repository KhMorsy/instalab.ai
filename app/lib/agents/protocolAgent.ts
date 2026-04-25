import type { FeedbackEntry, LiteratureQc, ParsedQuestion, ProtocolStep } from '../types';
import { tavilySearch } from './tavily';

const protocolsDomains = [
  'protocols.io',
  'bio-protocol.org',
  'jove.com',
  'openwetware.org',
  'nature.com',
  'atcc.org',
  'addgene.org',
  'promega.com',
  'qiagen.com',
];

type DomainProtocolDetail = {
  overview: string;
  controls: string[];
  samplePlan: string;
  setup: string[];
  steps: Array<{
    id: string;
    title: string;
    duration: string;
    purpose: string;
    materials: string[];
    actions: string[];
    qc: string;
    safety: string;
    expectedOutput: string;
  }>;
};

function domainDetail(parsed: ParsedQuestion): DomainProtocolDetail {
  if (parsed.domain === 'climate') {
    return {
      overview:
        'Pilot a controlled H-cell bioelectrochemical system to quantify acetate production from CO2 by Sporomusa ovata at -400 mV vs SHE.',
      controls: [
        'Abiotic cathode with sterile medium and CO2 feed',
        'Open-circuit biotic control',
        'Killed-cell control',
        'Benchmark cathode potential or organism condition from the closest literature reference',
      ],
      samplePlan:
        'Run at least triplicate reactors per arm when equipment allows; for a feasibility demo, run duplicate reactors plus one abiotic and one open-circuit control.',
      setup: [
        'Confirm anaerobic handling capability, gas manifold, potentiostat availability, and calibrated Ag/AgCl reference electrode conversion to SHE.',
        'Prepare anaerobic mineral medium and pre-reduce overnight before inoculation.',
        'Precondition carbon cloth cathodes and assemble sterile H-cells with membrane-separated anode and cathode chambers.',
      ],
      steps: [
        {
          id: 'protocol-lock',
          title: 'Protocol lock, safety review, and acceptance criteria',
          duration: 'Day -5 to -3; 2-3 hours hands-on',
          purpose: 'Freeze the experimental design before procurement or reactor setup.',
          materials: ['Approved protocol template', 'risk assessment', 'statistical analysis worksheet'],
          actions: [
            'Define primary endpoint as acetate production rate normalized to catholyte volume and run time.',
            'Lock success threshold at the hypothesis target and define exclusion rules for contamination, electrode failure, or reference-electrode drift.',
            'Assign blinded reactor IDs and document control arms before setup.',
          ],
          qc: 'PI signs the protocol, reactor map, control list, and go/no-go criteria.',
          safety: 'Route anaerobic microbiology, pressurized gas, and electrical equipment risks through the local safety process.',
          expectedOutput: 'Signed protocol version with reactor map, endpoint definition, and analysis plan.',
        },
        {
          id: 'reactor-prep',
          title: 'Prepare anaerobic medium and electrochemical hardware',
          duration: 'Day -2 to -1; 4-6 hours hands-on plus overnight reduction',
          purpose: 'Create a stable sterile electrochemical environment before adding cells.',
          materials: ['H-cell reactors', 'carbon cloth cathodes', 'reference electrodes', 'anaerobic mineral medium', 'N2/CO2 gas'],
          actions: [
            'Cut carbon cloth to identical geometric area, rinse according to supplier guidance, and record electrode lot and area.',
            'Prepare mineral medium, dispense into cathode chambers, sparge with N2/CO2, add reducing agent if required by the organism protocol, and hold anaerobically overnight.',
            'Assemble H-cells aseptically, leak-test chambers, and connect working, counter, and reference electrodes.',
            'Record reference electrode type and calculate the setpoint equivalent for -400 mV vs SHE.',
          ],
          qc: 'Medium remains anaerobic, reactors pass leak check, and open-circuit potential is stable before inoculation.',
          safety: 'Use appropriate pressure relief and gas-cylinder restraints; disinfect all biological waste.',
          expectedOutput: 'Sterile, anaerobic, electrically connected reactors ready for baseline measurement.',
        },
        {
          id: 'baseline',
          title: 'Baseline electrochemical stabilization',
          duration: 'Day 0; 12-24 hours',
          purpose: 'Establish that the electrode system is stable before adding Sporomusa ovata.',
          materials: ['Potentiostat', 'calibrated reference electrode', 'sterile sampling syringes', 'pH meter'],
          actions: [
            'Hold reactors at the target potential or defined preconditioning potential according to the closest retrieved protocol.',
            'Record current every 1-5 minutes and inspect for unstable wiring, bubbles on the electrode, or reference drift.',
            'Collect baseline catholyte sample for acetate background, pH, and contamination check.',
          ],
          qc: 'Baseline current and pH remain within pre-defined ranges for at least 4 consecutive hours.',
          safety: 'Do not open anaerobic reactors outside the anaerobic workflow except through sterile sampling ports.',
          expectedOutput: 'Baseline current trace and pre-inoculation acetate measurement.',
        },
        {
          id: 'inoculation',
          title: 'Inoculate reactors and start treatment conditions',
          duration: 'Day 1; 2-3 hours hands-on',
          purpose: 'Introduce the biocatalyst under identical conditions across treatment reactors.',
          materials: ['Sporomusa ovata culture', 'anaerobic transfer supplies', 'OD600 cuvettes or cell-count method', 'sterile syringes'],
          actions: [
            'Confirm culture identity, growth phase, and absence of visible contamination.',
            'Normalize inoculum across all biotic reactors using OD600 or cell count.',
            'Transfer inoculum anaerobically into treatment reactors and add equivalent sterile medium volume to abiotic controls.',
            'Start the -400 mV vs SHE condition and record the exact start timestamp for rate calculations.',
          ],
          qc: 'Initial inoculum density varies by no more than 10% across biotic reactors.',
          safety: 'Follow organism-specific biosafety and anaerobic transfer SOPs.',
          expectedOutput: 'Treatment and control reactors started with documented inoculum density and timestamps.',
        },
        {
          id: 'sampling',
          title: 'Timed sampling for acetate and reactor health',
          duration: 'Day 1 onward; every 12-24 hours for 3-7 days',
          purpose: 'Quantify CO2 fixation output while monitoring reactor integrity.',
          materials: ['Sterile sampling syringes', 'HPLC or ion chromatography vials', 'pH strips or meter', 'sterility plates'],
          actions: [
            'Collect equal-volume catholyte samples at locked intervals and immediately replace with anaerobic sterile medium if volume compensation is required.',
            'Measure acetate by HPLC, ion chromatography, or validated enzymatic assay with standards spanning the expected range.',
            'Log current density, pH, gas condition, reactor temperature, and any visible biofilm formation at each sampling point.',
            'Run contamination checks on final samples or earlier if pH/current behavior is anomalous.',
          ],
          qc: 'Calibration curve R2 >= 0.98 and standards/bracketing controls pass before accepting acetate values.',
          safety: 'Treat all samples as biological material until inactivation/disposal is complete.',
          expectedOutput: 'Time-series acetate concentration, current trace, pH log, and contamination status.',
        },
        {
          id: 'analysis',
          title: 'Calculate production rate and go/no-go decision',
          duration: 'Final day plus 4-6 hours analysis',
          purpose: 'Determine whether the hypothesis threshold was achieved relative to controls.',
          materials: ['Raw instrument exports', 'analysis notebook', 'locked reactor map', 'statistics template'],
          actions: [
            'Subtract baseline and abiotic-control acetate where appropriate before rate calculation.',
            'Calculate mmol/L/day for each reactor using the linear production window and report mean, standard deviation, and confidence interval.',
            'Compare treatment rate against the benchmark/control condition and document whether the target improvement threshold was met.',
            'Review excluded runs against pre-locked criteria and attach raw chromatograms or assay plate exports.',
          ],
          qc: 'A second reviewer can reproduce every rate calculation from raw data and timestamps.',
          safety: 'Decontaminate reactors and dispose of cultures, electrodes, and media according to approved biological and chemical waste procedures.',
          expectedOutput: 'Go/no-go memo with acetate production rate, control comparison, deviations, and reproducible analysis file.',
        },
      ],
    };
  }

  if (parsed.domain === 'gut') {
    return {
      overview:
        'Run a controlled mouse probiotic intervention and quantify intestinal permeability with FITC-dextran plus tight-junction marker validation.',
      controls: ['Vehicle control', 'Untreated baseline where ethically feasible', 'Positive permeability control if approved'],
      samplePlan:
        'Use a power calculation before animal work; a pilot commonly uses balanced randomized groups with cage effects tracked explicitly.',
      setup: [
        'Confirm IACUC/local animal approval, randomization scheme, cage map, and humane endpoints.',
        'Prepare Lactobacillus rhamnosus GG dosing material and verify viable CFU before dosing.',
        'Prepare FITC-dextran standard curve and sample handling workflow before the endpoint day.',
      ],
      steps: [
        {
          id: 'animal-approval',
          title: 'Protocol approval, randomization, and cage map',
          duration: 'Pre-study; 1-2 days hands-on after approval',
          purpose: 'Lock the animal study design before intervention begins.',
          materials: ['Approved animal protocol', 'randomization table', 'cage cards', 'body-weight log'],
          actions: [
            'Define inclusion/exclusion criteria, sex/age/strain, acclimation duration, and group sizes.',
            'Randomize mice by cage and body weight; document blinding for sample analysis.',
            'Set the primary endpoint, secondary tight-junction readouts, and humane endpoints.',
          ],
          qc: 'Randomization table balances baseline weight and cage allocation across arms.',
          safety: 'Follow animal welfare, allergen, sharps, and biological sample handling SOPs.',
          expectedOutput: 'Locked cage map, dosing schedule, endpoint plan, and analysis plan.',
        },
        {
          id: 'probiotic-prep',
          title: 'Prepare and qualify probiotic dose',
          duration: 'Each dosing day; 60-90 minutes',
          purpose: 'Deliver a consistent viable Lactobacillus rhamnosus GG dose.',
          materials: ['L. rhamnosus GG culture', 'sterile vehicle', 'anaerobic/aerobic culture supplies as appropriate', 'CFU plates'],
          actions: [
            'Prepare dosing suspension using the protocol-specified vehicle and target CFU.',
            'Plate serial dilution or use validated rapid viability assay to confirm dose concentration.',
            'Record lot, passage, storage condition, preparation time, and discard time.',
          ],
          qc: 'Administer only dose preparations within the accepted CFU range and hold time.',
          safety: 'Use approved gavage or supplementation technique by trained personnel only.',
          expectedOutput: 'Daily dose preparation record with viable count confirmation.',
        },
        {
          id: 'intervention',
          title: 'Administer intervention for 4 weeks',
          duration: 'Weeks 1-4; daily or protocol-defined schedule',
          purpose: 'Expose treatment animals to the probiotic under controlled conditions.',
          materials: ['Dosing suspension', 'vehicle control', 'body-weight scale', 'clinical observation sheet'],
          actions: [
            'Dose treatment and control groups at the same time of day using identical handling order rotation.',
            'Record body weight, stool/clinical observations, missed doses, and cage-level events.',
            'Maintain feed, bedding, light cycle, and water access consistently across groups.',
          ],
          qc: 'Dose completion, animal health, and body-weight logs show no unapproved deviations.',
          safety: 'Pause and escalate according to humane endpoint criteria if distress or excessive weight loss occurs.',
          expectedOutput: 'Complete intervention log with compliance and health monitoring records.',
        },
        {
          id: 'fitc-assay',
          title: 'Run FITC-dextran permeability assay',
          duration: 'Endpoint day; 4-6 hours',
          purpose: 'Quantify gut barrier permeability as the primary readout.',
          materials: ['FITC-dextran 4 kDa', 'serum collection tubes', 'plate reader', 'FITC standards'],
          actions: [
            'Fast animals only if approved and required by the locked protocol.',
            'Administer FITC-dextran at the protocol-defined dose and record exact time for each animal.',
            'Collect blood at the locked interval, process serum protected from light, and read fluorescence with a standard curve.',
            'Run blanks, standards, duplicate technical reads, and plate-position controls.',
          ],
          qc: 'Standard curve R2 >= 0.98 and duplicate CV meets the locked assay acceptance criterion.',
          safety: 'Follow animal sampling volume limits and sharps disposal requirements.',
          expectedOutput: 'Serum FITC-dextran concentration per animal with assay QC summary.',
        },
        {
          id: 'marker-validation',
          title: 'Validate tight-junction mechanism',
          duration: 'Endpoint plus 1-3 days',
          purpose: 'Test whether permeability changes align with claudin-1 and occludin modulation.',
          materials: ['Intestinal tissue', 'anti-claudin-1 antibody', 'anti-occludin antibody', 'qPCR or western blot reagents'],
          actions: [
            'Collect intestinal segments using consistent anatomical landmarks.',
            'Preserve tissue for protein/RNA or histology according to the selected validation assay.',
            'Quantify claudin-1 and occludin using normalized western blot, immunostaining, or qPCR readout.',
          ],
          qc: 'Housekeeping controls, staining controls, or loading controls pass before interpretation.',
          safety: 'Handle tissues as biological specimens and use chemical fixatives in appropriate containment.',
          expectedOutput: 'Mechanistic marker dataset linked to each animal and treatment arm.',
        },
        {
          id: 'analysis',
          title: 'Analyze permeability reduction and report decision',
          duration: '2-4 hours analysis plus review',
          purpose: 'Determine if the intervention met the specified permeability reduction threshold.',
          materials: ['Blinded dataset', 'analysis script/notebook', 'locked exclusion criteria'],
          actions: [
            'Unblind only after QC flags and exclusions are locked.',
            'Compare treatment versus control using the pre-specified statistical model and include cage/sex covariates if planned.',
            'Report effect size, confidence interval, p-value where appropriate, and whether the reduction threshold was met.',
          ],
          qc: 'Independent reviewer reproduces the analysis from raw fluorescence and metadata files.',
          safety: 'Archive raw animal records and sample chain-of-custody according to institutional requirements.',
          expectedOutput: 'Final report with permeability effect size, tight-junction validation, and go/no-go recommendation.',
        },
      ],
    };
  }

  if (parsed.domain === 'cell') {
    return {
      overview:
        'Compare trehalose-containing freezing medium against the standard DMSO cryopreservation condition for post-thaw HeLa viability.',
      controls: ['Standard DMSO freezing medium', 'Untreated pre-freeze viability baseline', 'No-cell blank for viability assay'],
      samplePlan:
        'Run at least three independent freeze/thaw batches with technical replicate viability reads per condition.',
      setup: [
        'Confirm HeLa culture identity, mycoplasma status, passage number, and baseline viability.',
        'Prepare freezing media fresh, label cryovials by blinded condition, and pre-cool controlled-rate freezing container.',
      ],
      steps: [
        {
          id: 'cell-qc',
          title: 'Cell culture qualification',
          duration: 'Day -2 to 0; 1-2 passages',
          purpose: 'Start the comparison from healthy, comparable cells.',
          materials: ['HeLa cells', 'complete growth medium', 'mycoplasma test', 'cell counter'],
          actions: [
            'Culture cells in log-phase growth and avoid over-confluence before harvest.',
            'Confirm mycoplasma-negative status or recent valid test record.',
            'Record passage number, confluence, morphology, and pre-freeze viability.',
          ],
          qc: 'Pre-freeze viability is at least 90% and morphology is typical for the line.',
          safety: 'Handle human-derived cell lines under approved BSL-2 practices.',
          expectedOutput: 'Qualified cell batch ready for randomized freezing conditions.',
        },
        {
          id: 'media-prep',
          title: 'Prepare freezing media and randomize vials',
          duration: 'Day 0; 60-90 minutes',
          purpose: 'Create blinded, matched cryopreservation conditions.',
          materials: ['Trehalose', 'DMSO cell culture grade', 'serum or defined supplement', 'cryovials'],
          actions: [
            'Prepare standard DMSO control medium and trehalose test medium according to locked concentrations.',
            'Filter sterilize if compatible and label vials using blinded condition codes.',
            'Pre-chill media and freezing supplies to reduce handling variability.',
          ],
          qc: 'Osmolality, pH, appearance, and label map are recorded before cell suspension.',
          safety: 'Use gloves and eye protection when handling DMSO and sterile reagents.',
          expectedOutput: 'Matched coded freezing media and vial map.',
        },
        {
          id: 'freeze',
          title: 'Freeze cells under controlled-rate conditions',
          duration: 'Day 0; 2 hours hands-on plus overnight cooling',
          purpose: 'Apply test and control cryoprotectants with identical thermal history.',
          materials: ['Controlled-rate freezing container', 'cryovials', 'cell suspension', 'isopropanol if required'],
          actions: [
            'Harvest cells gently, count, and normalize density across all conditions.',
            'Mix cell suspension with each freezing medium using identical timing from reagent exposure to freezer placement.',
            'Place vials in controlled-rate container at -80 C overnight before transfer to liquid nitrogen or proceed according to locked protocol.',
          ],
          qc: 'Cell density differs by no more than 10% across vials and timing is recorded for each condition.',
          safety: 'Use cryogenic PPE for ultra-cold storage and avoid sealed-vial pressure hazards.',
          expectedOutput: 'Frozen replicate vials with documented cooling profile and condition codes.',
        },
        {
          id: 'thaw',
          title: 'Thaw and recover cells',
          duration: 'Post-storage day; 2-4 hours',
          purpose: 'Assess immediate and early recovery viability.',
          materials: ['37 C water bath', 'complete medium', 'centrifuge', 'culture plates'],
          actions: [
            'Thaw vials rapidly using the same timing and operator workflow for all conditions.',
            'Dilute cryoprotectant consistently, wash if required by protocol, and seed equal viable cell targets.',
            'Capture immediate post-thaw viability and optionally 24-hour attachment/recovery viability.',
          ],
          qc: 'Blank and positive viability controls pass, and replicate handling times remain within locked tolerance.',
          safety: 'Wear face protection for cryovial thawing and decontaminate water bath contact surfaces.',
          expectedOutput: 'Immediate and recovery viability dataset by coded condition.',
        },
        {
          id: 'viability-readout',
          title: 'Measure viability and recovery phenotype',
          duration: 'Same day and 24 hours',
          purpose: 'Determine whether trehalose improves survival relative to standard DMSO.',
          materials: ['Trypan blue or equivalent viability assay', 'plate reader or cell counter', 'microscope'],
          actions: [
            'Run viability assay in technical replicates and inspect morphology/attachment.',
            'Normalize viability to pre-freeze baseline and compare against DMSO control.',
            'Record any precipitation, osmotic stress morphology, or delayed recovery phenotype.',
          ],
          qc: 'Technical replicate CV meets assay acceptance criterion and operator remains blinded to condition.',
          safety: 'Dispose of human cell culture waste as biohazardous material.',
          expectedOutput: 'Viability and recovery table with replicate-level QC.',
        },
        {
          id: 'analysis',
          title: 'Analyze effect size and decide next optimization',
          duration: '2-3 hours',
          purpose: 'Determine whether the viability improvement threshold was achieved.',
          materials: ['Blinded vial map', 'raw viability exports', 'analysis notebook'],
          actions: [
            'Unblind after QC review and calculate percentage-point difference versus DMSO.',
            'Use paired or batch-aware statistics across independent freeze/thaw runs.',
            'Identify whether concentration optimization or osmolarity adjustment is needed before scale-up.',
          ],
          qc: 'Independent reviewer reproduces viability normalization and statistical comparison.',
          safety: 'Archive raw files and condition map without exposing ambiguous labels.',
          expectedOutput: 'Decision memo with effect size, confidence interval, and recommended next condition.',
        },
      ],
    };
  }

  if (parsed.domain === 'diagnostics') {
    return {
      overview:
        'Build and validate a paper-based electrochemical CRP biosensor against an ELISA-like sensitivity benchmark in whole blood.',
      controls: ['Blank electrode', 'isotype or non-specific antibody electrode', 'CRP standards', 'matrix-matched whole-blood controls'],
      samplePlan:
        'Run calibration standards across and below the target concentration, plus replicate whole-blood matrix samples and negative controls.',
      setup: [
        'Define electrode chemistry, blocking reagent, sample volume, incubation time, and electrochemical readout.',
        'Prepare CRP standards and whole-blood matrix controls before functionalizing test electrodes.',
      ],
      steps: [
        {
          id: 'design-lock',
          title: 'Lock assay design and acceptance criteria',
          duration: 'Day -2; 2-3 hours',
          purpose: 'Define the diagnostic performance target before fabrication.',
          materials: ['Assay design worksheet', 'CRP standard curve plan', 'electrode map'],
          actions: [
            'Define the target limit of detection, 10-minute readout window, and allowable sample volume.',
            'Map electrode conditions, antibody concentration series, blocking conditions, and controls.',
            'Set acceptance criteria for calibration, blank signal, and matrix interference.',
          ],
          qc: 'Reviewer approves electrode map and calibration range before wet work.',
          safety: 'Treat blood matrix materials as potentially infectious unless certified otherwise.',
          expectedOutput: 'Locked assay map with standards, controls, and readout timing.',
        },
        {
          id: 'functionalize',
          title: 'Functionalize paper/electrode surface with anti-CRP antibody',
          duration: 'Day -1; 3-5 hours plus drying/blocking',
          purpose: 'Create reproducible CRP capture surfaces.',
          materials: ['Screen-printed electrodes', 'anti-CRP antibody', 'crosslinker or adsorption buffer', 'blocking buffer'],
          actions: [
            'Prepare antibody working solution at locked concentration and keep on ice if required.',
            'Apply identical volume to each electrode capture zone and incubate under controlled humidity.',
            'Block non-specific binding sites, rinse gently, dry or store under the chosen validated condition.',
          ],
          qc: 'Randomly inspect electrodes for complete wetting and reject visibly damaged or unevenly coated devices.',
          safety: 'Use PPE for biological reagents and dispose of antibody/crosslinker waste according to SDS.',
          expectedOutput: 'Functionalized electrode batch with lot, concentration, and incubation metadata.',
        },
        {
          id: 'calibration',
          title: 'Run CRP calibration curve in buffer and blood matrix',
          duration: 'Day 0; 4-6 hours',
          purpose: 'Verify analytical range and matrix effects before unknown samples.',
          materials: ['CRP protein standard', 'whole-blood matrix', 'electrochemical reader', 'wash buffer'],
          actions: [
            'Prepare serial CRP standards spanning below 0.5 mg/L through the expected clinical range.',
            'Apply standards to functionalized electrodes using the locked 10-minute incubation/readout workflow.',
            'Measure electrochemical response with identical scan parameters and blank subtraction.',
          ],
          qc: 'Calibration curve is monotonic, blank signal is stable, and low-end standards are distinguishable from blank.',
          safety: 'Follow bloodborne-pathogen handling practices for matrix samples.',
          expectedOutput: 'Buffer and matrix calibration curves with provisional LOD.',
        },
        {
          id: 'specificity',
          title: 'Assess specificity and interference',
          duration: 'Day 0-1; 3-4 hours',
          purpose: 'Test whether non-specific binding or blood components confound CRP detection.',
          materials: ['Non-specific antibody controls', 'interferent panel if available', 'matrix controls'],
          actions: [
            'Run no-antigen, non-specific antibody, and high-background matrix controls.',
            'Challenge the sensor with likely interferents selected by the scientific team.',
            'Compare response slopes and blank-corrected signal against CRP-specific electrodes.',
          ],
          qc: 'Non-specific and blank controls remain below the locked false-positive signal threshold.',
          safety: 'Handle all matrix-containing samples in approved containment.',
          expectedOutput: 'Specificity table with interference notes and failed conditions flagged.',
        },
        {
          id: 'rapid-readout',
          title: 'Validate 10-minute whole-blood readout',
          duration: 'Day 1; 4-6 hours',
          purpose: 'Confirm the target workflow without sample preprocessing.',
          materials: ['Whole-blood CRP-spiked samples', 'functionalized electrodes', 'timer', 'portable potentiostat'],
          actions: [
            'Apply unprocessed whole-blood samples directly to the sensor using the locked sample volume.',
            'Start timer at sample contact and complete readout within the 10-minute window.',
            'Run replicate low-concentration samples near 0.5 mg/L and compare against calibration model.',
          ],
          qc: 'Replicates near the decision threshold meet precision criteria and classify correctly versus controls.',
          safety: 'Use splash protection and disinfect work surfaces after blood handling.',
          expectedOutput: 'Whole-blood performance dataset with time-to-result verification.',
        },
        {
          id: 'analysis',
          title: 'Calculate sensitivity, LOD, precision, and go/no-go',
          duration: 'Day 1-2; 3-5 hours',
          purpose: 'Decide whether the prototype meets the ELISA-like sensitivity target.',
          materials: ['Raw electrochemical exports', 'calibration notebook', 'acceptance checklist'],
          actions: [
            'Calculate LOD using the locked blank/standard method and report confidence intervals where possible.',
            'Estimate intra-batch precision, matrix bias, false-positive control behavior, and time-to-result.',
            'Compare performance to the target threshold and list required optimization steps.',
          ],
          qc: 'Analysis can be reproduced from raw reader files and electrode metadata.',
          safety: 'Archive de-identified sample metadata and dispose of used sensors as biohazardous sharps/solid waste if applicable.',
          expectedOutput: 'Prototype validation report with LOD, precision, matrix effect, and decision recommendation.',
        },
      ],
    };
  }

  return {
    overview: `Run a controlled feasibility study to test whether ${parsed.intervention} changes ${parsed.outcome}.`,
    controls: ['Negative control', 'Vehicle or baseline control', 'Positive or benchmark control where available'],
    samplePlan:
      'Use at least three independent biological or process replicates for a pilot and increase sample size after variance is measured.',
    setup: [
      'Lock intervention levels, control conditions, endpoint timing, and exclusion criteria.',
      'Confirm critical reagent identity, storage, expiration, and instrument calibration.',
    ],
    steps: [
      {
        id: 'protocol-lock',
        title: 'Lock design, controls, and acceptance criteria',
        duration: 'Day -3 to -1',
        purpose: 'Convert the hypothesis into an executable protocol.',
        materials: ['Protocol template', 'randomization plan', 'acceptance checklist'],
        actions: [
          'Define primary endpoint, intervention levels, control conditions, and go/no-go criteria.',
          'Assign sample IDs and lock exclusion criteria before starting wet work.',
          'Review biosafety, ethics, and procurement constraints.',
        ],
        qc: 'Protocol and acceptance criteria are signed before execution.',
        safety: 'Follow local safety review for the experimental system.',
        expectedOutput: 'Approved protocol and execution checklist.',
      },
      {
        id: 'materials-qc',
        title: 'Receive and qualify critical materials',
        duration: 'Day 0',
        purpose: 'Ensure inputs are traceable and suitable for use.',
        materials: ['Critical reagents', 'certificates of analysis', 'storage logs'],
        actions: [
          'Record lot numbers, expiry dates, supplier conditions, and storage temperatures.',
          'Run identity or performance checks for critical biological or chemical inputs.',
          'Reject or quarantine materials with missing traceability.',
        ],
        qc: 'All critical inputs pass incoming QC.',
        safety: 'Handle reagents according to SDS and local SOPs.',
        expectedOutput: 'Qualified material list and lot traceability record.',
      },
      {
        id: 'baseline',
        title: 'Establish baseline and controls',
        duration: 'Day 1',
        purpose: 'Measure starting state and control behavior.',
        materials: ['Control samples', 'assay reagents', 'instrument calibration standards'],
        actions: [
          'Prepare negative, vehicle/baseline, and positive controls.',
          'Measure baseline endpoint values before intervention.',
          'Confirm instrument calibration and assay blank behavior.',
        ],
        qc: 'Baseline variability is within the pre-defined range.',
        safety: 'Use containment appropriate for the model system.',
        expectedOutput: 'Baseline dataset and passing control values.',
      },
      {
        id: 'intervention',
        title: 'Apply intervention under controlled conditions',
        duration: 'Day 1 onward',
        purpose: 'Execute the experimental treatment consistently.',
        materials: ['Intervention material', 'sample tracking sheet', 'environmental log'],
        actions: [
          'Apply intervention levels and control treatments using randomized order.',
          'Maintain identical incubation, handling, and sampling conditions across arms.',
          'Record deviations, timing, operator, and environmental conditions.',
        ],
        qc: 'No critical deviations in treatment timing or handling.',
        safety: 'Stop and escalate if predefined hazard or welfare triggers occur.',
        expectedOutput: 'Complete intervention record and deviation log.',
      },
      {
        id: 'endpoint',
        title: 'Measure primary endpoint',
        duration: 'Endpoint window',
        purpose: 'Generate the outcome data needed to test the hypothesis.',
        materials: ['Endpoint assay kit or instrument', 'standards', 'sample plate map'],
        actions: [
          'Run endpoint assay with blanks, standards, and technical replicates.',
          'Protect samples from known degradation conditions.',
          'Export raw instrument data before any manual transformation.',
        ],
        qc: 'Calibration and control samples meet locked acceptance criteria.',
        safety: 'Dispose of assay waste according to biological/chemical classification.',
        expectedOutput: 'Raw and QC-filtered endpoint dataset.',
      },
      {
        id: 'analysis',
        title: 'Analyze result and issue go/no-go',
        duration: 'Analysis day',
        purpose: 'Determine whether the hypothesis threshold was met.',
        materials: ['Raw data exports', 'analysis notebook', 'locked protocol'],
        actions: [
          'Apply locked exclusions and statistical comparison.',
          'Report effect size, uncertainty, and whether the success threshold was achieved.',
          'List optimization recommendations before any scale-up.',
        ],
        qc: 'Independent reviewer reproduces the analysis from raw data.',
        safety: 'Archive records according to institutional data governance.',
        expectedOutput: 'Go/no-go report with reproducible analysis.',
      },
    ],
  };
}

function templateFor(parsed: ParsedQuestion, feedback: FeedbackEntry[]): ProtocolStep[] {
  const feedbackNote = feedback[0]?.corrections[0]?.correction;
  const memoryClause = feedbackNote ? ` Incorporate prior expert correction: ${feedbackNote}` : '';
  const detail = domainDetail(parsed);

  return detail.steps.map((step, index) => ({
    id: step.id,
    stepNumber: index + 1,
    title: step.title,
    duration: step.duration,
    estimatedTime: step.duration,
    inputs: step.materials,
    equipment: detail.setup,
    method: [step.purpose, ...step.actions].join(' '),
    actions: step.actions,
    qc: step.qc,
    safety: step.safety,
    notes: [
      index === 0 ? `${detail.overview}${memoryClause}` : step.purpose,
      `Sample plan: ${detail.samplePlan}`,
      `Controls: ${detail.controls.join(', ')}`,
      `Expected output: ${step.expectedOutput}`,
    ],
    sources: ['Institutional SOP and domain protocol repositories'],
  }));
}

export async function runProtocolAgent(
  parsed: ParsedQuestion,
  qc: LiteratureQc,
  feedback: FeedbackEntry[],
): Promise<ProtocolStep[]> {
  const queries = [
    `${parsed.domain} ${parsed.modelSystem} ${parsed.intervention} protocol`,
    `${parsed.outcome} ${parsed.modelSystem} assay protocol`,
    `${parsed.domain} standard operating protocol`,
  ].filter(Boolean);

  const retrieved = (
    await Promise.all(
      queries.map((query) =>
        tavilySearch(query, {
          maxResults: 3,
          includeDomains: protocolsDomains,
          searchDepth: 'advanced',
        }).catch(() => []),
      ),
    )
  ).flat();

  const uniqueSources = Array.from(new Map([...qc.references, ...retrieved].map((item) => [item.url, item])).values());
  return templateFor(parsed, feedback).map((step, index) => {
    const source = uniqueSources[index % Math.max(uniqueSources.length, 1)];
    return source ? { ...step, sources: [...step.sources, `${source.title} (${source.url})`] } : step;
  });
}
