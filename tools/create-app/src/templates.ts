export interface TemplateConfig {
  name: string;
  description: string;
  modules: string[];
}

export const TEMPLATES: { [key: string]: TemplateConfig } = {
  basic: {
    name: 'Basic Template',
    description: 'Simple utilities, minimal apps',
    modules: ['core']
  },
  'ai-app': {
    name: 'AI Application',
    description: 'Chat apps, AI assistants, content tools',
    modules: ['core', 'ai-service', 'notifications']
  },
  'data-app': {
    name: 'Data Application',
    description: 'Analytics, reporting, data management',
    modules: ['core', 'database', 'charts', 'import-export']
  },
  'research-app': {
    name: 'Research Application',
    description: 'Research tools, knowledge management',
    modules: ['core', 'ai-service', 'database', 'vector-search', 'docs']
  },
  full: {
    name: 'Full Template',
    description: 'Feature-rich applications, demos',
    modules: [
      'core', 
      'ai-service', 
      'database', 
      'vector-search', 
      'charts', 
      'docs', 
      'notifications', 
      'shortcuts', 
      'updater', 
      'import-export'
    ]
  }
};

export function getTemplateConfig(template: string): TemplateConfig | null {
  return TEMPLATES[template] || null;
}

export function listTemplates(): string[] {
  return Object.keys(TEMPLATES);
}