/**
 * Atomic Components Registry
 *
 * Defines all 49 atomic component types.
 * Each type has metadata about its purpose, properties, and usage patterns.
 *
 * This registry is framework-agnostic. UI library adapters (shadcn, MUI, etc.)
 * implement these types using their specific components.
 */

export interface AtomicComponentDefinition {
  /** Component type identifier (matches schema enum) */
  type: string;

  /** Human-readable name */
  name: string;

  /** Category from v3.4 schema */
  category: 'data-display' | 'forms-inputs' | 'actions' | 'overlays-feedback' |
            'navigation' | 'layout' | 'progress' | 'specialized';

  /** Description of component purpose */
  description: string;

  /** Common SpecVerse properties this component accepts */
  properties: string[];

  /** Whether this component can contain child components */
  canHaveChildren: boolean;

  /** Example usage in SpecVerse spec */
  example: string;
}

/**
 * Complete registry of all 49 atomic component types
 */
export const ATOMIC_COMPONENTS_REGISTRY: Record<string, AtomicComponentDefinition> = {
  // =========================================================================
  // DATA DISPLAY (9 types)
  // =========================================================================

  table: {
    type: 'table',
    name: 'Table',
    category: 'data-display',
    description: 'Tabular data display with rows, columns, sorting, and pagination',
    properties: ['columns', 'sortable', 'filterable', 'pagination', 'compact', 'selectable', 'exportable'],
    canHaveChildren: false,
    example: `
      taskTable:
        type: table
        model: Task
        columns: [title, status, priority, assignee, dueDate]
        features: [sorting, filtering, pagination]
    `
  },

  list: {
    type: 'list',
    name: 'List',
    category: 'data-display',
    description: 'Vertical list of items, often with avatars or icons',
    properties: ['items', 'itemTemplate', 'dividers', 'dense', 'interactive'],
    canHaveChildren: true,
    example: `
      userList:
        type: list
        model: User
        properties:
          dense: true
          dividers: true
    `
  },

  grid: {
    type: 'grid',
    name: 'Grid',
    category: 'data-display',
    description: 'Grid layout for cards or items',
    properties: ['columns', 'gap', 'responsive', 'itemsPerRow'],
    canHaveChildren: true,
    example: `
      projectGrid:
        type: grid
        properties:
          columns: 3
          gap: medium
          responsive: true
    `
  },

  card: {
    type: 'card',
    name: 'Card',
    category: 'data-display',
    description: 'Container with optional header, content, and actions',
    properties: ['title', 'subtitle', 'variant', 'elevation', 'clickable', 'hoverable', 'compact', 'showTrend', 'metric'],
    canHaveChildren: true,
    example: `
      budgetCard:
        type: card
        properties:
          variant: metric
          showTrend: true
          metric: budget
    `
  },

  chart: {
    type: 'chart',
    name: 'Chart',
    category: 'data-display',
    description: 'Data visualization (line, bar, pie, etc.)',
    properties: ['chartType', 'data', 'responsive', 'showLegend', 'interactive', 'exportable'],
    canHaveChildren: false,
    example: `
      trendChart:
        type: chart
        properties:
          chartType: trend
          responsive: true
          showLegend: true
    `
  },

  tree: {
    type: 'tree',
    name: 'Tree',
    category: 'data-display',
    description: 'Hierarchical tree structure',
    properties: ['data', 'expandable', 'selectable', 'checkboxes', 'defaultExpanded'],
    canHaveChildren: false,
    example: `
      categoryTree:
        type: tree
        properties:
          expandable: true
          defaultExpanded: false
    `
  },

  timeline: {
    type: 'timeline',
    name: 'Timeline',
    category: 'data-display',
    description: 'Chronological event timeline',
    properties: ['orientation', 'showDateMarkers', 'showDuration', 'showUser'],
    canHaveChildren: true,
    example: `
      activityTimeline:
        type: timeline
        properties:
          orientation: vertical
          showDateMarkers: true
    `
  },

  avatar: {
    type: 'avatar',
    name: 'Avatar',
    category: 'data-display',
    description: 'User avatar or profile image',
    properties: ['src', 'alt', 'size', 'shape', 'initials', 'badge'],
    canHaveChildren: false,
    example: `
      userAvatar:
        type: avatar
        properties:
          size: medium
          shape: circle
    `
  },

  image: {
    type: 'image',
    name: 'Image',
    category: 'data-display',
    description: 'Image display with optional caption',
    properties: ['src', 'alt', 'width', 'height', 'objectFit', 'caption', 'lazy'],
    canHaveChildren: false,
    example: `
      projectImage:
        type: image
        properties:
          objectFit: cover
          lazy: true
    `
  },

  // =========================================================================
  // FORMS & INPUTS (11 types)
  // =========================================================================

  form: {
    type: 'form',
    name: 'Form',
    category: 'forms-inputs',
    description: 'Form container with validation and submission',
    properties: ['onSubmit', 'validation', 'autoSave', 'showValidation', 'layout'],
    canHaveChildren: true,
    example: `
      taskForm:
        type: form
        properties:
          autoSave: false
          showValidation: true
    `
  },

  input: {
    type: 'input',
    name: 'Input',
    category: 'forms-inputs',
    description: 'Text input field',
    properties: ['label', 'placeholder', 'required', 'type', 'disabled', 'error', 'helperText', 'icon', 'multiline'],
    canHaveChildren: false,
    example: `
      titleInput:
        type: input
        properties:
          label: "Title"
          placeholder: "Enter task title"
          required: true
    `
  },

  textarea: {
    type: 'textarea',
    name: 'Textarea',
    category: 'forms-inputs',
    description: 'Multi-line text input',
    properties: ['label', 'placeholder', 'rows', 'required', 'maxLength', 'resize'],
    canHaveChildren: false,
    example: `
      descriptionInput:
        type: textarea
        properties:
          label: "Description"
          rows: 4
    `
  },

  select: {
    type: 'select',
    name: 'Select',
    category: 'forms-inputs',
    description: 'Dropdown selection',
    properties: ['label', 'options', 'required', 'multiple', 'placeholder', 'searchable'],
    canHaveChildren: false,
    example: `
      statusSelect:
        type: select
        properties:
          label: "Status"
          options: [todo, in_progress, done]
          required: true
    `
  },

  checkbox: {
    type: 'checkbox',
    name: 'Checkbox',
    category: 'forms-inputs',
    description: 'Checkbox for boolean values',
    properties: ['label', 'checked', 'disabled', 'indeterminate'],
    canHaveChildren: false,
    example: `
      completedCheckbox:
        type: checkbox
        properties:
          label: "Completed"
    `
  },

  radio: {
    type: 'radio',
    name: 'Radio',
    category: 'forms-inputs',
    description: 'Radio button group',
    properties: ['label', 'options', 'orientation', 'required'],
    canHaveChildren: false,
    example: `
      priorityRadio:
        type: radio
        properties:
          label: "Priority"
          options: [low, medium, high]
          orientation: horizontal
    `
  },

  slider: {
    type: 'slider',
    name: 'Slider',
    category: 'forms-inputs',
    description: 'Slider for numeric ranges',
    properties: ['label', 'min', 'max', 'step', 'value', 'marks', 'showValue'],
    canHaveChildren: false,
    example: `
      progressSlider:
        type: slider
        properties:
          label: "Progress"
          min: 0
          max: 100
          showValue: true
    `
  },

  switch: {
    type: 'switch',
    name: 'Switch',
    category: 'forms-inputs',
    description: 'Toggle switch for boolean values',
    properties: ['label', 'checked', 'disabled', 'size'],
    canHaveChildren: false,
    example: `
      notificationsSwitch:
        type: switch
        properties:
          label: "Enable Notifications"
    `
  },

  autocomplete: {
    type: 'autocomplete',
    name: 'Autocomplete',
    category: 'forms-inputs',
    description: 'Searchable dropdown with autocomplete',
    properties: ['label', 'options', 'multiple', 'searchable', 'placeholder', 'limit', 'freeSolo'],
    canHaveChildren: false,
    example: `
      assigneeSelect:
        type: autocomplete
        model: User
        properties:
          label: "Assignee"
          searchable: true
    `
  },

  datepicker: {
    type: 'datepicker',
    name: 'DatePicker',
    category: 'forms-inputs',
    description: 'Date selection input',
    properties: ['label', 'format', 'minDate', 'maxDate', 'required', 'showTime', 'range'],
    canHaveChildren: false,
    example: `
      dueDatePicker:
        type: datepicker
        properties:
          label: "Due Date"
          format: "MM/DD/YYYY"
    `
  },

  timepicker: {
    type: 'timepicker',
    name: 'TimePicker',
    category: 'forms-inputs',
    description: 'Time selection input',
    properties: ['label', 'format', 'required', 'step', 'use24Hour'],
    canHaveChildren: false,
    example: `
      meetingTime:
        type: timepicker
        properties:
          label: "Meeting Time"
          use24Hour: false
    `
  },

  // =========================================================================
  // ACTIONS (5 types)
  // =========================================================================

  button: {
    type: 'button',
    name: 'Button',
    category: 'actions',
    description: 'Clickable button',
    properties: ['label', 'variant', 'size', 'disabled', 'loading', 'icon', 'onClick', 'type'],
    canHaveChildren: false,
    example: `
      submitButton:
        type: button
        properties:
          label: "Submit"
          variant: primary
          type: submit
    `
  },

  'button-group': {
    type: 'button-group',
    name: 'ButtonGroup',
    category: 'actions',
    description: 'Group of related buttons',
    properties: ['orientation', 'variant', 'size', 'buttons'],
    canHaveChildren: true,
    example: `
      actions:
        type: button-group
        properties:
          orientation: horizontal
        uiComponents:
          editButton: { type: button }
          deleteButton: { type: button }
    `
  },

  link: {
    type: 'link',
    name: 'Link',
    category: 'actions',
    description: 'Hyperlink or navigation link',
    properties: ['href', 'label', 'external', 'underline', 'color'],
    canHaveChildren: false,
    example: `
      viewDetails:
        type: link
        properties:
          label: "View Details"
          href: "/tasks/:id"
    `
  },

  icon: {
    type: 'icon',
    name: 'Icon',
    category: 'actions',
    description: 'Icon display',
    properties: ['name', 'size', 'color', 'clickable', 'tooltip'],
    canHaveChildren: false,
    example: `
      deleteIcon:
        type: icon
        properties:
          name: "trash"
          color: danger
    `
  },

  menu: {
    type: 'menu',
    name: 'Menu',
    category: 'actions',
    description: 'Dropdown menu with actions',
    properties: ['items', 'trigger', 'placement'],
    canHaveChildren: true,
    example: `
      contextMenu:
        type: menu
        properties:
          trigger: click
          placement: bottom-start
    `
  },

  // =========================================================================
  // OVERLAYS & FEEDBACK (9 types)
  // =========================================================================

  modal: {
    type: 'modal',
    name: 'Modal',
    category: 'overlays-feedback',
    description: 'Modal dialog overlay',
    properties: ['title', 'size', 'closeOnBackdrop', 'closeButton', 'footer'],
    canHaveChildren: true,
    example: `
      confirmDialog:
        type: modal
        properties:
          title: "Confirm Deletion"
          size: small
          closeOnBackdrop: false
    `
  },

  dialog: {
    type: 'dialog',
    name: 'Dialog',
    category: 'overlays-feedback',
    description: 'Dialog box (similar to modal, often simpler)',
    properties: ['title', 'message', 'actions', 'variant'],
    canHaveChildren: true,
    example: `
      alertDialog:
        type: dialog
        properties:
          title: "Alert"
          variant: warning
    `
  },

  drawer: {
    type: 'drawer',
    name: 'Drawer',
    category: 'overlays-feedback',
    description: 'Slide-out panel from edge',
    properties: ['position', 'width', 'closeOnBackdrop', 'persistent'],
    canHaveChildren: true,
    example: `
      filterDrawer:
        type: drawer
        properties:
          position: right
          width: 400
    `
  },

  popover: {
    type: 'popover',
    name: 'Popover',
    category: 'overlays-feedback',
    description: 'Floating content container',
    properties: ['trigger', 'placement', 'arrow', 'offset'],
    canHaveChildren: true,
    example: `
      helpPopover:
        type: popover
        properties:
          trigger: hover
          placement: top
    `
  },

  tooltip: {
    type: 'tooltip',
    name: 'Tooltip',
    category: 'overlays-feedback',
    description: 'Brief informational tooltip',
    properties: ['content', 'placement', 'arrow', 'delay'],
    canHaveChildren: false,
    example: `
      infoTooltip:
        type: tooltip
        properties:
          content: "Additional information"
          placement: top
    `
  },

  alert: {
    type: 'alert',
    name: 'Alert',
    category: 'overlays-feedback',
    description: 'Alert or notification message',
    properties: ['variant', 'title', 'message', 'closable', 'icon'],
    canHaveChildren: false,
    example: `
      successAlert:
        type: alert
        properties:
          variant: success
          message: "Task created successfully"
    `
  },

  snackbar: {
    type: 'snackbar',
    name: 'Snackbar',
    category: 'overlays-feedback',
    description: 'Temporary notification (toast)',
    properties: ['message', 'duration', 'position', 'action', 'variant'],
    canHaveChildren: false,
    example: `
      notification:
        type: snackbar
        properties:
          message: "Changes saved"
          duration: 3000
          position: bottom-right
    `
  },

  badge: {
    type: 'badge',
    name: 'Badge',
    category: 'overlays-feedback',
    description: 'Small status indicator or count',
    properties: ['content', 'variant', 'position', 'max', 'dot'],
    canHaveChildren: false,
    example: `
      notificationBadge:
        type: badge
        properties:
          content: 5
          variant: error
    `
  },

  spinner: {
    type: 'spinner',
    name: 'Spinner',
    category: 'overlays-feedback',
    description: 'Loading spinner',
    properties: ['size', 'color', 'thickness'],
    canHaveChildren: false,
    example: `
      loadingSpinner:
        type: spinner
        properties:
          size: medium
    `
  },

  // =========================================================================
  // NAVIGATION (5 types)
  // =========================================================================

  tabs: {
    type: 'tabs',
    name: 'Tabs',
    category: 'navigation',
    description: 'Tabbed navigation',
    properties: ['orientation', 'variant', 'sections', 'showProgress'],
    canHaveChildren: true,
    example: `
      profileTabs:
        type: tabs
        properties:
          sections: [about, activity, settings]
    `
  },

  breadcrumb: {
    type: 'breadcrumb',
    name: 'Breadcrumb',
    category: 'navigation',
    description: 'Breadcrumb navigation trail',
    properties: ['items', 'separator', 'maxItems'],
    canHaveChildren: false,
    example: `
      pageBreadcrumb:
        type: breadcrumb
        properties:
          separator: "/"
    `
  },

  navbar: {
    type: 'navbar',
    name: 'Navbar',
    category: 'navigation',
    description: 'Top navigation bar',
    properties: ['brand', 'items', 'sticky', 'transparent'],
    canHaveChildren: true,
    example: `
      mainNav:
        type: navbar
        properties:
          sticky: true
    `
  },

  sidebar: {
    type: 'sidebar',
    name: 'Sidebar',
    category: 'navigation',
    description: 'Side navigation menu',
    properties: ['items', 'collapsible', 'width', 'position'],
    canHaveChildren: true,
    example: `
      appSidebar:
        type: sidebar
        properties:
          collapsible: true
          position: left
    `
  },

  pagination: {
    type: 'pagination',
    name: 'Pagination',
    category: 'navigation',
    description: 'Page navigation controls',
    properties: ['pageSize', 'total', 'showSizeChanger', 'showTotal'],
    canHaveChildren: false,
    example: `
      tablePagination:
        type: pagination
        properties:
          pageSize: 25
          showSizeChanger: true
    `
  },

  // =========================================================================
  // LAYOUT (6 types)
  // =========================================================================

  accordion: {
    type: 'accordion',
    name: 'Accordion',
    category: 'layout',
    description: 'Expandable/collapsible sections',
    properties: ['allowMultiple', 'defaultExpanded', 'variant'],
    canHaveChildren: true,
    example: `
      faqAccordion:
        type: accordion
        properties:
          allowMultiple: false
    `
  },

  carousel: {
    type: 'carousel',
    name: 'Carousel',
    category: 'layout',
    description: 'Slideshow of items',
    properties: ['autoplay', 'interval', 'showArrows', 'showDots', 'infinite'],
    canHaveChildren: true,
    example: `
      imageCarousel:
        type: carousel
        properties:
          autoplay: true
          interval: 5000
    `
  },

  container: {
    type: 'container',
    name: 'Container',
    category: 'layout',
    description: 'Generic layout container',
    properties: ['layout', 'gap', 'padding', 'alignment', 'scrollable', 'renderType', 'allowDrop'],
    canHaveChildren: true,
    example: `
      boardContainer:
        type: container
        properties:
          layout: horizontal
          scrollable: true
    `
  },

  divider: {
    type: 'divider',
    name: 'Divider',
    category: 'layout',
    description: 'Visual separator',
    properties: ['orientation', 'variant', 'spacing'],
    canHaveChildren: false,
    example: `
      sectionDivider:
        type: divider
        properties:
          orientation: horizontal
    `
  },

  header: {
    type: 'header',
    name: 'Header',
    category: 'layout',
    description: 'Header section',
    properties: ['title', 'subtitle', 'showAvatar', 'showCover', 'actions'],
    canHaveChildren: true,
    example: `
      pageHeader:
        type: header
        properties:
          title: "Dashboard"
    `
  },

  footer: {
    type: 'footer',
    name: 'Footer',
    category: 'layout',
    description: 'Footer section',
    properties: ['content', 'links', 'copyright', 'sticky'],
    canHaveChildren: true,
    example: `
      pageFooter:
        type: footer
        properties:
          copyright: "2025 Company"
    `
  },

  // =========================================================================
  // PROGRESS (2 types)
  // =========================================================================

  'progress-bar': {
    type: 'progress-bar',
    name: 'ProgressBar',
    category: 'progress',
    description: 'Linear progress indicator',
    properties: ['value', 'max', 'label', 'variant', 'animated'],
    canHaveChildren: false,
    example: `
      taskProgress:
        type: progress-bar
        properties:
          value: 75
          max: 100
          label: true
    `
  },

  'progress-circle': {
    type: 'progress-circle',
    name: 'ProgressCircle',
    category: 'progress',
    description: 'Circular progress indicator',
    properties: ['value', 'max', 'size', 'thickness', 'label'],
    canHaveChildren: false,
    example: `
      completionProgress:
        type: progress-circle
        properties:
          value: 75
          size: large
    `
  },

  // =========================================================================
  // SPECIALIZED (2 types)
  // =========================================================================

  searchBar: {
    type: 'searchBar',
    name: 'SearchBar',
    category: 'specialized',
    description: 'Search input with icon and actions',
    properties: ['placeholder', 'onSearch', 'showClear', 'autofocus'],
    canHaveChildren: false,
    example: `
      taskSearch:
        type: searchBar
        properties:
          placeholder: "Search tasks..."
          showClear: true
    `
  },

  filterPanel: {
    type: 'filterPanel',
    name: 'FilterPanel',
    category: 'specialized',
    description: 'Panel with multiple filter controls',
    properties: ['position', 'collapsible', 'advanced', 'showDateRange', 'showCategories', 'showActivityTypes'],
    canHaveChildren: true,
    example: `
      dataFilters:
        type: filterPanel
        properties:
          position: top
          collapsible: true
          advanced: true
    `
  },
};

/**
 * Get component definition by type
 */
export function getComponentDefinition(type: string): AtomicComponentDefinition | undefined {
  return ATOMIC_COMPONENTS_REGISTRY[type];
}

/**
 * Get all components in a category
 */
export function getComponentsByCategory(category: string): AtomicComponentDefinition[] {
  return Object.values(ATOMIC_COMPONENTS_REGISTRY).filter(comp => comp.category === category);
}

/**
 * Validate if a component type exists
 */
export function isValidComponentType(type: string): boolean {
  return type in ATOMIC_COMPONENTS_REGISTRY;
}

/**
 * Get all component types as array
 */
export function getAllComponentTypes(): string[] {
  return Object.keys(ATOMIC_COMPONENTS_REGISTRY);
}

/**
 * Component categories summary
 */
export const COMPONENT_CATEGORIES = {
  'data-display': 9,
  'forms-inputs': 11,
  'actions': 5,
  'overlays-feedback': 9,
  'navigation': 5,
  'layout': 6,
  'progress': 2,
  'specialized': 2,
} as const;

/**
 * Total count: 49 atomic components
 */
export const TOTAL_COMPONENT_COUNT = 49;
