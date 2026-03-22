/**
 * Universal Tailwind Adapter Generator
 *
 * Programmatically generates Tailwind CSS adapters for all 44 atomic component types
 * using the ATOMIC_COMPONENTS registry from @specverse/lang as the single source of truth.
 *
 * Phase 3.5 - Option A: Quick Universal Adapter
 */

import type { ComponentAdapter } from '@specverse/lang';

interface RenderContext {
  properties?: Record<string, any>;
  children?: string;
}

/**
 * Generate basic Tailwind HTML markup for a component
 */
function generateTailwindMarkup(
  type: string,
  properties: Record<string, any> = {},
  children?: string
): string {
  const baseClasses = 'rounded border border-gray-200 dark:border-gray-700';

  switch (type) {
    // ==========================================
    // DATA DISPLAY COMPONENTS
    // ==========================================

    case 'table':
      return `
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                ${(properties.columns || []).map((col: string) =>
                  `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">${col}</th>`
                ).join('')}
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              ${children || '<tr><td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400" colspan="99">No data</td></tr>'}
            </tbody>
          </table>
        </div>
      `;

    case 'list':
      return `
        <ul class="divide-y divide-gray-200 dark:divide-gray-700 ${properties.dense ? 'space-y-0' : 'space-y-2'}">
          ${children || '<li class="p-4 text-gray-500 dark:text-gray-400">No items</li>'}
        </ul>
      `;

    case 'grid':
      const columns = properties.columns || 3;
      return `
        <div class="grid grid-cols-1 md:grid-cols-${columns} gap-${properties.gap || '4'}">
          ${children || '<div class="p-4 text-gray-500 dark:text-gray-400">No items</div>'}
        </div>
      `;

    case 'card':
      const title = properties.title;
      const elevation = properties.elevation || 1;
      const shadowClass = elevation > 2 ? 'shadow-lg' : 'shadow-md';
      const variant = properties.variant;
      const metric = properties.metric;

      // Metric card variant - shows a large number/stat
      if (variant === 'metric') {
        return `
          <div class="bg-white dark:bg-gray-800 ${baseClasses} ${shadowClass} p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  ${metric || title || 'Metric'}
                </p>
                <p class="mt-2 text-3xl font-semibold text-gray-900 dark:text-gray-100">
                  ${children || '—'}
                </p>
                ${properties.showTrend ? `
                  <p class="mt-2 text-sm text-green-600 dark:text-green-400">
                    <svg class="inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Trend data unavailable
                  </p>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      }

      // Regular card
      return `
        <div class="bg-white dark:bg-gray-800 ${baseClasses} ${shadowClass} p-4">
          ${title ? `<div class="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">${title}</div>` : ''}
          <div class="text-gray-700 dark:text-gray-300">
            ${children || '<p class="text-sm text-gray-500 dark:text-gray-400">No data available</p>'}
          </div>
        </div>
      `;

    case 'chart':
      return `
        <div class="bg-white dark:bg-gray-800 ${baseClasses} p-4">
          <div class="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <div class="text-center">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p class="mt-2 text-sm">Chart: ${properties.chartType || 'bar'}</p>
            </div>
          </div>
        </div>
      `;

    case 'tree':
      return `
        <div class="bg-white dark:bg-gray-800 ${baseClasses} p-4">
          <div class="space-y-2">
            ${children || '<div class="text-gray-500 dark:text-gray-400">Tree structure</div>'}
          </div>
        </div>
      `;

    case 'timeline':
      return `
        <div class="relative pl-8 space-y-4">
          <div class="absolute left-3 top-0 h-full w-0.5 bg-gray-200 dark:bg-gray-700"></div>
          ${children || '<div class="relative"><div class="absolute -left-6 w-3 h-3 rounded-full bg-blue-500"></div><div class="text-gray-700 dark:text-gray-300">Timeline item</div></div>'}
        </div>
      `;

    case 'avatar':
      const size = properties.size || 'md';
      const sizeClass = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-16 w-16' : 'h-12 w-12';
      return `
        <div class="${sizeClass} rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-200 font-semibold">
          ${children || properties.initials || '?'}
        </div>
      `;

    case 'image':
      return `
        <img
          src="${properties.src || '/placeholder.png'}"
          alt="${properties.alt || 'Image'}"
          class="rounded ${properties.responsive ? 'max-w-full h-auto' : ''}"
        />
      `;

    // ==========================================
    // FORMS & INPUTS
    // ==========================================

    case 'form':
      return `
        <form class="space-y-4">
          ${children || '<div class="text-gray-500 dark:text-gray-400">Form fields</div>'}
        </form>
      `;

    case 'input':
      return `
        <input
          type="${properties.type || 'text'}"
          placeholder="${properties.placeholder || ''}"
          ${properties.required ? 'required' : ''}
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200"
        />
      `;

    case 'textarea':
      return `
        <textarea
          rows="${properties.rows || 4}"
          placeholder="${properties.placeholder || ''}"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200"
        >${children || ''}</textarea>
      `;

    case 'select':
      return `
        <select class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200">
          ${(properties.options || ['Option 1', 'Option 2']).map((opt: string) =>
            `<option value="${opt}">${opt}</option>`
          ).join('')}
        </select>
      `;

    case 'checkbox':
      return `
        <label class="flex items-center space-x-2">
          <input
            type="checkbox"
            ${properties.checked ? 'checked' : ''}
            class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-gray-700 dark:text-gray-300">${properties.label || children || 'Checkbox'}</span>
        </label>
      `;

    case 'radio':
      return `
        <label class="flex items-center space-x-2">
          <input
            type="radio"
            name="${properties.name || 'radio'}"
            ${properties.checked ? 'checked' : ''}
            class="border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-gray-700 dark:text-gray-300">${properties.label || children || 'Radio'}</span>
        </label>
      `;

    case 'slider':
      return `
        <input
          type="range"
          min="${properties.min || 0}"
          max="${properties.max || 100}"
          value="${properties.value || 50}"
          class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      `;

    case 'switch':
      return `
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" ${properties.checked ? 'checked' : ''} class="sr-only peer">
          <div class="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          <span class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">${properties.label || children || 'Toggle'}</span>
        </label>
      `;

    case 'autocomplete':
      return `
        <div class="relative">
          <input
            type="text"
            placeholder="${properties.placeholder || 'Start typing...'}"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200"
          />
          <div class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg hidden">
            <div class="p-2 text-sm text-gray-700 dark:text-gray-300">Suggestions will appear here</div>
          </div>
        </div>
      `;

    case 'datepicker':
      return `
        <input
          type="date"
          value="${properties.value || ''}"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200"
        />
      `;

    case 'timepicker':
      return `
        <input
          type="time"
          value="${properties.value || ''}"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200"
        />
      `;

    // ==========================================
    // ACTIONS
    // ==========================================

    case 'button':
      const btnVariant = properties.variant || 'primary';
      const variantClasses: Record<string, string> = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white',
        secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
        success: 'bg-green-600 hover:bg-green-700 text-white',
        danger: 'bg-red-600 hover:bg-red-700 text-white',
        outline: 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
      };
      return `
        <button class="px-4 py-2 rounded font-medium transition-colors ${variantClasses[btnVariant] || variantClasses.primary}">
          ${children || properties.label || 'Button'}
        </button>
      `;

    case 'button-group':
      const orientation = properties.orientation || 'horizontal';
      const spacing = properties.spacing || 2;
      const buttons = properties.buttons || [];
      return `
        <div class="flex ${orientation === 'horizontal' ? 'flex-row' : 'flex-col'} gap-${spacing}">
          ${buttons.map((btn: any) => {
            const btnVariant = btn.variant || btn.color || 'primary';
            const btnVariantClasses: Record<string, string> = {
              primary: 'bg-blue-600 hover:bg-blue-700 text-white',
              secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
              contained: 'bg-blue-600 hover:bg-blue-700 text-white',
              outlined: 'border border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400',
              text: 'text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30',
              default: 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'
            };
            return `
              <button class="inline-flex items-center justify-center rounded font-medium transition-colors px-4 py-2 ${btnVariantClasses[btnVariant] || btnVariantClasses.primary}">
                ${btn.icon ? `<span class="mr-2">⚡</span>` : ''}${btn.label || 'Button'}
              </button>
            `;
          }).join('')}
        </div>
      `;

    case 'filterPanel':
      const filters = properties.filters || [];
      return `
        <div class="bg-white dark:bg-gray-800 ${baseClasses} p-4">
          <div class="font-semibold text-sm mb-4 text-gray-900 dark:text-gray-100">Filters</div>
          <div class="space-y-3">
            ${filters.map((filter: any) => {
              return `
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">${filter.label}</label>
                  ${filter.type === 'select'
                    ? `<select class="block w-full rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                         ${(filter.options || []).map((opt: string) => `<option>${opt}</option>`).join('')}
                       </select>`
                    : `<input type="text" placeholder="Filter by ${filter.field}" class="block w-full rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />`
                  }
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;

    case 'link':
      return `
        <a href="${properties.href || '#'}" class="text-blue-600 dark:text-blue-400 hover:underline">
          ${children || properties.label || 'Link'}
        </a>
      `;

    case 'icon':
      return `
        <svg class="h-${properties.size || 6} w-${properties.size || 6} text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      `;

    case 'menu':
      return `
        <div class="relative">
          <button class="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md">
            ${properties.label || 'Menu'}
          </button>
          <div class="absolute z-10 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg hidden">
            ${children || '<div class="p-2 text-sm text-gray-700 dark:text-gray-300">Menu items</div>'}
          </div>
        </div>
      `;

    // ==========================================
    // OVERLAYS & FEEDBACK
    // ==========================================

    case 'modal':
      return `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full">
            ${properties.title ? `<h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">${properties.title}</h3>` : ''}
            <div class="text-gray-700 dark:text-gray-300">
              ${children || 'Modal content'}
            </div>
          </div>
        </div>
      `;

    case 'dialog':
      return `
        <div class="bg-white dark:bg-gray-800 ${baseClasses} p-6 max-w-md">
          ${properties.title ? `<h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">${properties.title}</h3>` : ''}
          <div class="text-gray-700 dark:text-gray-300 mb-4">
            ${children || 'Dialog content'}
          </div>
          <div class="flex justify-end space-x-2">
            <button class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300">Cancel</button>
            <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">OK</button>
          </div>
        </div>
      `;

    case 'drawer':
      return `
        <div class="fixed inset-y-0 right-0 w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl transform translate-x-full transition-transform">
          ${properties.title ? `<h3 class="text-lg font-semibold p-4 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">${properties.title}</h3>` : ''}
          <div class="p-4 text-gray-700 dark:text-gray-300">
            ${children || 'Drawer content'}
          </div>
        </div>
      `;

    case 'popover':
      return `
        <div class="absolute z-10 bg-white dark:bg-gray-800 ${baseClasses} shadow-lg p-3 hidden">
          ${children || '<div class="text-sm text-gray-700 dark:text-gray-300">Popover content</div>'}
        </div>
      `;

    case 'tooltip':
      return `
        <span class="relative group">
          <span class="absolute bottom-full mb-2 hidden group-hover:block px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded whitespace-nowrap">
            ${properties.content || children || 'Tooltip'}
          </span>
          ${properties.trigger || '?'}
        </span>
      `;

    case 'alert':
      const alertVariant = properties.variant || 'info';
      const alertClasses: Record<string, string> = {
        info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200',
        success: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200',
        warning: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200',
        error: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200',
      };
      return `
        <div class="p-4 border rounded ${alertClasses[alertVariant] || alertClasses.info}">
          ${children || properties.message || 'Alert message'}
        </div>
      `;

    case 'snackbar':
      return `
        <div class="fixed bottom-4 right-4 bg-gray-900 dark:bg-gray-700 text-white px-4 py-3 rounded-md shadow-lg hidden">
          ${children || properties.message || 'Notification'}
        </div>
      `;

    case 'badge':
      const badgeVariant = properties.variant || 'default';
      const badgeClasses: Record<string, string> = {
        default: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
        primary: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
        success: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
        warning: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
        danger: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
      };
      return `
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClasses[badgeVariant] || badgeClasses.default}">
          ${children || properties.label || 'Badge'}
        </span>
      `;

    case 'spinner':
      return `
        <div class="animate-spin rounded-full h-${properties.size || 8} w-${properties.size || 8} border-b-2 border-blue-600 dark:border-blue-400"></div>
      `;

    // ==========================================
    // NAVIGATION
    // ==========================================

    case 'tabs':
      return `
        <div>
          <div class="border-b border-gray-200 dark:border-gray-700">
            <nav class="flex space-x-4">
              ${(properties.tabs || ['Tab 1', 'Tab 2']).map((tab: string, i: number) =>
                `<button class="px-4 py-2 ${i === 0 ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}">${tab}</button>`
              ).join('')}
            </nav>
          </div>
          <div class="mt-4">
            ${children || 'Tab content'}
          </div>
        </div>
      `;

    case 'breadcrumb':
      return `
        <nav class="flex" aria-label="Breadcrumb">
          <ol class="inline-flex items-center space-x-1 md:space-x-3">
            ${(properties.items || ['Home', 'Page']).map((item: string, i: number) =>
              `<li class="inline-flex items-center">
                ${i > 0 ? '<svg class="w-3 h-3 text-gray-400 mx-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path></svg>' : ''}
                <span class="text-gray-700 dark:text-gray-300">${item}</span>
              </li>`
            ).join('')}
          </ol>
        </nav>
      `;

    case 'navbar':
      return `
        <nav class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div class="px-4 py-3 flex items-center justify-between">
            <div class="text-lg font-semibold text-gray-900 dark:text-gray-100">${properties.brand || 'Brand'}</div>
            <div class="flex space-x-4">
              ${children || '<a class="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">Link</a>'}
            </div>
          </div>
        </nav>
      `;

    case 'sidebar':
      return `
        <aside class="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full">
          <div class="p-4">
            ${children || '<div class="text-gray-700 dark:text-gray-300">Sidebar content</div>'}
          </div>
        </aside>
      `;

    case 'pagination':
      const currentPage = properties.currentPage || 1;
      const totalPages = properties.totalPages || 5;
      return `
        <nav class="flex items-center justify-center space-x-2">
          <button class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
          ${Array.from({ length: totalPages }, (_, i) => i + 1).map(page =>
            `<button class="px-3 py-1 ${page === currentPage ? 'bg-blue-600 text-white' : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'} rounded-md">${page}</button>`
          ).join('')}
          <button class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
        </nav>
      `;

    // ==========================================
    // LAYOUT
    // ==========================================

    case 'accordion':
      return `
        <div class="space-y-2">
          ${(properties.items || ['Item 1']).map((item: string) =>
            `<div class="border border-gray-200 dark:border-gray-700 rounded-md">
              <button class="w-full px-4 py-3 text-left font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800">
                ${item}
              </button>
              <div class="px-4 py-3 text-gray-700 dark:text-gray-300 hidden">
                Content for ${item}
              </div>
            </div>`
          ).join('')}
        </div>
      `;

    case 'carousel':
      return `
        <div class="relative">
          <div class="overflow-hidden rounded-lg">
            ${children || '<div class="bg-gray-200 dark:bg-gray-700 h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">Slide 1</div>'}
          </div>
          <button class="absolute left-2 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full p-2 shadow">←</button>
          <button class="absolute right-2 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full p-2 shadow">→</button>
        </div>
      `;

    case 'container':
      return `
        <div class="container mx-auto px-4 ${properties.maxWidth ? `max-w-${properties.maxWidth}` : ''}">
          ${children || 'Container content'}
        </div>
      `;

    case 'divider':
      return `
        <hr class="border-gray-200 dark:border-gray-700 ${properties.spacing ? `my-${properties.spacing}` : 'my-4'}" />
      `;

    case 'header':
      return `
        <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
            ${children || properties.title || 'Header'}
          </h1>
        </header>
      `;

    case 'footer':
      return `
        <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-6">
          <div class="text-center text-gray-600 dark:text-gray-400">
            ${children || properties.text || 'Footer content'}
          </div>
        </footer>
      `;

    // ==========================================
    // COMPOSITE/SEMANTIC TYPES (from inference)
    // ==========================================

    case 'content':
      // Content is a card-like display of labeled fields (detail view)
      // Fields should be passed in properties.fields array
      const fields = properties.fields || [];
      if (fields.length === 0) {
        return `
          <div class="bg-white dark:bg-gray-800 ${baseClasses} p-6">
            <p class="text-gray-500 dark:text-gray-400">No content defined</p>
          </div>
        `;
      }

      // Render as card with labeled fields (like a read-only form)
      const fieldRows = fields.map((field: string) => `
        <div class="py-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">${field}</dt>
          <dd class="text-base text-gray-900 dark:text-gray-100">
            <span class="data-field" data-field="${field}">-</span>
          </dd>
        </div>
      `).join('');

      return `
        <div class="bg-white dark:bg-gray-800 ${baseClasses} p-6">
          <dl class="space-y-0">
            ${fieldRows}
          </dl>
        </div>
      `;

    case 'profile':
      return `
        <div class="bg-white dark:bg-gray-800 ${baseClasses} p-6">
          <div class="flex items-center space-x-4">
            <div class="flex-shrink-0">
              <div class="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold">
                ${properties.name ? properties.name.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                ${properties.name || 'User Profile'}
              </p>
              ${properties.bio ? `<p class="text-sm text-gray-600 dark:text-gray-400">${properties.bio}</p>` : ''}
              ${properties.email ? `<p class="text-sm text-gray-500 dark:text-gray-500">${properties.email}</p>` : ''}
            </div>
          </div>
          ${children || ''}
        </div>
      `;

    // ==========================================
    // FALLBACK
    // ==========================================

    default:
      return `
        <div class="p-4 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded">
          <p class="text-sm text-orange-800 dark:text-orange-200">
            Component type "${type}" renderer not yet implemented
          </p>
          ${properties ? `<pre class="text-xs text-orange-600 dark:text-orange-400 mt-2">${JSON.stringify(properties, null, 2)}</pre>` : ''}
        </div>
      `;
  }
}

/**
 * Create a universal Tailwind adapter for all 44 atomic component types
 */
export function createUniversalTailwindAdapter(): ComponentAdapter {
  // List of all 44 atomic component types from ATOMIC_COMPONENTS registry
  // Plus 4 composite/semantic types (button-group, filterPanel, content, profile) from inference
  const componentTypes = [
    // Data Display (9)
    'table', 'list', 'grid', 'card', 'chart', 'tree', 'timeline', 'avatar', 'image',
    // Forms & Inputs (11)
    'form', 'input', 'textarea', 'select', 'checkbox', 'radio', 'slider', 'switch', 'autocomplete', 'datepicker', 'timepicker',
    // Actions (4 + 1 composite)
    'button', 'link', 'icon', 'menu', 'button-group',
    // Overlays & Feedback (9)
    'modal', 'dialog', 'drawer', 'popover', 'tooltip', 'alert', 'snackbar', 'badge', 'spinner',
    // Navigation (5)
    'tabs', 'breadcrumb', 'navbar', 'sidebar', 'pagination',
    // Layout (6 + 1 composite)
    'accordion', 'carousel', 'container', 'divider', 'header', 'footer', 'filterPanel',
    // Semantic/Composite (2 from inference)
    'content', 'profile'
  ];

  const components: Record<string, { render: (context: RenderContext) => string }> = {};

  // Generate render function for each component type
  componentTypes.forEach(type => {
    components[type] = {
      render: ({ properties = {}, children }: RenderContext) => {
        return generateTailwindMarkup(type, properties, children);
      }
    };
  });

  return {
    name: 'tailwind-universal',
    version: '1.0.0',
    description: 'Universal Tailwind CSS adapter for all 44 atomic component types',
    components
  };
}
