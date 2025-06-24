import validate from 'validate-npm-package-name';

export function validateProjectName(name: string): string | true {
  if (!name || name.trim() === '') {
    return 'Project name is required';
  }

  const validation = validate(name);
  
  if (!validation.validForNewPackages) {
    const errors = validation.errors || [];
    const warnings = validation.warnings || [];
    
    if (errors.length > 0) {
      return `Invalid project name: ${errors.join(', ')}`;
    }
    
    if (warnings.length > 0) {
      return `Project name warnings: ${warnings.join(', ')}`;
    }
  }
  
  // Additional checks
  if (name.length > 214) {
    return 'Project name must be less than 214 characters';
  }
  
  if (name.startsWith('.') || name.startsWith('_')) {
    return 'Project name cannot start with . or _';
  }
  
  if (name !== name.toLowerCase()) {
    return 'Project name must be lowercase';
  }
  
  // Check for reserved names
  const reservedNames = [
    'node_modules', 'favicon.ico', 'test', 'tests', 'spec', 'specs',
    'electron', 'react', 'typescript', 'javascript'
  ];
  
  if (reservedNames.includes(name.toLowerCase())) {
    return `Project name "${name}" is reserved`;
  }
  
  return true;
}

export function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

export function pascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
    .replace(/^(.)/, (_, c) => c.toUpperCase());
}