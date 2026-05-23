const { getDb } = require('../models/database');

/**
 * Generate assessment questions based on the scope configuration
 */
function generateAssessmentQuestions(scope) {
  const db = getDb();
  
  let focusAreas = [];
  try {
    focusAreas = JSON.parse(scope.focus_areas || '[]');
  } catch (e) {
    focusAreas = ['people', 'process', 'technology'];
  }
  
  // If no specific focus, include all
  if (focusAreas.length === 0) {
    focusAreas = ['people', 'process', 'technology'];
  }
  
  let techStack = [];
  try {
    techStack = JSON.parse(scope.technology_stack || '[]');
  } catch (e) {
    techStack = [];
  }

  const categories = focusAreas.map(f => f.toLowerCase());
  const placeholders = categories.map(() => '?').join(',');
  
  let questions = db.prepare(`
    SELECT * FROM questions 
    WHERE LOWER(category) IN (${placeholders})
    ORDER BY category, subcategory, weight DESC
  `).all(...categories);
  
  // Filter by technology stack if specified
  if (techStack.length > 0 && categories.includes('technology')) {
    questions = questions.map(q => {
      let applicable = [];
      try {
        applicable = JSON.parse(q.applicable_to || '[]');
      } catch (e) {
        applicable = [];
      }
      // Include question if no applicable_to filter or if it matches tech stack
      if (applicable.length === 0) return q;
      const matches = applicable.some(a => 
        techStack.some(t => t.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(t.toLowerCase()))
      );
      return matches ? q : null;
    }).filter(Boolean);
  }
  
  // Group by category
  const grouped = {
    people: questions.filter(q => q.category.toLowerCase() === 'people'),
    process: questions.filter(q => q.category.toLowerCase() === 'process'),
    technology: questions.filter(q => q.category.toLowerCase() === 'technology')
  };
  
  return {
    total: questions.length,
    byCategory: grouped,
    questions: questions
  };
}

/**
 * Calculate scores from assessment responses
 */
function calculateScores(responses) {
  if (!responses || responses.length === 0) {
    return { overall: 0, people: 0, process: 0, technology: 0, subcategories: {} };
  }

  const categoryScores = { people: [], process: [], technology: [] };
  const subcategoryScores = {};

  responses.forEach(r => {
    const category = (r.category || '').toLowerCase();
    const score = parseFloat(r.score) || 0;
    const weight = parseFloat(r.weight) || 1.0;
    
    if (categoryScores[category]) {
      categoryScores[category].push({ score, weight });
    }
    
    const subKey = `${category}_${r.subcategory || 'general'}`;
    if (!subcategoryScores[subKey]) {
      subcategoryScores[subKey] = [];
    }
    subcategoryScores[subKey].push({ score, weight });
  });

  const weightedAvg = (items) => {
    if (items.length === 0) return 0;
    const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
    const weightedSum = items.reduce((sum, i) => sum + (i.score * i.weight), 0);
    return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : 0;
  };

  const people = weightedAvg(categoryScores.people);
  const process = weightedAvg(categoryScores.process);
  const technology = weightedAvg(categoryScores.technology);
  
  const allScores = [...categoryScores.people, ...categoryScores.process, ...categoryScores.technology];
  const overall = weightedAvg(allScores);

  const subScores = {};
  Object.entries(subcategoryScores).forEach(([key, items]) => {
    subScores[key] = weightedAvg(items);
  });

  return { overall, people, process, technology, subcategories: subScores };
}

module.exports = { generateAssessmentQuestions, calculateScores };
