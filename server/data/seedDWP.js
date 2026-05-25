const { initializeDatabase, getDb } = require('../models/database');
const { v4: uuidv4 } = require('uuid');

initializeDatabase();
const db = getDb();

console.log('Seeding DWP Technology Stack questions...');

const questions = [
  // ==================== WPE (Work Place Engineering) ====================

  // Application Packaging
  { category: 'Technology', subcategory: 'DWP - Application Packaging', question_text: 'How mature is the application packaging process for enterprise deployment?', weight: 1.3, applicable_to: ['Application Packaging', 'Software Packaging'] },
  { category: 'Technology', subcategory: 'DWP - Application Packaging', question_text: 'Are packaging standards (MSI, MSIX, App-V) defined and consistently followed?', weight: 1.2, applicable_to: ['Application Packaging', 'Software Packaging'] },
  { category: 'Technology', subcategory: 'DWP - Application Packaging', question_text: 'Is there automated testing for packaged applications before deployment?', weight: 1.3, applicable_to: ['Application Packaging', 'Software Packaging'] },
  { category: 'Technology', subcategory: 'DWP - Application Packaging', question_text: 'How effective is the application compatibility testing process?', weight: 1.2, applicable_to: ['Application Packaging', 'Software Packaging'] },

  // Citrix / VDI / AVD / Workplace Virtualization
  { category: 'Technology', subcategory: 'DWP - Virtual Desktop', question_text: 'How well optimized is the virtual desktop infrastructure for user experience?', weight: 1.5, applicable_to: ['Citrix', 'VDI', 'AVD', 'Workplace Virtualization'] },
  { category: 'Technology', subcategory: 'DWP - Virtual Desktop', question_text: 'Is there capacity planning and auto-scaling for VDI/AVD environments?', weight: 1.3, applicable_to: ['Citrix', 'VDI', 'AVD', 'Workplace Virtualization', 'W365'] },
  { category: 'Technology', subcategory: 'DWP - Virtual Desktop', question_text: 'How effective is session management and user profile handling in the virtual environment?', weight: 1.2, applicable_to: ['Citrix', 'VDI', 'AVD', 'Workplace Virtualization'] },
  { category: 'Technology', subcategory: 'DWP - Virtual Desktop', question_text: 'Are GPU and multimedia redirection capabilities meeting user requirements?', weight: 1.0, applicable_to: ['Citrix', 'VDI', 'AVD', 'Workplace Virtualization'] },
  { category: 'Technology', subcategory: 'DWP - Virtual Desktop', question_text: 'How robust is the disaster recovery strategy for virtual desktop services?', weight: 1.3, applicable_to: ['Citrix', 'VDI', 'AVD', 'Workplace Virtualization', 'W365'] },
  { category: 'Technology', subcategory: 'DWP - Virtual Desktop', question_text: 'Is Windows 365 Cloud PC being leveraged for simplified desktop provisioning?', weight: 1.0, applicable_to: ['W365', 'AVD', 'Workplace Virtualization'] },

  // Imaging & Image Engineering
  { category: 'Technology', subcategory: 'DWP - Imaging', question_text: 'How standardized and automated is the OS imaging process?', weight: 1.3, applicable_to: ['Imaging Solution', 'Image Engineering', 'MDT - Image Management'] },
  { category: 'Technology', subcategory: 'DWP - Imaging', question_text: 'Are golden images regularly updated with security patches and driver updates?', weight: 1.5, applicable_to: ['Imaging Solution', 'Image Engineering', 'MDT - Image Management'] },
  { category: 'Technology', subcategory: 'DWP - Imaging', question_text: 'Is there a defined image lifecycle management process (build, test, deploy, retire)?', weight: 1.2, applicable_to: ['Imaging Solution', 'Image Engineering', 'MDT - Image Management'] },
  { category: 'Technology', subcategory: 'DWP - Imaging', question_text: 'How effective is zero-touch or lite-touch deployment for new devices?', weight: 1.3, applicable_to: ['Imaging Solution', 'Image Engineering', 'MDT - Image Management', 'Intune'] },

  // Endpoint Management (SCCM, Intune, JAMF, Big Fix, Tanium)
  { category: 'Technology', subcategory: 'DWP - Endpoint Management', question_text: 'How comprehensive is endpoint visibility and inventory accuracy?', weight: 1.5, applicable_to: ['SCCM', 'Intune', 'JAMF', 'Big Fix', 'Tanium', 'Workstation Management'] },
  { category: 'Technology', subcategory: 'DWP - Endpoint Management', question_text: 'Is patch compliance consistently above 95% across all managed endpoints?', weight: 1.5, applicable_to: ['SCCM', 'Intune', 'JAMF', 'Big Fix', 'Tanium', 'Workstation Management'] },
  { category: 'Technology', subcategory: 'DWP - Endpoint Management', question_text: 'How effective is software distribution and update management?', weight: 1.3, applicable_to: ['SCCM', 'Intune', 'JAMF', 'Big Fix', 'Tanium'] },
  { category: 'Technology', subcategory: 'DWP - Endpoint Management', question_text: 'Are compliance policies enforced and reported through the endpoint management platform?', weight: 1.3, applicable_to: ['SCCM', 'Intune', 'JAMF', 'Big Fix', 'Tanium'] },
  { category: 'Technology', subcategory: 'DWP - Endpoint Management', question_text: 'Is there real-time endpoint health monitoring and automated remediation?', weight: 1.2, applicable_to: ['SCCM', 'Intune', 'Tanium', 'Big Fix'] },
  { category: 'Technology', subcategory: 'DWP - Endpoint Management', question_text: 'How well is co-management (SCCM + Intune) implemented for hybrid scenarios?', weight: 1.2, applicable_to: ['SCCM', 'Intune'] },

  // Mac Management (JAMF)
  { category: 'Technology', subcategory: 'DWP - Mac Management', question_text: 'Is JAMF or equivalent MDM fully deployed for all macOS devices?', weight: 1.3, applicable_to: ['JAMF', 'MAC'] },
  { category: 'Technology', subcategory: 'DWP - Mac Management', question_text: 'Are macOS security policies (FileVault, Gatekeeper, XProtect) enforced centrally?', weight: 1.5, applicable_to: ['JAMF', 'MAC'] },
  { category: 'Technology', subcategory: 'DWP - Mac Management', question_text: 'How automated is macOS onboarding (DEP/ABM enrollment, pre-staged apps)?', weight: 1.2, applicable_to: ['JAMF', 'MAC'] },

  // Mobility & MDM (Airwatch, Enterprise Mobility Management)
  { category: 'Technology', subcategory: 'DWP - Mobility', question_text: 'How comprehensive is the mobile device management (MDM) coverage across all device types?', weight: 1.3, applicable_to: ['Airwatch', 'Mobility', 'Enterprise Mobility Management', 'Intune'] },
  { category: 'Technology', subcategory: 'DWP - Mobility', question_text: 'Are mobile application management (MAM) policies enforced for corporate data protection?', weight: 1.5, applicable_to: ['Airwatch', 'Mobility', 'Enterprise Mobility Management', 'Intune'] },
  { category: 'Technology', subcategory: 'DWP - Mobility', question_text: 'Is conditional access implemented to restrict unmanaged device access to corporate resources?', weight: 1.5, applicable_to: ['Airwatch', 'Mobility', 'Enterprise Mobility Management', 'Intune'] },
  { category: 'Technology', subcategory: 'DWP - Mobility', question_text: 'How effective is BYOD policy enforcement and containerization?', weight: 1.2, applicable_to: ['Airwatch', 'Mobility', 'Enterprise Mobility Management'] },

  // Print & File Services
  { category: 'Technology', subcategory: 'DWP - Print & File Services', question_text: 'Is print infrastructure modernized with secure print release and cloud printing?', weight: 1.0, applicable_to: ['Print & File Services'] },
  { category: 'Technology', subcategory: 'DWP - Print & File Services', question_text: 'Are file services migrated to cloud (OneDrive, SharePoint) or properly managed on-premises?', weight: 1.2, applicable_to: ['Print & File Services'] },
  { category: 'Technology', subcategory: 'DWP - Print & File Services', question_text: 'Is there centralized print management with usage tracking and cost allocation?', weight: 1.0, applicable_to: ['Print & File Services'] },

  // ==================== UMC (Unified Messaging & Collaboration) ====================

  // Email & Messaging (Exchange, SMTP, Dominio)
  { category: 'Technology', subcategory: 'DWP - Email & Messaging', question_text: 'How reliable and performant is the email messaging infrastructure?', weight: 1.5, applicable_to: ['MS Exchange', 'Email Workflow SMTP', 'Messaging Services', 'Dominio'] },
  { category: 'Technology', subcategory: 'DWP - Email & Messaging', question_text: 'Is email security (anti-spam, anti-phishing, DMARC/DKIM/SPF) fully implemented?', weight: 1.5, applicable_to: ['MS Exchange', 'Email Workflow SMTP', 'Messaging Services', 'MS Defender'] },
  { category: 'Technology', subcategory: 'DWP - Email & Messaging', question_text: 'Are email retention and compliance policies (legal hold, eDiscovery) properly configured?', weight: 1.3, applicable_to: ['MS Exchange', 'Email Workflow SMTP', 'M365 Suite', 'O365 Suite'] },
  { category: 'Technology', subcategory: 'DWP - Email & Messaging', question_text: 'Is there a migration strategy from on-premises Exchange to Exchange Online?', weight: 1.2, applicable_to: ['MS Exchange', 'M365 Suite', 'O365 Suite'] },
  { category: 'Technology', subcategory: 'DWP - Email & Messaging', question_text: 'How effective is the Right Fax or equivalent fax-to-email solution?', weight: 1.0, applicable_to: ['Right Fax', 'Email Workflow SMTP'] },

  // Collaboration (Teams, Zoom, SharePoint)
  { category: 'Technology', subcategory: 'DWP - Collaboration', question_text: 'How well adopted and governed is Microsoft Teams across the organization?', weight: 1.5, applicable_to: ['MS Teams', 'Collaboration Services', 'M365 Suite', 'O365 Suite'] },
  { category: 'Technology', subcategory: 'DWP - Collaboration', question_text: 'Are Teams governance policies (naming, lifecycle, guest access) defined and enforced?', weight: 1.3, applicable_to: ['MS Teams', 'M365 Suite', 'O365 Suite'] },
  { category: 'Technology', subcategory: 'DWP - Collaboration', question_text: 'How effective is the SharePoint Online/On-Premises content management strategy?', weight: 1.3, applicable_to: ['SharePoint', 'M365 Suite', 'O365 Suite', 'Collaboration Services'] },
  { category: 'Technology', subcategory: 'DWP - Collaboration', question_text: 'Is Zoom or equivalent video conferencing properly integrated and secured?', weight: 1.0, applicable_to: ['Zoom', 'Collaboration Services'] },
  { category: 'Technology', subcategory: 'DWP - Collaboration', question_text: 'How mature is the adoption of Power Platform (PowerApps, Power Automate) for citizen development?', weight: 1.2, applicable_to: ['PowerApps', 'M365 Suite', 'O365 Suite'] },

  // Active Directory & Identity
  { category: 'Technology', subcategory: 'DWP - Identity & Directory', question_text: 'How well maintained is Active Directory (OU structure, GPOs, stale objects)?', weight: 1.5, applicable_to: ['Active Directory', 'GPO'] },
  { category: 'Technology', subcategory: 'DWP - Identity & Directory', question_text: 'Is Azure AD / Entra ID hybrid join properly configured for cloud identity?', weight: 1.3, applicable_to: ['Active Directory', 'M365 Suite', 'O365 Suite'] },
  { category: 'Technology', subcategory: 'DWP - Identity & Directory', question_text: 'Are Group Policy Objects (GPOs) rationalized, documented, and regularly reviewed?', weight: 1.2, applicable_to: ['GPO', 'Active Directory'] },
  { category: 'Technology', subcategory: 'DWP - Identity & Directory', question_text: 'Is Conditional Access configured to enforce Zero Trust principles?', weight: 1.5, applicable_to: ['Active Directory', 'M365 Suite', 'O365 Suite', 'Intune'] },
  { category: 'Technology', subcategory: 'DWP - Identity & Directory', question_text: 'How effective is privileged access management for directory administrators?', weight: 1.5, applicable_to: ['Active Directory', 'GPO'] },

  // M365 / O365 Suite
  { category: 'Technology', subcategory: 'DWP - M365 Platform', question_text: 'How well is the M365 tenant configured for security (Secure Score, DLP, sensitivity labels)?', weight: 1.5, applicable_to: ['M365 Suite', 'O365 Suite', 'MS Defender'] },
  { category: 'Technology', subcategory: 'DWP - M365 Platform', question_text: 'Is Microsoft Defender for Office 365 fully deployed with safe links and safe attachments?', weight: 1.5, applicable_to: ['MS Defender', 'M365 Suite', 'O365 Suite'] },
  { category: 'Technology', subcategory: 'DWP - M365 Platform', question_text: 'Are M365 licensing tiers optimized for actual feature usage?', weight: 1.0, applicable_to: ['M365 Suite', 'O365 Suite'] },
  { category: 'Technology', subcategory: 'DWP - M365 Platform', question_text: 'How effective is the M365 change management process for new feature rollouts?', weight: 1.2, applicable_to: ['M365 Suite', 'O365 Suite'] },
  { category: 'Technology', subcategory: 'DWP - M365 Platform', question_text: 'Is data governance (retention, sensitivity labels, DLP) properly configured in M365?', weight: 1.3, applicable_to: ['M365 Suite', 'O365 Suite', 'MS Defender'] },

  // G-Suite
  { category: 'Technology', subcategory: 'DWP - G-Suite', question_text: 'Is Google Workspace security (2FA, DLP, admin controls) properly configured?', weight: 1.3, applicable_to: ['G-Suite'] },
  { category: 'Technology', subcategory: 'DWP - G-Suite', question_text: 'How well governed is data sharing and external collaboration in Google Workspace?', weight: 1.2, applicable_to: ['G-Suite'] },

  // Messaging & Collaboration (general)
  { category: 'Technology', subcategory: 'DWP - Messaging & Collaboration', question_text: 'Is there a unified communications strategy covering voice, video, messaging, and presence?', weight: 1.3, applicable_to: ['Messaging & Collaboration', 'Collaboration Services', 'MS Teams', 'Zoom'] },
  { category: 'Technology', subcategory: 'DWP - Messaging & Collaboration', question_text: 'How effective is the collaboration support model (Atmus or equivalent) for end-user issues?', weight: 1.0, applicable_to: ['Collaboration support Atmus', 'Collaboration Services'] },
  { category: 'Technology', subcategory: 'DWP - Messaging & Collaboration', question_text: 'Are collaboration tools integrated with ITSM for incident and request management?', weight: 1.2, applicable_to: ['Messaging & Collaboration', 'Collaboration Services', 'MS Teams'] },

  // Tanium (Endpoint Security & Visibility)
  { category: 'Technology', subcategory: 'DWP - Endpoint Security', question_text: 'Is Tanium or equivalent real-time endpoint visibility platform deployed across all assets?', weight: 1.3, applicable_to: ['Tanium'] },
  { category: 'Technology', subcategory: 'DWP - Endpoint Security', question_text: 'How effectively is Tanium used for threat hunting and incident response?', weight: 1.3, applicable_to: ['Tanium'] },
  { category: 'Technology', subcategory: 'DWP - Endpoint Security', question_text: 'Are Tanium modules (Patch, Deploy, Comply, Threat Response) fully utilized?', weight: 1.2, applicable_to: ['Tanium'] },

  // Process questions specific to DWP
  { category: 'Process', subcategory: 'DWP - Service Management', question_text: 'Is there a defined SLA framework for workplace services (VDI, email, collaboration)?', weight: 1.3, applicable_to: ['Citrix', 'VDI', 'AVD', 'MS Teams', 'MS Exchange', 'M365 Suite'] },
  { category: 'Process', subcategory: 'DWP - Service Management', question_text: 'How effective is the end-user experience monitoring and proactive issue resolution?', weight: 1.3, applicable_to: ['Citrix', 'VDI', 'AVD', 'W365', 'Tanium', 'SCCM', 'Intune'] },
  { category: 'Process', subcategory: 'DWP - Service Management', question_text: 'Is there a structured evergreen IT process for hardware and software lifecycle management?', weight: 1.2, applicable_to: ['Workstation Management', 'SCCM', 'Intune', 'JAMF'] },
  { category: 'Process', subcategory: 'DWP - Service Management', question_text: 'How well defined is the device provisioning and decommissioning workflow?', weight: 1.2, applicable_to: ['Imaging Solution', 'Image Engineering', 'MDT - Image Management', 'Intune', 'JAMF'] },

  // People questions specific to DWP
  { category: 'People', subcategory: 'DWP - Skills & Readiness', question_text: 'Does the DWP team have adequate skills in modern endpoint management (Intune, Autopilot)?', weight: 1.3, applicable_to: ['Intune', 'SCCM', 'JAMF', 'Workstation Management'] },
  { category: 'People', subcategory: 'DWP - Skills & Readiness', question_text: 'Is the team trained on M365 administration and security best practices?', weight: 1.3, applicable_to: ['M365 Suite', 'O365 Suite', 'MS Teams', 'MS Defender'] },
  { category: 'People', subcategory: 'DWP - Skills & Readiness', question_text: 'Are there dedicated specialists for collaboration platform governance?', weight: 1.0, applicable_to: ['MS Teams', 'SharePoint', 'Zoom', 'Collaboration Services'] },
];

const insert = db.prepare(`
  INSERT OR IGNORE INTO questions (id, category, subcategory, question_text, question_type, weight, maturity_level, applicable_to, tags)
  VALUES (?, ?, ?, ?, 'rating', ?, 'all', ?, ?)
`);

const insertAll = db.transaction((items) => {
  for (const item of items) {
    insert.run(
      uuidv4(),
      item.category,
      item.subcategory,
      item.question_text,
      item.weight,
      JSON.stringify(item.applicable_to || []),
      JSON.stringify(item.tags || [])
    );
  }
});

insertAll(questions);

console.log(`Seeded ${questions.length} DWP questions successfully!`);
console.log('Distribution:');
console.log(`  Technology: ${questions.filter(q => q.category === 'Technology').length}`);
console.log(`  Process: ${questions.filter(q => q.category === 'Process').length}`);
console.log(`  People: ${questions.filter(q => q.category === 'People').length}`);

process.exit(0);
