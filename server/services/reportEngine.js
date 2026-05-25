/**
 * Enterprise Report Generation Engine
 * Generates comprehensive reports with recommendations and action plans
 */

function generateReport(assessment, responses) {
  const scores = calculateDetailedScores(responses);
  const maturityLevel = getMaturityLevel(assessment.overall_score);
  const recommendations = generateRecommendations(scores, assessment);
  const actionPlan = generate306090Plan(scores, recommendations, assessment);
  const executiveSummary = generateExecutiveSummary(assessment, scores, maturityLevel);
  
  return {
    data: {
      scores,
      maturityLevel,
      categoryBreakdown: scores.categoryBreakdown,
      subcategoryBreakdown: scores.subcategoryBreakdown,
      gaps: identifyGaps(scores),
      strengths: identifyStrengths(scores),
      riskAreas: identifyRisks(scores, assessment)
    },
    recommendations,
    actionPlan,
    executiveSummary
  };
}

function calculateDetailedScores(responses) {
  const categoryBreakdown = {};
  const subcategoryBreakdown = {};
  
  responses.forEach(r => {
    const cat = r.category.toLowerCase();
    const subcat = r.subcategory;
    const score = parseFloat(r.score) || 0;
    const weight = parseFloat(r.weight) || 1.0;
    
    if (!categoryBreakdown[cat]) {
      categoryBreakdown[cat] = { scores: [], totalWeight: 0, avgScore: 0 };
    }
    categoryBreakdown[cat].scores.push(score);
    categoryBreakdown[cat].totalWeight += weight;
    
    const subKey = `${cat}|${subcat}`;
    if (!subcategoryBreakdown[subKey]) {
      subcategoryBreakdown[subKey] = { category: cat, subcategory: subcat, scores: [], avgScore: 0 };
    }
    subcategoryBreakdown[subKey].scores.push(score);
  });
  
  // Calculate averages
  Object.values(categoryBreakdown).forEach(cat => {
    cat.avgScore = cat.scores.length > 0 
      ? Math.round((cat.scores.reduce((a, b) => a + b, 0) / cat.scores.length) * 100) / 100
      : 0;
  });
  
  Object.values(subcategoryBreakdown).forEach(sub => {
    sub.avgScore = sub.scores.length > 0
      ? Math.round((sub.scores.reduce((a, b) => a + b, 0) / sub.scores.length) * 100) / 100
      : 0;
  });
  
  return { categoryBreakdown, subcategoryBreakdown };
}

function getMaturityLevel(score) {
  if (score >= 9) return { level: 5, name: 'Optimizing', description: 'Continuous improvement with industry-leading practices' };
  if (score >= 7) return { level: 4, name: 'Managed', description: 'Measured and controlled processes with proactive management' };
  if (score >= 5) return { level: 3, name: 'Defined', description: 'Standardized processes across the organization' };
  if (score >= 3) return { level: 2, name: 'Repeatable', description: 'Basic processes established but inconsistently applied' };
  return { level: 1, name: 'Initial', description: 'Ad hoc processes with minimal documentation' };
}

function identifyGaps(scores) {
  const gaps = [];
  Object.entries(scores.subcategoryBreakdown).forEach(([key, data]) => {
    if (data.avgScore < 5) {
      gaps.push({
        area: data.subcategory,
        category: data.category,
        score: data.avgScore,
        severity: data.avgScore < 3 ? 'critical' : 'significant',
        description: `${data.subcategory} in ${data.category} is significantly below maturity expectations`
      });
    }
  });
  return gaps.sort((a, b) => a.score - b.score);
}

function identifyStrengths(scores) {
  const strengths = [];
  Object.entries(scores.subcategoryBreakdown).forEach(([key, data]) => {
    if (data.avgScore >= 7) {
      strengths.push({
        area: data.subcategory,
        category: data.category,
        score: data.avgScore,
        description: `Strong maturity in ${data.subcategory} (${data.category})`
      });
    }
  });
  return strengths.sort((a, b) => b.score - a.score);
}

function identifyRisks(scores, assessment) {
  const risks = [];
  const gaps = identifyGaps(scores);
  
  gaps.forEach(gap => {
    if (gap.severity === 'critical') {
      risks.push({
        risk: `Critical gap in ${gap.area}`,
        impact: 'High',
        likelihood: 'High',
        category: gap.category,
        mitigation: `Immediate attention required to establish baseline ${gap.area} capabilities`
      });
    }
  });
  
  // Technology-specific risks
  if (scores.categoryBreakdown.technology && scores.categoryBreakdown.technology.avgScore < 5) {
    risks.push({
      risk: 'Technology infrastructure below industry standards',
      impact: 'High',
      likelihood: 'Medium',
      category: 'technology',
      mitigation: 'Develop technology modernization roadmap with phased implementation'
    });
  }
  
  // People risks
  if (scores.categoryBreakdown.people && scores.categoryBreakdown.people.avgScore < 5) {
    risks.push({
      risk: 'Skills and organizational capability gaps',
      impact: 'High',
      likelihood: 'High',
      category: 'people',
      mitigation: 'Invest in training programs and consider strategic hiring'
    });
  }
  
  return risks;
}

function generateRecommendations(scores, assessment) {
  const recommendations = [];
  const gaps = identifyGaps(scores);
  
  // People recommendations
  if (scores.categoryBreakdown.people) {
    const peopleScore = scores.categoryBreakdown.people.avgScore;
    if (peopleScore < 4) {
      recommendations.push({
        priority: 'critical',
        category: 'people',
        title: 'Establish IT Governance & Skills Framework',
        description: 'Define roles, responsibilities, and required competencies. Implement structured training programs.',
        effort: 'High',
        impact: 'High',
        timeline: '0-90 days'
      });
    }
    if (peopleScore < 6) {
      recommendations.push({
        priority: 'high',
        category: 'people',
        title: 'Develop Knowledge Management Program',
        description: 'Create documentation standards, establish mentoring programs, and implement cross-training initiatives.',
        effort: 'Medium',
        impact: 'High',
        timeline: '30-90 days'
      });
    }
    if (peopleScore < 8) {
      recommendations.push({
        priority: 'medium',
        category: 'people',
        title: 'Enhance Team Collaboration & Communication',
        description: 'Implement collaboration tools, establish regular knowledge sharing sessions, and create centers of excellence.',
        effort: 'Medium',
        impact: 'Medium',
        timeline: '60-180 days'
      });
    }
  }
  
  // Process recommendations
  if (scores.categoryBreakdown.process) {
    const processScore = scores.categoryBreakdown.process.avgScore;
    if (processScore < 4) {
      recommendations.push({
        priority: 'critical',
        category: 'process',
        title: 'Implement ITSM Foundation',
        description: 'Establish incident, change, and problem management processes. Adopt ITIL framework basics.',
        effort: 'High',
        impact: 'High',
        timeline: '0-60 days'
      });
    }
    if (processScore < 6) {
      recommendations.push({
        priority: 'high',
        category: 'process',
        title: 'Standardize & Document Processes',
        description: 'Create process documentation, implement workflow automation, establish SLAs and KPIs.',
        effort: 'High',
        impact: 'High',
        timeline: '30-120 days'
      });
    }
    if (processScore < 8) {
      recommendations.push({
        priority: 'medium',
        category: 'process',
        title: 'Implement Continuous Improvement Framework',
        description: 'Establish regular process reviews, implement metrics-driven improvement, adopt DevOps practices.',
        effort: 'Medium',
        impact: 'High',
        timeline: '60-180 days'
      });
    }
  }
  
  // Technology recommendations
  if (scores.categoryBreakdown.technology) {
    const techScore = scores.categoryBreakdown.technology.avgScore;
    if (techScore < 4) {
      recommendations.push({
        priority: 'critical',
        category: 'technology',
        title: 'Address Critical Infrastructure Gaps',
        description: 'Implement basic monitoring, backup solutions, and security controls. Address single points of failure.',
        effort: 'High',
        impact: 'Critical',
        timeline: '0-30 days'
      });
    }
    if (techScore < 6) {
      recommendations.push({
        priority: 'high',
        category: 'technology',
        title: 'Modernize Infrastructure & Security',
        description: 'Upgrade aging systems, implement comprehensive security framework, enhance disaster recovery capabilities.',
        effort: 'High',
        impact: 'High',
        timeline: '30-120 days'
      });
    }
    if (techScore < 8) {
      recommendations.push({
        priority: 'medium',
        category: 'technology',
        title: 'Optimize & Automate Technology Operations',
        description: 'Implement infrastructure-as-code, enhance automation, adopt cloud-native architectures where appropriate.',
        effort: 'High',
        impact: 'High',
        timeline: '60-180 days'
      });
    }
  }
  
  // Add gap-specific recommendations
  gaps.slice(0, 5).forEach(gap => {
    recommendations.push({
      priority: gap.severity === 'critical' ? 'critical' : 'high',
      category: gap.category,
      title: `Address ${gap.area} Gap`,
      description: `Current maturity: ${gap.score}/5. ${gap.description}. Requires focused improvement plan.`,
      effort: 'Medium',
      impact: 'High',
      timeline: gap.severity === 'critical' ? '0-30 days' : '30-90 days'
    });
  });
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
  });
}

function generate306090Plan(scores, recommendations, assessment) {
  const plan = {
    thirtyDays: {
      title: 'First 30 Days - Quick Wins & Critical Fixes',
      objectives: [
        'Address critical security and infrastructure vulnerabilities',
        'Establish baseline measurements and KPIs',
        'Quick win implementations for immediate value',
        'Stakeholder alignment and communication plan'
      ],
      actions: [],
      expectedOutcomes: [
        'Critical vulnerabilities addressed',
        'Baseline metrics established',
        'Stakeholder buy-in secured',
        'Quick wins delivered for credibility'
      ]
    },
    sixtyDays: {
      title: '30-60 Days - Foundation Building',
      objectives: [
        'Implement core process improvements',
        'Begin skills development programs',
        'Deploy priority technology upgrades',
        'Establish governance frameworks'
      ],
      actions: [],
      expectedOutcomes: [
        'Core processes documented and standardized',
        'Training programs launched',
        'Key technology upgrades deployed',
        'Governance structure operational'
      ]
    },
    ninetyDays: {
      title: '60-90 Days - Optimization & Scale',
      objectives: [
        'Measure and report on improvements',
        'Scale successful initiatives',
        'Implement automation and optimization',
        'Plan next phase of transformation'
      ],
      actions: [],
      expectedOutcomes: [
        'Measurable improvement in maturity scores',
        'Automated processes reducing manual effort',
        'Organization-wide adoption of improvements',
        'Clear roadmap for continued growth'
      ]
    }
  };
  
  // Distribute recommendations into timeline phases
  recommendations.forEach(rec => {
    const action = {
      title: rec.title,
      description: rec.description,
      category: rec.category,
      effort: rec.effort,
      priority: rec.priority
    };
    
    if (rec.priority === 'critical' || rec.timeline.startsWith('0-')) {
      plan.thirtyDays.actions.push(action);
    } else if (rec.timeline.includes('30') || rec.timeline.includes('60')) {
      plan.sixtyDays.actions.push(action);
    } else {
      plan.ninetyDays.actions.push(action);
    }
  });
  
  // Ensure each phase has actions
  if (plan.thirtyDays.actions.length === 0) {
    plan.thirtyDays.actions.push({
      title: 'Assessment Review & Planning',
      description: 'Review assessment findings, prioritize improvements, and develop detailed implementation plan',
      category: 'general',
      effort: 'Low',
      priority: 'high'
    });
  }
  
  return plan;
}

function generateExecutiveSummary(assessment, scores, maturityLevel) {
  const overallScore = assessment.overall_score || 0;
  const overallPct = (overallScore / 10 * 100).toFixed(2);
  const accountName = assessment.account_name || 'the organization';
  const industry = assessment.industry || 'IT';
  
  // Determine health state
  let healthState = 'Red';
  if (overallPct >= 90) healthState = 'Green';
  else if (overallPct >= 70) healthState = 'Amber';
  
  const categoryScores = Object.entries(scores.categoryBreakdown)
    .map(([cat, data]) => `${cat.charAt(0).toUpperCase() + cat.slice(1)}: ${data.avgScore}/10 (${(data.avgScore / 10 * 100).toFixed(1)}%)`)
    .join(', ');
  
  const gaps = identifyGaps(scores);
  const strengths = identifyStrengths(scores);
  const recommendations = generateRecommendations(scores, assessment);
  
  // Count findings by priority
  const highCount = recommendations.filter(r => r.priority === 'critical' || r.priority === 'high').length;
  const medCount = recommendations.filter(r => r.priority === 'medium').length;
  const lowCount = recommendations.filter(r => r.priority === 'low').length;
  
  // Track-level scores
  const trackScores = Object.entries(scores.subcategoryBreakdown)
    .map(([key, data]) => ({ name: data.subcategory, score: data.avgScore, pct: (data.avgScore / 10 * 100).toFixed(1) }))
    .sort((a, b) => b.score - a.score);
  
  let summary = `EXECUTIVE SUMMARY — IT Infrastructure Assessment\n`;
  summary += `Account: ${accountName} | Industry: ${industry}\n`;
  summary += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  summary += `OVERALL ASSESSMENT SCORE: ${overallPct}% (${healthState})\n`;
  summary += `Maturity Level: ${maturityLevel.level}/5 — ${maturityLevel.name}\n`;
  summary += `${maturityLevel.description}\n\n`;
  
  summary += `CATEGORY SCORES:\n`;
  summary += `${categoryScores}\n\n`;
  
  if (trackScores.length > 0) {
    summary += `TRACK-LEVEL SCORES:\n`;
    trackScores.forEach(t => {
      const state = t.pct >= 90 ? '🟢' : t.pct >= 70 ? '🟡' : '🔴';
      summary += `${state} ${t.name}: ${t.pct}%\n`;
    });
    summary += '\n';
  }
  
  summary += `ASSESSMENT FINDINGS:\n`;
  summary += `Total findings: ${highCount + medCount + lowCount}\n`;
  summary += `• High impact (action within 30 days): ${highCount}\n`;
  summary += `• Medium impact (action within 60 days): ${medCount}\n`;
  summary += `• Low impact (action within 90 days): ${lowCount}\n\n`;
  
  if (strengths.length > 0) {
    summary += `KEY STRENGTHS:\n`;
    strengths.slice(0, 5).forEach(s => {
      summary += `✓ ${s.description} (${s.score}/10)\n`;
    });
    summary += '\n';
  }
  
  if (gaps.length > 0) {
    summary += `CRITICAL GAPS IDENTIFIED:\n`;
    gaps.slice(0, 5).forEach(g => {
      summary += `✗ ${g.description} (${g.score}/10) [${g.severity.toUpperCase()}]\n`;
    });
    summary += '\n';
  }
  
  summary += `ASSESSMENT METHODOLOGY:\n`;
  summary += `This assessment evaluated ${accountName}'s IT infrastructure across People, Process, and Technology dimensions using the ZDO (Zero Defective Operations) framework. `;
  summary += `The organization is currently at Maturity Level ${maturityLevel.level} (${maturityLevel.name}), indicating ${maturityLevel.description.toLowerCase()}. `;
  summary += `Assessment findings are categorized based on their impact, with mitigation recommendations following a structured 30-60-90 day improvement plan.\n\n`;
  
  summary += `MITIGATION TIMELINE:\n`;
  summary += `• High impact findings — within 30 days\n`;
  summary += `• Medium impact findings — within 60 days\n`;
  summary += `• Low impact findings — within 90 days\n`;
  
  return summary;
}

module.exports = { generateReport };
