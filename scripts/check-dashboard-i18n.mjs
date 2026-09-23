/* global console, process */
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const dashboardRoot = path.resolve('src/dashboard');
const providerFile = path.join(dashboardRoot, 'i18n/DashboardLanguageProvider.tsx');
const visibleAttributeNames = new Set(['title', 'subtitle', 'label', 'description', 'trend', 'eyebrow']);
const excludedFiles = new Set([
  providerFile,
  path.join(dashboardRoot, 'student/StudentPortal.tsx'),
  path.join(dashboardRoot, 'student/StudentSectionPage.tsx'),
]);

function listFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listFiles(entryPath);
    if (!entry.name.endsWith('.tsx') || entry.name.endsWith('.test.tsx') || excludedFiles.has(entryPath)) return [];
    return [entryPath];
  });
}

function normalized(value) {
  return value.trim().replace(/\s+/g, ' ');
}

function isTranslatable(value) {
  return /[A-Za-z]/.test(value) && value !== '&nbsp;' && !value.startsWith('VITE_');
}

const providerSource = fs.readFileSync(providerFile, 'utf8');
const providerAst = ts.createSourceFile(providerFile, providerSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const dictionaryKeys = new Set();

function collectDictionary(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(providerAst) === 'arabic' && node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
    node.initializer.properties.forEach((property) => {
      if (!ts.isPropertyAssignment(property)) return;
      if (ts.isStringLiteral(property.name) || ts.isIdentifier(property.name)) dictionaryKeys.add(property.name.text);
    });
  }
  ts.forEachChild(node, collectDictionary);
}

collectDictionary(providerAst);

const usedKeys = new Map();
const rawJsxText = [];

function record(key, filePath, node, sourceFile) {
  const value = normalized(key);
  if (!isTranslatable(value)) return;
  const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  const locations = usedKeys.get(value) || [];
  locations.push(`${path.relative(process.cwd(), filePath)}:${position.line + 1}`);
  usedKeys.set(value, locations);
}

for (const filePath of listFiles(dashboardRoot)) {
  const source = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  function visit(node) {
    if (ts.isJsxText(node) && isTranslatable(normalized(node.getText(sourceFile)))) {
      const parentName = ts.isJsxElement(node.parent) ? node.parent.openingElement.tagName.getText(sourceFile) : '';
      if (parentName === 'DashboardText') record(node.getText(sourceFile), filePath, node, sourceFile);
      else rawJsxText.push(`${path.relative(process.cwd(), filePath)}:${sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1}`);
    }

    if (ts.isCallExpression(node) && node.expression.getText(sourceFile) === 't' && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
      record(node.arguments[0].text, filePath, node.arguments[0], sourceFile);
    }

    if (ts.isJsxAttribute(node) && visibleAttributeNames.has(node.name.getText(sourceFile)) && node.initializer && ts.isStringLiteral(node.initializer)) {
      record(node.initializer.text, filePath, node.initializer, sourceFile);
    }

    if (
      ts.isPropertyAssignment(node)
      && ['label', 'title', 'note', 'message', 'trend', 'description'].includes(node.name.getText(sourceFile))
      && ts.isStringLiteral(node.initializer)
    ) {
      record(node.initializer.text, filePath, node.initializer, sourceFile);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

const missing = [...usedKeys.keys()].filter((key) => !dictionaryKeys.has(key)).sort((a, b) => a.localeCompare(b));

if (rawJsxText.length) {
  console.error(`Unwrapped dashboard JSX text (${rawJsxText.length}):`);
  rawJsxText.forEach((location) => console.error(`- ${location}`));
}

if (missing.length) {
  console.error(`Missing Arabic dashboard translations (${missing.length}):`);
  missing.forEach((key) => console.error(`- ${JSON.stringify(key)} (${usedKeys.get(key)[0]})`));
}

if (rawJsxText.length || missing.length) process.exit(1);
console.log(`Dashboard i18n audit passed with ${usedKeys.size} translated UI strings.`);
