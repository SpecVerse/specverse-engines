/**
 * React Forms Generator
 *
 * Generates React forms with react-hook-form and Zod validation
 */

import type { TemplateContext } from '@specverse/engine-realize';

/**
 * Generate React form component for a model
 */
export default function generateReactForm(context: TemplateContext): string {
  const { model, spec } = context;

  if (!model) {
    throw new Error('Model is required in template context');
  }

  const modelName = model.name;
  const formName = `${modelName}Form`;

  return `/**
 * ${formName}
 * Form component for creating/editing ${modelName}
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import type { ${modelName} } from '../../types/${modelName}';

// Zod schema for form validation
const ${modelName.toLowerCase()}Schema = z.object({
  ${generateSchemaFields(model)}
});

type ${modelName}FormData = z.infer<typeof ${modelName.toLowerCase()}Schema>;

interface ${formName}Props {
  ${modelName.toLowerCase()}?: ${modelName};
  onSubmit: (data: ${modelName}FormData) => void;
  onValidate?: (data: ${modelName}FormData) => void;
  onDelete?: () => void;
  onCancel?: () => void;
  isDeleting?: boolean;
  isValidating?: boolean;
}

/**
 * ${formName} Component
 */
export function ${formName}({ ${modelName.toLowerCase()}, onSubmit, onValidate, onDelete, onCancel, isDeleting, isValidating }: ${formName}Props) {
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<${modelName}FormData>({
    resolver: zodResolver(${modelName.toLowerCase()}Schema),
    defaultValues: ${modelName.toLowerCase()} || {},
  });

  // Reset form when ${modelName.toLowerCase()} changes
  useEffect(() => {
    if (${modelName.toLowerCase()}) {
      reset(${modelName.toLowerCase()});
    } else {
      reset({});
    }
  }, [${modelName.toLowerCase()}, reset]);

  const handleValidateClick = () => {
    if (onValidate) {
      const data = getValues();
      onValidate(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="${modelName.toLowerCase()}-form space-y-4" autoComplete="off" data-lpignore="true" data-form-type="other">
      {/* Hidden fake fields to trick password managers */}
      <input type="text" name="fake-username" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <input type="password" name="fake-password" style={{ display: 'none' }} tabIndex={-1} autoComplete="new-password" aria-hidden="true" />

      ${generateFormFields(model)}

      <div className="form-actions flex flex-wrap gap-2 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>

        {onValidate && (
          <button
            type="button"
            onClick={handleValidateClick}
            disabled={isValidating}
            className="px-6 py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
          >
            {isValidating ? 'Validating...' : 'Validate'}
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="px-6 py-2 bg-red-600 text-white font-medium rounded hover:bg-red-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        )}

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-slate-600 text-gray-200 font-medium rounded hover:bg-slate-500 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
`;
}

/**
 * Generate Zod schema fields from model attributes
 */
function generateSchemaFields(model: any): string {
  let attributes = model.attributes || {};

  // If attributes is an array (from Object.entries), convert back to object
  if (Array.isArray(attributes)) {
    const obj: Record<string, any> = {};
    attributes.forEach((attr: any, index: number) => {
      if (attr && typeof attr === 'object' && attr.name) {
        obj[attr.name] = attr;
      } else if (Array.isArray(attr) && attr.length >= 2) {
        // Handle [name, config] tuple format
        obj[attr[0]] = attr[1];
      } else {
        obj[index.toString()] = attr;
      }
    });
    attributes = obj;
  }

  const fields: string[] = [];

  for (const [name, config] of Object.entries(attributes)) {
    // Skip standard auto-generated fields
    if (name === 'id' || name === 'createdAt' || name === 'updatedAt') continue;

    const attr: any = config;

    // Skip fields with auto directive (auto=uuid4, auto=now, etc.)
    if (attr.auto || attr.autoGenerate) continue;

    // Skip common auto-timestamp fields (workaround for parser not preserving auto directive)
    const autoTimestampFields = ['joinedAt', 'registeredAt', 'enrolledAt', 'startedAt', 'completedAt', 'verifiedAt'];
    if (autoTimestampFields.includes(name) && (attr.type === 'DateTime' || attr.type === 'Timestamp')) {
      continue;
    }

    const type = attr.type || 'String';
    let zodType = 'z.string()';

    // Map SpecVerse types to Zod types
    if (type === 'Integer' || type === 'Number') zodType = 'z.number()';
    if (type === 'Boolean') zodType = 'z.boolean()';
    if (type === 'Email') zodType = 'z.string().email()';
    if (type === 'DateTime') zodType = 'z.string()'; // datetime-local input gives string, not ISO datetime
    if (type === 'UUID') zodType = 'z.string().uuid()';

    // Add constraints
    if (attr.required) {
      // Already required by default
    } else {
      zodType += '.optional()';
    }

    if (attr.min && type === 'String') {
      zodType = zodType.replace(')', `.min(${attr.min})`);
    }
    if (attr.max && type === 'String') {
      zodType = zodType.replace(')', `.max(${attr.max})`);
    }

    fields.push(`  ${name}: ${zodType},`);
  }

  return fields.join('\n');
}

/**
 * Generate form fields from model attributes
 */
function generateFormFields(model: any): string {
  let attributes = model.attributes || {};

  // If attributes is an array (from Object.entries), convert back to object
  if (Array.isArray(attributes)) {
    const obj: Record<string, any> = {};
    attributes.forEach((attr: any, index: number) => {
      if (attr && typeof attr === 'object' && attr.name) {
        obj[attr.name] = attr;
      } else if (Array.isArray(attr) && attr.length >= 2) {
        // Handle [name, config] tuple format
        obj[attr[0]] = attr[1];
      } else {
        obj[index.toString()] = attr;
      }
    });
    attributes = obj;
  }

  const fields: string[] = [];
  const regularFields: string[] = [];
  const textAreaFields: string[] = [];

  for (const [name, config] of Object.entries(attributes)) {
    // Skip standard auto-generated fields
    if (name === 'id' || name === 'createdAt' || name === 'updatedAt') continue;

    const attr: any = config;

    // Skip fields with auto directive (auto=uuid4, auto=now, etc.)
    if (attr.auto || attr.autoGenerate) continue;

    // Skip common auto-timestamp fields (workaround for parser not preserving auto directive)
    const autoTimestampFields = ['joinedAt', 'registeredAt', 'enrolledAt', 'startedAt', 'completedAt', 'verifiedAt'];
    if (autoTimestampFields.includes(name) && (attr.type === 'DateTime' || attr.type === 'Timestamp')) {
      continue;
    }

    const type = attr.type || 'String';
    const label = name.charAt(0).toUpperCase() + name.slice(1);
    const isRequired = attr.required;

    let inputType = 'text';
    if (type === 'Email') inputType = 'email';
    if (type === 'Number' || type === 'Integer') inputType = 'number';
    if (type === 'Boolean') inputType = 'checkbox';
    if (type === 'DateTime') inputType = 'datetime-local';
    if (type === 'Text') inputType = 'textarea';

    const field = inputType === 'textarea' ? `        <div className="form-field">
          <label htmlFor="${name}" className="block text-sm font-medium text-gray-300 mb-1">
            ${name}${isRequired ? ' <span className="text-red-400">*</span>' : ''}
          </label>
          <textarea
            id="${name}"
            {...register('${name}')}
            rows={2}
            className={\`w-full px-3 py-2 rounded bg-slate-700 border transition-colors text-gray-200
              \${errors['${name}']
                ? 'border-red-500 focus:border-red-400'
                : 'border-slate-600 focus:border-blue-500'
              } focus:outline-none focus:ring-0 resize-none\`}
            placeholder="Enter ${name}"
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
            readOnly
            onFocus={(e) => e.target.removeAttribute('readonly')}
          />
          {errors['${name}'] && (
            <p className="mt-1 text-xs text-red-400">{errors['${name}']?.message}</p>
          )}
        </div>` : inputType === 'checkbox' ? `        <div className="form-field">
          <label htmlFor="${name}" className="flex items-center text-sm font-medium text-gray-300">
            <input
              id="${name}"
              type="checkbox"
              {...register('${name}')}
              className="mr-2"
              autoComplete="off"
              data-lpignore="true"
            />
            ${name}${isRequired ? ' <span className="ml-1 text-red-400">*</span>' : ''}
          </label>
          {errors['${name}'] && (
            <p className="mt-1 text-xs text-red-400">{errors['${name}']?.message}</p>
          )}
        </div>` : `        <div className="form-field">
          <label htmlFor="${name}" className="block text-sm font-medium text-gray-300 mb-1">
            ${name}${isRequired ? ' <span className="text-red-400">*</span>' : ''}
          </label>
          <input
            id="${name}"
            type="${inputType}"
            {...register('${name}')}
            className={\`w-full px-3 py-2 rounded bg-slate-700 border transition-colors text-gray-200
              \${errors['${name}']
                ? 'border-red-500 focus:border-red-400'
                : 'border-slate-600 focus:border-blue-500'
              } focus:outline-none focus:ring-0\`}
            placeholder="Enter ${name}"
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
            readOnly
            onFocus={(e) => e.target.removeAttribute('readonly')}
          />
          {errors['${name}'] && (
            <p className="mt-1 text-xs text-red-400">{errors['${name}']?.message}</p>
          )}
        </div>`;

    // Separate textarea fields from regular fields
    if (inputType === 'textarea') {
      textAreaFields.push(field);
    } else {
      regularFields.push(field);
    }
  }

  // Build final output with grid layout for regular fields
  let output = '';

  if (regularFields.length > 0) {
    output += `      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">\n`;
    output += regularFields.join('\n\n');
    output += `\n      </div>`;
  }

  if (textAreaFields.length > 0) {
    if (output) output += '\n\n';
    output += textAreaFields.join('\n\n');
  }

  return output;
}
