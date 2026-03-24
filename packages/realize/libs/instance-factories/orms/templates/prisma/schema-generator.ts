/**
 * Prisma Schema Generator
 *
 * Generates Prisma schema from SpecVerse models
 */

import type { TemplateContext } from '@specverse/engine-realize';
import { pluralize } from '@specverse/types';

/**
 * Generate Prisma schema
 */
export default function generatePrismaSchema(context: TemplateContext): string {
  const { spec, models, implType } = context;

  const allModels = models || spec?.models || [];

  if (allModels.length === 0) {
    throw new Error('No models found in context for schema generation');
  }

  // Build relation map: track all references to each target model
  // so we can add @relation("name") when a target is referenced multiple times
  const relationMap = buildRelationMap(allModels);

  // Build missing back-references: when Model A has hasMany B but B has no belongsTo A,
  // Prisma requires the back-reference field on B. We auto-generate these.
  const backRefs = buildMissingBackRefs(allModels, relationMap);

  // Build set of "ParentModel->ChildModel" for hasOne relations
  // Used to add @unique to FK fields on the child side of a hasOne
  const hasOneTargets = new Set<string>();
  for (const m of allModels) {
    const rels = Array.isArray(m.relationships) ? m.relationships : Object.values(m.relationships || {});
    for (const r of rels as any[]) {
      if (r.type === 'hasOne') {
        hasOneTargets.add(`${m.name}->${r.target}`);
      }
    }
  }

  // Generate header
  const header = generateHeader(implType);

  // Generate models
  const modelSchemas = allModels.map((model: any) =>
    generateModelSchema(model, relationMap, backRefs, hasOneTargets)
  ).join('\n\n');

  return `${header}\n\n${modelSchemas}`;
}

/**
 * Build a relation name map that assigns consistent names to both sides of each relation.
 *
 * Prisma requires that when @relation("name") is used, BOTH sides use the same name.
 * We need disambiguation when a model is referenced by multiple fields across all models.
 *
 * Returns: Map<"SourceModel.fieldName", relationName | null>
 *   - null means no @relation annotation needed
 *   - string means use @relation("name") on this field
 */
function buildRelationMap(allModels: any[]): Map<string, string | null> {
  // Step 1: Collect all relations grouped by target model
  type RelRef = { sourceModel: string; fieldName: string; relType: string };
  const targetRefs = new Map<string, RelRef[]>();

  for (const model of allModels) {
    const relationships = Array.isArray(model.relationships)
      ? model.relationships
      : Object.values(model.relationships || {});

    for (const rel of relationships as any[]) {
      const target = rel.target;
      if (!target) continue;

      const fieldName = rel.name || (rel.type === 'hasMany' || rel.type === 'manyToMany'
        ? pluralize(target.toLowerCase())
        : target.toLowerCase());

      if (!targetRefs.has(target)) {
        targetRefs.set(target, []);
      }
      targetRefs.get(target)!.push({
        sourceModel: model.name,
        fieldName,
        relType: rel.type
      });
    }
  }

  // Step 2: For ALL belongsTo relations, find the matching parent-side name.
  // Since we always name relations, every belongsTo must use the parent's canonical name.
  const nameMap = new Map<string, string | null>();

  for (const [target, refs] of targetRefs) {
    for (const ref of refs) {
      const key = `${ref.sourceModel}.${ref.fieldName}`;
      if (ref.relType === 'belongsTo') {
        // Child side: find the matching parent-side relation
        const parentRefs = targetRefs.get(ref.sourceModel) || [];
        const matchingParent = parentRefs.find(p =>
          p.sourceModel === target &&
          (p.relType === 'hasMany' || p.relType === 'hasOne')
        );
        if (matchingParent) {
          // Use the parent's canonical name so both sides match
          nameMap.set(key, `${matchingParent.sourceModel}_${matchingParent.fieldName}`);
        }
        // If no matching parent, leave unmapped — getRelationName will use default
      }
      // hasMany/hasOne/manyToMany use default naming in getRelationName
    }
  }

  return nameMap;
}

/**
 * Build missing back-reference fields.
 * When Model A has `hasMany B` or `hasOne B`, Prisma requires B to have a
 * corresponding FK + relation field pointing back to A.
 * If B already has a `belongsTo A`, it's covered. Otherwise we need to inject one.
 *
 * Returns: Map<targetModelName, Array<{ fkField, relationField }>>
 */
function buildMissingBackRefs(
  allModels: any[],
  relationMap: Map<string, string | null>
): Map<string, string[]> {
  // Build set of existing belongsTo relations: "ChildModel->ParentModel"
  const existingBelongsTo = new Set<string>();
  for (const model of allModels) {
    const relationships = Array.isArray(model.relationships)
      ? model.relationships
      : Object.values(model.relationships || {});
    for (const rel of relationships as any[]) {
      if (rel.type === 'belongsTo') {
        existingBelongsTo.add(`${model.name}->${rel.target}`);
      }
    }
  }

  // For each hasMany/hasOne, check if the target has a belongsTo back
  const backRefs = new Map<string, string[]>();

  for (const model of allModels) {
    const relationships = Array.isArray(model.relationships)
      ? model.relationships
      : Object.values(model.relationships || {});
    for (const rel of relationships as any[]) {
      if (rel.type !== 'hasMany' && rel.type !== 'hasOne') continue;

      const target = rel.target;
      const backKey = `${target}->${model.name}`;

      if (!existingBelongsTo.has(backKey)) {
        // Target model is missing a belongsTo for this relation — inject one
        const fieldName = rel.name || (rel.type === 'hasMany'
          ? pluralize(target.toLowerCase())
          : target.toLowerCase());
        // Always use the parent's canonical relation name
        const relName = `${model.name}_${fieldName}`;

        // Check if the parent model has multiple hasMany/hasOne relations to the same target
        // If so, include the field name in the FK to avoid collisions
        const parentRelsToSameTarget = relationships.filter((r: any) =>
          r.target === target && (r.type === 'hasMany' || r.type === 'hasOne')
        );
        const needsFieldInFk = parentRelsToSameTarget.length > 1;
        const fkSuffix = needsFieldInFk
          ? camelToSnake(fieldName) + '_id'
          : camelToSnake(model.name.charAt(0).toLowerCase() + model.name.slice(1)) + '_id';
        const fkName = fkSuffix;
        const fkPadding = ' '.repeat(Math.max(1, 15 - fkName.length));
        const refFieldName = needsFieldInFk
          ? fieldName + model.name
          : model.name.charAt(0).toLowerCase() + model.name.slice(1);
        const refPadding = ' '.repeat(Math.max(1, 15 - refFieldName.length));

        let relDef = `${refFieldName}${refPadding}${model.name}`;
        relDef += ` @relation("${relName}", fields: [${fkName}], references: [id])`;

        if (!backRefs.has(target)) {
          backRefs.set(target, []);
        }
        const uniqueModifier = rel.type === 'hasOne' ? ' @unique' : '';
        backRefs.get(target)!.push(`${fkName}${fkPadding}String${uniqueModifier}`);
        backRefs.get(target)!.push(relDef);
      }
    }
  }

  // Also handle the reverse: belongsTo without matching hasMany/hasOne on parent
  // Build set of existing hasMany/hasOne: "ParentModel->ChildModel"
  const existingHasRelation = new Set<string>();
  for (const model of allModels) {
    const rels = Array.isArray(model.relationships)
      ? model.relationships
      : Object.values(model.relationships || {});
    for (const rel of rels as any[]) {
      if (rel.type === 'hasMany' || rel.type === 'hasOne') {
        existingHasRelation.add(`${model.name}->${rel.target}`);
      }
    }
  }

  for (const model of allModels) {
    const relationships = Array.isArray(model.relationships)
      ? model.relationships
      : Object.values(model.relationships || {});
    for (const rel of relationships as any[]) {
      if (rel.type !== 'belongsTo') continue;

      const parent = rel.target;
      const forwardKey = `${parent}->${model.name}`;

      if (!existingHasRelation.has(forwardKey)) {
        // Parent model is missing a hasMany/hasOne for this belongsTo — inject array
        const fieldName = rel.name || parent.toLowerCase();
        const relName = getRelationName(model.name, fieldName, parent, relationMap);
        const arrayFieldName = pluralize(model.name.charAt(0).toLowerCase() + model.name.slice(1));
        const padding = ' '.repeat(Math.max(1, 15 - arrayFieldName.length));

        if (!backRefs.has(parent)) {
          backRefs.set(parent, []);
        }
        backRefs.get(parent)!.push(`${arrayFieldName}${padding}${model.name}[] @relation("${relName}")`);
      }
    }
  }

  return backRefs;
}

/**
 * Get the relation name for a given source model + field.
 * ALWAYS returns a name — Prisma accepts explicit names even when not strictly required,
 * and it avoids all ambiguity issues with complex schemas.
 *
 * For hasMany/hasOne: name = "SourceModel_fieldName" (canonical, parent-side)
 * For belongsTo: looks up the matching parent-side name from the relation map
 */
function getRelationName(
  sourceModel: string,
  fieldName: string,
  target: string,
  relationMap: Map<string, string | null>
): string {
  // Check if there's a mapped name (for belongsTo matching a parent's hasMany)
  const mapped = relationMap.get(`${sourceModel}.${fieldName}`);
  if (mapped) return mapped;

  // Default: use canonical naming
  return `${sourceModel}_${fieldName}`;
}

/**
 * Generate Prisma schema header
 */
function generateHeader(implType: any): string {
  const provider = implType?.configuration?.orm?.provider || 'postgresql';

  return `// Generated Prisma schema from SpecVerse specification
// This is your Prisma schema file
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${provider}"
  url      = env("DATABASE_URL")
}`;
}

/**
 * Generate a single model schema
 */
function generateModelSchema(
  model: any,
  relationMap: Map<string, string | null>,
  backRefs: Map<string, string[]>,
  hasOneTargets: Set<string>
): string {
  const modelName = model.name;
  let schema = `model ${modelName} {\n`;

  // Convert attributes from object to array if needed
  const attributes = Array.isArray(model.attributes)
    ? model.attributes
    : Object.values(model.attributes || {});

  // Convert relationships from object to array if needed
  const relationships = Array.isArray(model.relationships)
    ? model.relationships
    : Object.values(model.relationships || {});

  // Add attributes
  attributes.forEach((attr: any) => {
    schema += `  ${generateField(attr, model)}\n`;
  });

  // Add relationships
  relationships.forEach((rel: any) => {
    const fields = generateRelationship(rel, model, relationMap, hasOneTargets);
    fields.forEach(field => {
      schema += `  ${field}\n`;
    });
  });

  // Add auto-generated back-references (for hasMany/hasOne without corresponding belongsTo)
  const modelBackRefs = backRefs.get(modelName);
  if (modelBackRefs) {
    for (const line of modelBackRefs) {
      schema += `  ${line}\n`;
    }
  }

  schema += `}`;

  return schema;
}

/**
 * Generate a field definition
 */
function generateField(attr: any, model: any): string {
  const name = attr.name;
  const prismaType = mapTypeToPrisma(attr.type, attr.dbMapping?.columnType);
  const isOptional = !attr.constraints?.required;
  const isUnique = attr.constraints?.unique;
  const metadata = model?.metadata || {};

  let modifiers = '';

  // Primary key detection
  if (name.toLowerCase() === 'id') {
    modifiers += ' @id';
    if (metadata.id === 'uuid' || metadata.id === 'auto' || prismaType === 'String') {
      modifiers += ' @default(uuid())';
    } else if (metadata.id === 'integer' || prismaType === 'Int') {
      modifiers += ' @default(autoincrement())';
    }
  } else if (isUnique) {
    modifiers += ' @unique';
  }

  // Auto-generated fields (auto=now, auto=uuid, etc.)
  if (attr.auto) {
    const autoValue = typeof attr.auto === 'string' ? attr.auto.toLowerCase() : attr.auto;
    if (autoValue === 'now' || autoValue === true) {
      if (prismaType === 'DateTime') {
        modifiers += ' @default(now())';
      }
    } else if (autoValue === 'uuid' || autoValue === 'uuid4') {
      if (prismaType === 'String') {
        modifiers += ' @default(uuid())';
      }
    }
  } else {
    // Workaround: Handle common auto-timestamp fields (parser not preserving auto directive)
    const autoTimestampFields = ['joinedAt', 'registeredAt', 'enrolledAt', 'startedAt', 'completedAt', 'verifiedAt'];
    if (autoTimestampFields.includes(name) && prismaType === 'DateTime') {
      modifiers += ' @default(now())';
    }
  }

  // Audit fields
  if (metadata.audit && isAuditField(name)) {
    if (name === 'createdAt' || name === 'created_at') {
      if (!attr.auto) { // Don't override if already handled by auto
        modifiers += ' @default(now())';
      }
    }
    if (name === 'updatedAt' || name === 'updated_at') {
      modifiers += ' @updatedAt';
    }
  }

  // Soft delete fields
  if (metadata.softDelete && isSoftDeleteField(name)) {
    if (name === 'isDeleted' || name === 'is_deleted') {
      modifiers += ' @default(false)';
    }
  }

  // Version field
  if (metadata.version && isVersionField(name)) {
    modifiers += ' @default(0)';
  }

  // Database-specific type annotations
  if (attr.dbMapping?.columnType === 'TEXT') {
    modifiers += ' @db.Text';
  } else if (attr.dbMapping?.columnType?.startsWith('VARCHAR')) {
    const match = attr.dbMapping.columnType.match(/VARCHAR\((\d+)\)/);
    if (match) {
      modifiers += ` @db.VarChar(${match[1]})`;
    }
  }

  const padding = ' '.repeat(Math.max(1, 15 - name.length));
  const typeStr = isOptional ? `${prismaType}?` : prismaType;

  return `${name}${padding}${typeStr}${modifiers}`;
}

/**
 * Generate relationship fields
 */
function generateRelationship(rel: any, model: any, relationMap: Map<string, string | null>, hasOneTargets: Set<string>): string[] {
  const fields: string[] = [];
  const name = rel.name || rel.target.toLowerCase();
  const padding = ' '.repeat(Math.max(1, 15 - name.length));
  const isOptional = rel.optional || false;

  // Always add explicit relation names for Prisma — avoids all ambiguity
  const relName = getRelationName(model.name, name, rel.target, relationMap);
  const relAnnotation = ` @relation("${relName}")`;

  switch (rel.type) {
    case 'belongsTo':
      // Foreign key field — use snake_case for the FK column name
      const fkBase = rel.foreignKey || camelToSnake(name) + '_id';
      const fkPadding = ' '.repeat(Math.max(1, 15 - fkBase.length));
      // Add @unique if the parent has a hasOne relation pointing to this model
      const isUniqueFK = hasOneTargets.has(`${rel.target}->${model.name}`);
      fields.push(`${fkBase}${fkPadding}String${isOptional ? '?' : ''}${isUniqueFK ? ' @unique' : ''}`);

      // Relation field with @relation including fields/references + optional name
      let relationDef = `${name}${padding}${rel.target}${isOptional ? '?' : ''}`;
      relationDef += ` @relation(`;
      if (relName) {
        relationDef += `"${relName}", `;
      }
      relationDef += `fields: [${fkBase}], references: [id]`;

      if (rel.onDelete) {
        relationDef += `, onDelete: ${rel.onDelete}`;
      }
      if (rel.onUpdate) {
        relationDef += `, onUpdate: ${rel.onUpdate}`;
      }

      relationDef += ')';
      fields.push(relationDef);
      break;

    case 'hasOne':
      // Prisma requires hasOne relation fields to be optional
      fields.push(`${name}${padding}${rel.target}?${relAnnotation}`);
      break;

    case 'hasMany':
      const pluralName = rel.name || pluralize(rel.target.toLowerCase());
      const manyPadding = ' '.repeat(Math.max(1, 15 - pluralName.length));
      fields.push(`${pluralName}${manyPadding}${rel.target}[]${relAnnotation}`);
      break;

    case 'manyToMany':
      const manyName = rel.name || pluralize(rel.target.toLowerCase());
      const m2mPadding = ' '.repeat(Math.max(1, 15 - manyName.length));
      fields.push(`${manyName}${m2mPadding}${rel.target}[]${relAnnotation}`);
      break;
  }

  return fields;
}

/**
 * Convert camelCase to snake_case
 */
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Map SpecVerse type to Prisma type
 */
function mapTypeToPrisma(type: string, dbType?: string): string {
  // Use database type if provided
  if (dbType) {
    if (dbType.startsWith('VARCHAR') || dbType === 'TEXT') return 'String';

    const typeMap: Record<string, string> = {
      'INTEGER': 'Int',
      'BIGINT': 'BigInt',
      'DECIMAL': 'Decimal',
      'BOOLEAN': 'Boolean',
      'DATE': 'DateTime',
      'TIMESTAMP': 'DateTime',
      'UUID': 'String',
      'JSONB': 'Json',
      'JSON': 'Json',
      'FLOAT': 'Float'
    };

    if (typeMap[dbType]) return typeMap[dbType];
  }

  // Infer from SpecVerse type
  const typeLower = type.toLowerCase();

  if (typeLower.includes('string') || typeLower.includes('text')) return 'String';
  if (typeLower.includes('int')) return 'Int';
  if (typeLower.includes('bool')) return 'Boolean';
  if (typeLower.includes('date') || typeLower.includes('time')) return 'DateTime';
  if (typeLower.includes('float') || typeLower.includes('decimal')) return 'Float';
  if (typeLower.includes('json')) return 'Json';

  return 'String'; // default
}

/**
 * Helper functions
 */
function isAuditField(name: string): boolean {
  const auditFields = ['createdAt', 'updatedAt', 'createdBy', 'updatedBy',
                       'created_at', 'updated_at', 'created_by', 'updated_by'];
  return auditFields.includes(name);
}

function isSoftDeleteField(name: string): boolean {
  const softDeleteFields = ['deletedAt', 'isDeleted', 'deleted_at', 'is_deleted'];
  return softDeleteFields.includes(name);
}

function isVersionField(name: string): boolean {
  const versionFields = ['version', 'versionNumber', 'version_number'];
  return versionFields.includes(name);
}

// Imported from @specverse/types — shared across engines
import { pluralize } from '@specverse/types';
