import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { CalculationResults } from '@/types/types';

export const exportToPDF = (results: CalculationResults) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(16);
  doc.text('Infrastructure Sizing Report', 20, 20);
  
  // Summary
  doc.setFontSize(12);
  doc.text('Summary', 20, 35);
  
  const summaryData = [
    ['Total DCs', results.total_dcs.toString()],
    ['Average Load per DC', `${Math.round(results.average_load_per_dc)} users`],
    ['Total DC RAM', `${results.total_dc_ram} GB`],
    ['Total DC CPU Cores', results.total_dc_cpu.toString()],
    ['Total DC Storage', `${results.total_dc_disk} GB`]
  ];
  
  doc.autoTable({
    startY: 40,
    head: [['Metric', 'Value']],
    body: summaryData,
    margin: { left: 20 }
  });
  
  // Site Distribution
  doc.text('Site Distribution', 20, doc.autoTable.previous.finalY + 15);
  
  const siteData = Object.entries(results.site_distribution).map(([site, count]) => [
    site,
    count.toString()
  ]);
  
  doc.autoTable({
    startY: doc.autoTable.previous.finalY + 20,
    head: [['Site', 'DCs']],
    body: siteData,
    margin: { left: 20 }
  });
  
  // DC Specifications
  doc.text('Domain Controller Specifications', 20, doc.autoTable.previous.finalY + 15);
  
  const dcSpecsData = [
    ['RAM', `${results.vertical_specs.ram_gb} GB`],
    ['CPU Cores', results.vertical_specs.cpu_cores.toString()],
    ['CPU Frequency', `${results.vertical_specs.cpu_freq_ghz} GHz`],
    ['Storage', `${results.vertical_specs.disk_gb} GB`],
    ['Storage Type', results.vertical_specs.disk_type],
    ['Network', `${results.vertical_specs.network_mbps} Mbps`]
  ];
  
  doc.autoTable({
    startY: doc.autoTable.previous.finalY + 20,
    head: [['Resource', 'Specification']],
    body: dcSpecsData,
    margin: { left: 20 }
  });
  
  // Subsystems
  if (Object.keys(results.subsystem_specs).length > 0) {
    doc.text('Subsystem Specifications', 20, doc.autoTable.previous.finalY + 15);
    
    const subsystemData = Object.entries(results.subsystem_specs).map(([name, specs]) => [
      name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' '),
      `${specs.ram_gb} GB`,
      specs.cpu_cores.toString(),
      `${specs.disk_gb} GB`,
      specs.disk_type
    ]);
    
    doc.autoTable({
      startY: doc.autoTable.previous.finalY + 20,
      head: [['Subsystem', 'RAM', 'CPU Cores', 'Storage', 'Storage Type']],
      body: subsystemData,
      margin: { left: 20 }
    });
  }
  
  // Warnings
  if (results.warnings.length > 0) {
    doc.text('Warnings', 20, doc.autoTable.previous.finalY + 15);
    
    const warningsData = results.warnings.map(warning => [warning]);
    
    doc.autoTable({
      startY: doc.autoTable.previous.finalY + 20,
      head: [['Warning Message']],
      body: warningsData,
      margin: { left: 20 }
    });
  }
  
  // Save the PDF
  doc.save('infrastructure-sizing-report.pdf');
};