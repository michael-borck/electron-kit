import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import { validateProjectName } from './utils';
import { getTemplateConfig } from './templates';

export interface CreateAppOptions {
  template?: string;
  skipGit?: boolean;
  skipInstall?: boolean;
}

export async function createApp(projectName?: string, options: CreateAppOptions = {}) {
  console.log(chalk.blue('🚀 Create Electron Kit'));
  console.log();

  // Get project name
  let finalProjectName: string;
  if (!projectName) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'What is your project name?',
        validate: validateProjectName,
      },
    ]);
    finalProjectName = answers.projectName;
  } else {
    const validation = validateProjectName(projectName);
    if (validation !== true) {
      console.error(chalk.red(`Error: ${validation}`));
      process.exit(1);
    }
    finalProjectName = projectName;
  }

  // Get template
  let finalTemplate: string;
  if (!options.template) {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'template',
        message: 'Which template would you like to use?',
        choices: [
          { name: '🔷 Basic - Simple utilities, minimal apps', value: 'basic' },
          { name: '🤖 AI App - Chat apps, AI assistants, content tools', value: 'ai-app' },
          { name: '📊 Data App - Analytics, reporting, data management', value: 'data-app' },
          { name: '🔍 Research App - Research tools, knowledge management', value: 'research-app' },
          { name: '🎯 Full - Feature-rich applications, demos', value: 'full' },
        ],
      },
    ]);
    finalTemplate = answers.template;
  } else {
    finalTemplate = options.template;
  }

  const templateConfig = getTemplateConfig(finalTemplate);
  if (!templateConfig) {
    console.error(chalk.red(`Error: Unknown template "${finalTemplate}"`));
    process.exit(1);
  }

  const projectPath = path.resolve(finalProjectName);

  // Check if directory exists
  if (fs.existsSync(projectPath)) {
    console.error(chalk.red(`Error: Directory "${finalProjectName}" already exists`));
    process.exit(1);
  }

  console.log();
  console.log(`Creating ${chalk.green(finalProjectName)} with template ${chalk.cyan(finalTemplate)}...`);
  console.log();

  const spinner = ora('Setting up project...').start();

  try {
    // Create project directory
    await fs.ensureDir(projectPath);

    // Copy core template
    await copyTemplate('core', projectPath, finalProjectName);

    // Copy additional modules based on template
    for (const module of templateConfig.modules) {
      if (module !== 'core') {
        await copyModule(module, projectPath, finalProjectName);
      }
    }

    // Update package.json with project-specific info
    await updatePackageJson(projectPath, finalProjectName, templateConfig);

    // Copy template-specific files if they exist
    await copyTemplateFiles(finalTemplate, projectPath, finalProjectName);

    spinner.succeed('Project structure created');

    // Install dependencies
    if (!options.skipInstall) {
      const installSpinner = ora('Installing dependencies...').start();
      try {
        execSync('npm install', { cwd: projectPath, stdio: 'pipe' });
        installSpinner.succeed('Dependencies installed');
      } catch (error) {
        installSpinner.fail('Failed to install dependencies');
        console.log(chalk.yellow('You can install them manually by running: npm install'));
      }
    }

    // Initialize git
    if (!options.skipGit) {
      const gitSpinner = ora('Initializing git repository...').start();
      try {
        execSync('git init', { cwd: projectPath, stdio: 'pipe' });
        execSync('git add .', { cwd: projectPath, stdio: 'pipe' });
        execSync('git commit -m "Initial commit"', { cwd: projectPath, stdio: 'pipe' });
        gitSpinner.succeed('Git repository initialized');
      } catch (error) {
        gitSpinner.fail('Failed to initialize git');
        console.log(chalk.yellow('You can initialize git manually if needed'));
      }
    }

    console.log();
    console.log(chalk.green('✨ Project created successfully!'));
    console.log();
    console.log('Next steps:');
    console.log(`  ${chalk.cyan('cd')} ${finalProjectName}`);
    if (options.skipInstall) {
      console.log(`  ${chalk.cyan('npm install')}`);
    }
    console.log(`  ${chalk.cyan('npm run dev')}`);
    console.log();
    console.log(`Happy coding! 🎉`);

  } catch (error) {
    spinner.fail('Failed to create project');
    throw error;
  }
}

async function copyTemplate(templateName: string, projectPath: string, projectName: string) {
  const templatePath = path.join(__dirname, '../../packages', templateName);
  const sourcePath = path.join(__dirname, '../../../packages', templateName);
  
  if (await fs.pathExists(sourcePath)) {
    await fs.copy(sourcePath, projectPath, {
      filter: (src) => {
        // Skip node_modules, dist, and other build artifacts
        const relativePath = path.relative(sourcePath, src);
        return !relativePath.includes('node_modules') && 
               !relativePath.includes('dist') && 
               !relativePath.includes('.git');
      }
    });
  }
}

async function copyModule(moduleName: string, projectPath: string, projectName: string) {
  const modulePath = path.join(__dirname, '../../../packages', moduleName);
  const targetPath = path.join(projectPath, 'src', 'modules', moduleName);
  
  if (await fs.pathExists(modulePath)) {
    await fs.copy(path.join(modulePath, 'src'), targetPath, {
      filter: (src) => !src.includes('node_modules') && !src.includes('dist')
    });
  }
}

async function updatePackageJson(projectPath: string, projectName: string, templateConfig: any) {
  const packageJsonPath = path.join(projectPath, 'package.json');
  
  if (await fs.pathExists(packageJsonPath)) {
    const packageJson = await fs.readJson(packageJsonPath);
    
    // Update basic info
    packageJson.name = projectName;
    packageJson.productName = projectName;
    packageJson.description = `Electron application built with ${templateConfig.name}`;
    
    // Add dependencies for selected modules
    for (const module of templateConfig.modules) {
      const moduleDeps = getModuleDependencies(module);
      if (moduleDeps.dependencies) {
        packageJson.dependencies = { ...packageJson.dependencies, ...moduleDeps.dependencies };
      }
      if (moduleDeps.devDependencies) {
        packageJson.devDependencies = { ...packageJson.devDependencies, ...moduleDeps.devDependencies };
      }
    }
    
    // Update build config
    if (packageJson.build) {
      packageJson.build.appId = `com.${projectName.toLowerCase()}.app`;
      packageJson.build.productName = projectName;
    }
    
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
  }
}

async function copyTemplateFiles(template: string, projectPath: string, projectName: string) {
  const templateFilesPath = path.join(__dirname, '../templates', template);
  
  if (await fs.pathExists(templateFilesPath)) {
    await fs.copy(templateFilesPath, projectPath, {
      overwrite: true,
      filter: (src) => !src.includes('node_modules')
    });
  }
}

function getModuleDependencies(module: string): { dependencies?: any; devDependencies?: any } {
  const deps: { [key: string]: { dependencies?: any; devDependencies?: any } } = {
    'ai-service': {
      dependencies: {
        'openai': '^4.0.0',
        '@anthropic-ai/sdk': '^0.24.0',
        '@google/generative-ai': '^0.15.0'
      }
    },
    'database': {
      dependencies: {
        'better-sqlite3': '^9.0.0',
        'drizzle-orm': '^0.28.0'
      },
      devDependencies: {
        '@types/better-sqlite3': '^7.0.0'
      }
    },
    'vector-search': {
      dependencies: {
        'vectordb': '^0.3.0',
        '@xenova/transformers': '^2.0.0'
      }
    },
    'charts': {
      dependencies: {
        'chart.js': '^4.0.0',
        'react-chartjs-2': '^5.0.0',
        'd3': '^7.0.0',
        'recharts': '^2.0.0'
      },
      devDependencies: {
        '@types/d3': '^7.0.0'
      }
    }
  };
  
  return deps[module] || {};
}