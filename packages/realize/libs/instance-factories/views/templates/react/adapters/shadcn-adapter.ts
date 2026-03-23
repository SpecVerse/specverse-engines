/**
 * shadcn/ui Adapter
 *
 * Maps all 49 SpecVerse atomic component types to shadcn/ui components.
 * shadcn/ui: https://ui.shadcn.com/
 *
 * Architecture:
 * - Uses @/components/ui/* import pattern
 * - Tailwind CSS for styling
 * - Radix UI primitives underneath
 */

import type { ComponentLibraryAdapter, RenderContext } from '../../shared/adapter-types.js';
import { renderProps } from '../../shared/adapter-types.js';

export const shadcnAdapter: ComponentLibraryAdapter = {
  name: 'shadcn/ui',
  version: 'latest',
  description: 'shadcn/ui component library adapter for SpecVerse v3.4.0',

  baseDependencies: [
    { name: 'react', version: '^18.2.0' },
    { name: 'react-dom', version: '^18.2.0' },
    { name: 'tailwindcss', version: '^3.4.0' },
    { name: '@radix-ui/react-icons', version: '^1.3.0' },
    { name: 'class-variance-authority', version: '^0.7.0' },
    { name: 'clsx', version: '^2.0.0' },
    { name: 'tailwind-merge', version: '^2.0.0' },
  ],

  config: {
    importPrefix: '@/components/ui',
    importStyle: 'named',
  },

  components: {
    // =====================================================================
    // DATA DISPLAY (9 types)
    // =====================================================================

    table: {
      imports: [
        "import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'",
      ],
      render: (ctx: RenderContext) => {
        const { properties, model, name } = ctx;
        const columns = properties.columns || ['id'];
        const modelVar = model?.name?.toLowerCase() || 'item';
        const pluralVar = `${modelVar}s`;

        return `<Table>
  <TableHeader>
    <TableRow>
      ${columns.map((col: string) => `<TableHead>${col}</TableHead>`).join('\n      ')}
    </TableRow>
  </TableHeader>
  <TableBody>
    {${pluralVar}?.map((${modelVar}) => (
      <TableRow key={${modelVar}.id}>
        ${columns.map((col: string) => `<TableCell>{${modelVar}.${col}}</TableCell>`).join('\n        ')}
      </TableRow>
    ))}
  </TableBody>
</Table>`;
      },
      dependencies: [{ name: '@/components/ui/table', version: 'latest' }],
    },

    list: {
      imports: ["import { ScrollArea } from '@/components/ui/scroll-area'"],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;
        const className = properties.dense ? 'space-y-1' : 'space-y-4';

        return `<ScrollArea className="${className}">
  ${children || '/* List items */'}
</ScrollArea>`;
      },
    },

    grid: {
      imports: [],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;
        const columns = properties.columns || 3;
        const gap = properties.gap === 'small' ? '2' : properties.gap === 'large' ? '8' : '4';

        return `<div className="grid grid-cols-${columns} gap-${gap}">
  ${children || '/* Grid items */'}
</div>`;
      },
    },

    card: {
      imports: [
        "import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'",
      ],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;
        const { title, subtitle, variant } = properties;

        if (variant === 'metric') {
          return `<Card>
  <CardHeader>
    <CardTitle className="text-sm font-medium">${title || properties.metric || 'Metric'}</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">{/* Value */}</div>
    ${properties.showTrend ? '<p className="text-xs text-muted-foreground">↑ 12% from last month</p>' : ''}
  </CardContent>
</Card>`;
        }

        return `<Card>
  ${title ? `<CardHeader>
    <CardTitle>${title}</CardTitle>
    ${subtitle ? `<CardDescription>${subtitle}</CardDescription>` : ''}
  </CardHeader>` : ''}
  <CardContent>
    ${children || '/* Card content */'}
  </CardContent>
</Card>`;
      },
    },

    chart: {
      imports: [
        "import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'",
      ],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        const chartType = properties.chartType || 'line';

        const chartMap: Record<string, string> = {
          line: '<LineChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="value" stroke="#8884d8" /></LineChart>',
          bar: '<BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="value" fill="#8884d8" /></BarChart>',
          pie: '<PieChart><Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label /></PieChart>',
          trend: '<LineChart data={data}><Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} dot={false} /></LineChart>',
        };

        const chart = chartMap[chartType] || chartMap.line;

        return `<ResponsiveContainer width="100%" height={${properties.height || 300}}>
  ${chart}
</ResponsiveContainer>`;
      },
      dependencies: [{ name: 'recharts', version: '^2.10.0' }],
    },

    tree: {
      imports: [],
      render: () => `<div className="tree-view">
  {/* TODO: Implement tree component */}
</div>`,
    },

    timeline: {
      imports: [],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;
        const orientation = properties.orientation || 'vertical';

        return `<div className="relative ${orientation === 'horizontal' ? 'flex space-x-8' : 'space-y-8'}">
  ${children || '/* Timeline items */'}
</div>`;
      },
    },

    avatar: {
      imports: ["import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        const size = properties.size === 'large' ? 'h-16 w-16' : properties.size === 'small' ? 'h-8 w-8' : 'h-12 w-12';

        return `<Avatar className="${size}">
  <AvatarImage src={${properties.src || 'user.avatar'}} alt="${properties.alt || 'Avatar'}" />
  <AvatarFallback>${properties.initials || 'U'}</AvatarFallback>
</Avatar>`;
      },
    },

    image: {
      imports: [],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        return `<img
  src={${properties.src || 'imageSrc'}}
  alt="${properties.alt || ''}"
  className="${properties.objectFit === 'cover' ? 'object-cover' : 'object-contain'} ${properties.lazy ? 'loading="lazy"' : ''}"
/>`;
      },
    },

    // =====================================================================
    // FORMS & INPUTS (11 types)
    // =====================================================================

    form: {
      imports: ["import { Form } from '@/components/ui/form'"],
      render: (ctx: RenderContext) => {
        const { children } = ctx;
        return `<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
    ${children || '/* Form fields */'}
  </form>
</Form>`;
      },
    },

    input: {
      imports: ["import { Input } from '@/components/ui/input'", "import { Label } from '@/components/ui/label'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        return `<div className="grid w-full items-center gap-1.5">
  ${properties.label ? `<Label htmlFor="${properties.name || 'input'}">${properties.label}${properties.required ? ' *' : ''}</Label>` : ''}
  <Input
    type="${properties.type || 'text'}"
    id="${properties.name || 'input'}"
    placeholder="${properties.placeholder || ''}"
    ${properties.required ? 'required' : ''}
    ${properties.disabled ? 'disabled' : ''}
  />
  ${properties.helperText ? `<p className="text-sm text-muted-foreground">${properties.helperText}</p>` : ''}
</div>`;
      },
    },

    textarea: {
      imports: ["import { Textarea } from '@/components/ui/textarea'", "import { Label } from '@/components/ui/label'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        return `<div className="grid w-full gap-1.5">
  ${properties.label ? `<Label htmlFor="${properties.name || 'textarea'}">${properties.label}</Label>` : ''}
  <Textarea
    id="${properties.name || 'textarea'}"
    placeholder="${properties.placeholder || ''}"
    rows={${properties.rows || 4}}
    ${properties.required ? 'required' : ''}
  />
</div>`;
      },
    },

    select: {
      imports: [
        "import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'",
        "import { Label } from '@/components/ui/label'",
      ],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        const options = properties.options || [];

        return `<div className="grid w-full gap-1.5">
  ${properties.label ? `<Label>${properties.label}${properties.required ? ' *' : ''}</Label>` : ''}
  <Select>
    <SelectTrigger>
      <SelectValue placeholder="${properties.placeholder || 'Select option'}" />
    </SelectTrigger>
    <SelectContent>
      ${options.map((opt: string) => `<SelectItem value="${opt}">${opt}</SelectItem>`).join('\n      ')}
    </SelectContent>
  </Select>
</div>`;
      },
    },

    checkbox: {
      imports: ["import { Checkbox } from '@/components/ui/checkbox'", "import { Label } from '@/components/ui/label'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        return `<div className="flex items-center space-x-2">
  <Checkbox id="${properties.name || 'checkbox'}" ${properties.checked ? 'checked' : ''} ${properties.disabled ? 'disabled' : ''} />
  ${properties.label ? `<Label htmlFor="${properties.name || 'checkbox'}">${properties.label}</Label>` : ''}
</div>`;
      },
    },

    radio: {
      imports: ["import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'", "import { Label } from '@/components/ui/label'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        const options = properties.options || [];

        return `<div className="grid gap-2">
  ${properties.label ? `<Label>${properties.label}</Label>` : ''}
  <RadioGroup>
    ${options.map((opt: string) => `<div className="flex items-center space-x-2">
      <RadioGroupItem value="${opt}" id="${opt}" />
      <Label htmlFor="${opt}">${opt}</Label>
    </div>`).join('\n    ')}
  </RadioGroup>
</div>`;
      },
    },

    slider: {
      imports: ["import { Slider } from '@/components/ui/slider'", "import { Label } from '@/components/ui/label'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        return `<div className="grid gap-2">
  ${properties.label ? `<Label>${properties.label}</Label>` : ''}
  <Slider
    min={${properties.min || 0}}
    max={${properties.max || 100}}
    step={${properties.step || 1}}
    defaultValue={[${properties.value || 50}]}
  />
  ${properties.showValue ? '<span className="text-sm text-muted-foreground">{value}</span>' : ''}
</div>`;
      },
    },

    switch: {
      imports: ["import { Switch } from '@/components/ui/switch'", "import { Label } from '@/components/ui/label'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        return `<div className="flex items-center space-x-2">
  <Switch id="${properties.name || 'switch'}" ${properties.checked ? 'checked' : ''} ${properties.disabled ? 'disabled' : ''} />
  ${properties.label ? `<Label htmlFor="${properties.name || 'switch'}">${properties.label}</Label>` : ''}
</div>`;
      },
    },

    autocomplete: {
      imports: [
        "import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'",
        "import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'",
        "import { Button } from '@/components/ui/button'",
      ],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        return `<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" role="combobox">
      {selected || "${properties.placeholder || 'Select...'}"}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-[200px] p-0">
    <Command>
      <CommandInput placeholder="${properties.label || 'Search...'}" />
      <CommandEmpty>No results found.</CommandEmpty>
      <CommandGroup>
        {/* Options */}
      </CommandGroup>
    </Command>
  </PopoverContent>
</Popover>`;
      },
    },

    datepicker: {
      imports: [
        "import { Calendar } from '@/components/ui/calendar'",
        "import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'",
        "import { Button } from '@/components/ui/button'",
        "import { format } from 'date-fns'",
      ],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        return `<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">
      {date ? format(date, "${properties.format || 'PPP'}") : <span>Pick a date</span>}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0">
    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
  </PopoverContent>
</Popover>`;
      },
      dependencies: [{ name: 'date-fns', version: '^3.0.0' }],
    },

    timepicker: {
      imports: ["import { Input } from '@/components/ui/input'", "import { Label } from '@/components/ui/label'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        return `<div className="grid w-full gap-1.5">
  ${properties.label ? `<Label>${properties.label}</Label>` : ''}
  <Input type="time" ${properties.required ? 'required' : ''} />
</div>`;
      },
    },

    // =====================================================================
    // ACTIONS (5 types)
    // =====================================================================

    button: {
      imports: ["import { Button } from '@/components/ui/button'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        const variants: Record<string, string> = {
          primary: 'default',
          secondary: 'secondary',
          danger: 'destructive',
          ghost: 'ghost',
          link: 'link',
        };
        const variant = variants[properties.variant || 'primary'] || 'default';

        return `<Button
  variant="${variant}"
  size="${properties.size || 'default'}"
  ${properties.disabled ? 'disabled' : ''}
  ${properties.type ? `type="${properties.type}"` : ''}
>
  ${properties.icon ? `<${properties.icon} className="mr-2 h-4 w-4" />` : ''}
  ${properties.label || 'Button'}
</Button>`;
      },
    },

    'button-group': {
      imports: [],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;
        const orientation = properties.orientation || 'horizontal';
        return `<div className="flex ${orientation === 'vertical' ? 'flex-col' : 'flex-row'} gap-2">
  ${children || '/* Buttons */'}
</div>`;
      },
    },

    link: {
      imports: ["import Link from 'next/link'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        return `<Link
  href="${properties.href || '#'}"
  className="${properties.underline === false ? 'no-underline' : 'underline'}"
  ${properties.external ? 'target="_blank" rel="noopener noreferrer"' : ''}
>
  ${properties.label || 'Link'}
</Link>`;
      },
    },

    icon: {
      imports: [],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        const sizeMap: Record<string, string> = { small: 'h-4 w-4', medium: 'h-6 w-6', large: 'h-8 w-8' };
        const size = sizeMap[properties.size || 'medium'] || 'h-6 w-6';

        return `<${properties.name || 'Icon'} className="${size} ${properties.color ? `text-${properties.color}` : ''}" />`;
      },
    },

    menu: {
      imports: [
        "import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'",
      ],
      render: (ctx: RenderContext) => {
        const { children } = ctx;
        return `<DropdownMenu>
  <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
  <DropdownMenuContent>
    ${children || '/* Menu items */'}
  </DropdownMenuContent>
</DropdownMenu>`;
      },
    },

    // =====================================================================
    // OVERLAYS & FEEDBACK (9 types)
    // =====================================================================

    modal: {
      imports: [
        "import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'",
      ],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;
        return `<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="${properties.size === 'small' ? 'sm:max-w-[425px]' : properties.size === 'large' ? 'sm:max-w-[725px]' : 'sm:max-w-[525px]'}">
    ${properties.title ? `<DialogHeader>
      <DialogTitle>${properties.title}</DialogTitle>
    </DialogHeader>` : ''}
    <div className="py-4">
      ${children || '/* Modal content */'}
    </div>
    ${properties.footer ? '<DialogFooter>{/* Footer actions */}</DialogFooter>' : ''}
  </DialogContent>
</Dialog>`;
      },
    },

    dialog: {
      imports: ["import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        return `<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>${properties.title || 'Alert'}</AlertDialogTitle>
      <AlertDialogDescription>${properties.message || ''}</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Continue</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`;
      },
    },

    drawer: {
      imports: ["import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'"],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;
        return `<Sheet>
  <SheetContent side="${properties.position || 'right'}">
    <SheetHeader>
      <SheetTitle>${properties.title || ''}</SheetTitle>
    </SheetHeader>
    <div className="py-4">
      ${children || '/* Drawer content */'}
    </div>
  </SheetContent>
</Sheet>`;
      },
    },

    popover: {
      imports: ["import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'"],
      render: (ctx: RenderContext) => {
        const { children } = ctx;
        return `<Popover>
  <PopoverTrigger>Trigger</PopoverTrigger>
  <PopoverContent>
    ${children || 'Popover content'}
  </PopoverContent>
</Popover>`;
      },
    },

    tooltip: {
      imports: ["import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        return `<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>Hover</TooltipTrigger>
    <TooltipContent>
      <p>${properties.content || 'Tooltip content'}</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>`;
      },
    },

    alert: {
      imports: ["import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        return `<Alert variant="${properties.variant || 'default'}">
  ${properties.title ? `<AlertTitle>${properties.title}</AlertTitle>` : ''}
  <AlertDescription>${properties.message || ''}</AlertDescription>
</Alert>`;
      },
    },

    snackbar: {
      imports: ["import { useToast } from '@/components/ui/use-toast'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        return `toast({
  title: "${properties.message || 'Notification'}",
  duration: ${properties.duration || 3000},
})`;
      },
    },

    badge: {
      imports: ["import { Badge } from '@/components/ui/badge'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        return `<Badge variant="${properties.variant || 'default'}">${properties.content || ''}</Badge>`;
      },
    },

    spinner: {
      imports: [],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        const sizeMap: Record<string, string> = { small: 'h-4 w-4', medium: 'h-8 w-8', large: 'h-12 w-12' };
        const size = sizeMap[properties.size || 'medium'] || 'h-8 w-8';
        return `<div className="flex items-center justify-center">
  <div className="${size} animate-spin rounded-full border-b-2 border-gray-900"></div>
</div>`;
      },
    },

    // =====================================================================
    // NAVIGATION (5 types)
    // =====================================================================

    tabs: {
      imports: ["import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'"],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;
        const sections = properties.sections || ['tab1', 'tab2'];

        return `<Tabs defaultValue="${sections[0]}">
  <TabsList>
    ${sections.map((section: string) => `<TabsTrigger value="${section}">${section}</TabsTrigger>`).join('\n    ')}
  </TabsList>
  ${sections.map((section: string) => `<TabsContent value="${section}">
    {/* ${section} content */}
  </TabsContent>`).join('\n  ')}
</Tabs>`;
      },
    },

    breadcrumb: {
      imports: [],
      render: (ctx: RenderContext) => {
        return `<nav className="flex" aria-label="Breadcrumb">
  <ol className="inline-flex items-center space-x-1">
    {/* Breadcrumb items */}
  </ol>
</nav>`;
      },
    },

    navbar: {
      imports: [],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;
        return `<nav className="${properties.sticky ? 'sticky top-0' : ''} bg-background border-b">
  <div className="container flex h-16 items-center justify-between">
    ${children || '/* Navigation items */'}
  </div>
</nav>`;
      },
    },

    sidebar: {
      imports: [],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;
        return `<aside className="w-${properties.width || 64} border-r ${properties.position === 'right' ? 'order-last' : ''}">
  <div className="h-full px-3 py-4">
    ${children || '/* Sidebar items */'}
  </div>
</aside>`;
      },
    },

    pagination: {
      imports: [
        "import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'",
      ],
      render: (ctx: RenderContext) => {
        return `<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="#" />
    </PaginationItem>
    {/* Page numbers */}
    <PaginationItem>
      <PaginationNext href="#" />
    </PaginationItem>
  </PaginationContent>
</Pagination>`;
      },
    },

    // =====================================================================
    // LAYOUT (6 types)
    // =====================================================================

    accordion: {
      imports: ["import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'"],
      render: (ctx: RenderContext) => {
        const { children } = ctx;
        return `<Accordion type="single" collapsible>
  ${children || '/* Accordion items */'}
</Accordion>`;
      },
    },

    carousel: {
      imports: [],
      render: (ctx: RenderContext) => {
        const { children } = ctx;
        return `<div className="relative">
  {/* Carousel implementation */}
  ${children || ''}
</div>`;
      },
    },

    container: {
      imports: [],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;
        const layout = properties.layout || 'vertical';
        const className = layout === 'horizontal' ? 'flex flex-row' : layout === 'grid' ? 'grid' : 'flex flex-col';

        return `<div className="${className} ${properties.gap ? `gap-${properties.gap}` : ''} ${properties.scrollable ? 'overflow-auto' : ''}">
  ${children || '/* Container content */'}
</div>`;
      },
    },

    divider: {
      imports: ["import { Separator } from '@/components/ui/separator'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        return `<Separator orientation="${properties.orientation || 'horizontal'}" />`;
      },
    },

    header: {
      imports: [],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;
        return `<header>
  ${properties.title ? `<h1 className="text-3xl font-bold">${properties.title}</h1>` : ''}
  ${properties.subtitle ? `<p className="text-muted-foreground">${properties.subtitle}</p>` : ''}
  ${children || ''}
</header>`;
      },
    },

    footer: {
      imports: [],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;
        return `<footer className="${properties.sticky ? 'sticky bottom-0' : ''} border-t bg-background">
  <div className="container py-6">
    ${children || '/* Footer content */'}
    ${properties.copyright ? `<p className="text-sm text-muted-foreground">${properties.copyright}</p>` : ''}
  </div>
</footer>`;
      },
    },

    // =====================================================================
    // PROGRESS (2 types)
    // =====================================================================

    'progress-bar': {
      imports: ["import { Progress } from '@/components/ui/progress'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        return `<div className="space-y-2">
  ${properties.label ? `<div className="flex justify-between text-sm"><span>Progress</span><span>{${properties.value || 0}}%</span></div>` : ''}
  <Progress value={${properties.value || 0}} max={${properties.max || 100}} />
</div>`;
      },
    },

    'progress-circle': {
      imports: [],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        const size = properties.size === 'large' ? 'h-32 w-32' : properties.size === 'small' ? 'h-16 w-16' : 'h-24 w-24';
        return `<div className="${size} relative">
  <svg className="rotate-[-90deg]" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="${properties.thickness || 4}" fill="none" className="text-muted" />
    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="${properties.thickness || 4}" fill="none" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * ${properties.value || 0}) / 100} className="text-primary transition-all" />
  </svg>
  ${properties.label ? '<div className="absolute inset-0 flex items-center justify-center text-lg font-bold">{value}%</div>' : ''}
</div>`;
      },
    },

    // =====================================================================
    // SPECIALIZED (2 types)
    // =====================================================================

    searchBar: {
      imports: ["import { Input } from '@/components/ui/input'", "import { Search } from 'lucide-react'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        return `<div className="relative">
  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
  <Input
    type="search"
    placeholder="${properties.placeholder || 'Search...'}"
    className="pl-8"
    ${properties.autofocus ? 'autoFocus' : ''}
  />
</div>`;
      },
    },

    filterPanel: {
      imports: ["import { Card } from '@/components/ui/card'"],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;
        return `<Card className="${properties.position === 'sidebar' ? 'w-64' : 'w-full'} ${properties.collapsible ? 'collapsible' : ''}">
  <div className="p-4 space-y-4">
    <h3 className="font-semibold">Filters</h3>
    ${children || '/* Filter controls */'}
  </div>
</Card>`;
      },
    },
  },
};

export default shadcnAdapter;
