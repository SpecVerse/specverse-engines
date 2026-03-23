/**
 * Material-UI (MUI) Adapter for SpecVerse v3.4.0
 *
 * Maps all 49 atomic component types to Material-UI components.
 *
 * @see https://mui.com/material-ui/
 * @see ../../shared/atomic-components-registry.ts
 */

import type { ComponentLibraryAdapter, RenderContext } from '../../shared/adapter-types.js';

/**
 * Helper to render props object
 */
function renderProps(properties: Record<string, any>, exclude: string[] = []): string {
  return Object.entries(properties)
    .filter(([key]) => !exclude.includes(key))
    .map(([key, value]) => {
      if (typeof value === 'boolean') return value ? key : '';
      if (typeof value === 'string') return `${key}="${value}"`;
      return `${key}={${JSON.stringify(value)}}`;
    })
    .filter(Boolean)
    .join(' ');
}

/**
 * Material-UI Component Library Adapter
 */
export const muiAdapter: ComponentLibraryAdapter = {
  name: 'Material-UI',
  version: '5.x',
  description: 'Material-UI (MUI) component library adapter for SpecVerse v3.4.0',

  baseDependencies: [
    { name: '@mui/material', version: '^5.15.0' },
    { name: '@mui/icons-material', version: '^5.15.0' },
    { name: '@emotion/react', version: '^11.11.0' },
    { name: '@emotion/styled', version: '^11.11.0' },
  ],

  config: {
    importPrefix: '@mui/material',
    importStyle: 'named',
  },

  components: {
    // ====================================================================
    // DATA DISPLAY (9 types)
    // ====================================================================

    table: {
      imports: [
        "import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination, TableSortLabel } from '@mui/material'",
      ],
      render: (ctx: RenderContext) => {
        const { properties, model } = ctx;
        const columns = properties.columns || ['id'];
        const modelVar = model?.name?.toLowerCase() || 'item';
        const sortable = properties.sortable !== false;
        const pagination = properties.pagination !== false;

        return `<TableContainer component={Paper}>
  <Table ${properties.size ? `size="${properties.size}"` : ''}>
    <TableHead>
      <TableRow>
        ${columns.map((col: string) =>
          sortable
            ? `<TableCell><TableSortLabel>{${JSON.stringify(col)}}</TableSortLabel></TableCell>`
            : `<TableCell>{${JSON.stringify(col)}}</TableCell>`
        ).join('\n        ')}
      </TableRow>
    </TableHead>
    <TableBody>
      {${modelVar}s?.map((${modelVar}) => (
        <TableRow key={${modelVar}.id}>
          ${columns.map((col: string) => `<TableCell>{${modelVar}.${col}}</TableCell>`).join('\n          ')}
        </TableRow>
      ))}
    </TableBody>
  </Table>
  ${pagination ? `<TablePagination rowsPerPageOptions={[5, 10, 25]} component="div" count={total} rowsPerPage={rowsPerPage} page={page} onPageChange={handlePageChange} onRowsPerPageChange={handleRowsPerPageChange} />` : ''}
</TableContainer>`;
      },
    },

    list: {
      imports: ["import { List, ListItem, ListItemText, ListItemIcon, ListItemButton, Divider } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties, model } = ctx;
        const modelVar = model?.name?.toLowerCase() || 'item';

        return `<List ${properties.dense ? 'dense' : ''}>
  {${modelVar}s?.map((${modelVar}) => (
    <React.Fragment key={${modelVar}.id}>
      <ListItem${properties.clickable ? 'Button' : ''}>
        ${properties.showIcon ? `<ListItemIcon>{/* Icon */}</ListItemIcon>` : ''}
        <ListItemText
          primary={${modelVar}.${properties.primaryField || 'name'}}
          ${properties.secondaryField ? `secondary={${modelVar}.${properties.secondaryField}}` : ''}
        />
      </ListItem>
      ${properties.dividers ? '<Divider />' : ''}
    </React.Fragment>
  ))}
</List>`;
      },
    },

    grid: {
      imports: ["import { Grid } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;
        const spacing = properties.spacing || 2;

        return `<Grid container spacing={${spacing}}>
  {items?.map((item) => (
    <Grid item xs={${properties.xs || 12}} sm={${properties.sm || 6}} md={${properties.md || 4}} lg={${properties.lg || 3}} key={item.id}>
      ${children || '{/* Item content */}'}
    </Grid>
  ))}
</Grid>`;
      },
    },

    card: {
      imports: ["import { Card, CardContent, CardMedia, CardActions, CardHeader, Typography } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;

        return `<Card ${properties.variant ? `variant="${properties.variant}"` : ''}>
  ${properties.image ? `<CardMedia component="img" height="${properties.imageHeight || 140}" image={${properties.image}} alt="${properties.title || 'Card'}" />` : ''}
  ${properties.title ? `<CardHeader title="${properties.title}" ${properties.subtitle ? `subheader="${properties.subtitle}"` : ''} />` : ''}
  <CardContent>
    ${children || '<Typography variant="body2" color="text.secondary">{content}</Typography>'}
  </CardContent>
  ${properties.actions ? `<CardActions>{/* Actions */}</CardActions>` : ''}
</Card>`;
      },
    },

    chart: {
      imports: [
        "import { Box } from '@mui/material'",
        "// Note: MUI doesn't include charts. Use @mui/x-charts or recharts",
        "// import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'",
      ],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        const chartType = properties.chartType || 'line';

        return `<Box sx={{ width: '100%', height: ${properties.height || 400} }}>
  {/* TODO: Integrate @mui/x-charts or recharts */}
  {/* <ResponsiveContainer width="100%" height="100%">
    <${chartType === 'line' ? 'LineChart' : chartType === 'bar' ? 'BarChart' : 'PieChart'} data={data}>
      ${chartType !== 'pie' ? '<CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis />' : ''}
      <Tooltip />${properties.showLegend !== false ? '<Legend />' : ''}
      <${chartType === 'line' ? 'Line' : chartType === 'bar' ? 'Bar' : 'Pie'} dataKey="value" fill="#8884d8" />
    </${chartType === 'line' ? 'LineChart' : chartType === 'bar' ? 'BarChart' : 'PieChart'}>
  </ResponsiveContainer> */}
</Box>`;
      },
      dependencies: [
        { name: '@mui/x-charts', version: '^6.0.0' },
      ],
    },

    tree: {
      imports: ["import { TreeView, TreeItem } from '@mui/lab'", "import { ExpandMore, ChevronRight } from '@mui/icons-material'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<TreeView
  defaultCollapseIcon={<ExpandMore />}
  defaultExpandIcon={<ChevronRight />}
  ${properties.defaultExpanded ? 'defaultExpanded={defaultExpanded}' : ''}
>
  {renderTree(data)}
</TreeView>`;
      },
      dependencies: [
        { name: '@mui/lab', version: '^5.0.0-alpha.170' },
      ],
    },

    timeline: {
      imports: ["import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot, TimelineOppositeContent } from '@mui/lab'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        const position = properties.position || 'right';

        return `<Timeline position="${position}">
  {events?.map((event) => (
    <TimelineItem key={event.id}>
      ${properties.showDateMarkers ? `<TimelineOppositeContent color="text.secondary">{event.date}</TimelineOppositeContent>` : ''}
      <TimelineSeparator>
        <TimelineDot />
        <TimelineConnector />
      </TimelineSeparator>
      <TimelineContent>{event.title}</TimelineContent>
    </TimelineItem>
  ))}
</Timeline>`;
      },
      dependencies: [
        { name: '@mui/lab', version: '^5.0.0-alpha.170' },
      ],
    },

    avatar: {
      imports: ["import { Avatar, AvatarGroup } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        const size = properties.size === 'small' ? 'small' : properties.size === 'large' ? 'large' : 'medium';

        return `<Avatar
  src={${properties.src || 'undefined'}}
  alt="${properties.alt || ''}"
  ${properties.variant ? `variant="${properties.variant}"` : ''}
  sx={{ width: ${properties.size === 'small' ? 32 : properties.size === 'large' ? 56 : 40}, height: ${properties.size === 'small' ? 32 : properties.size === 'large' ? 56 : 40} }}
>
  ${!properties.src ? '{initials}' : ''}
</Avatar>`;
      },
    },

    image: {
      imports: ["import { Box, CardMedia } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<CardMedia
  component="img"
  image={${properties.src}}
  alt="${properties.alt || 'Image'}"
  ${properties.height ? `height={${properties.height}}` : ''}
  sx={{ objectFit: '${properties.objectFit || 'cover'}', ${properties.rounded ? 'borderRadius: 1' : ''} }}
/>`;
      },
    },

    // ====================================================================
    // FORMS & INPUTS (11 types)
    // ====================================================================

    form: {
      imports: ["import { Box } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;

        return `<Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
  ${children || '{/* Form fields */}'}
</Box>`;
      },
    },

    input: {
      imports: ["import { TextField } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        const variant = properties.variant || 'outlined';

        return `<TextField
  label="${properties.label || ''}"
  type="${properties.type || 'text'}"
  placeholder="${properties.placeholder || ''}"
  variant="${variant}"
  fullWidth={${properties.fullWidth !== false}}
  required={${properties.required === true}}
  disabled={${properties.disabled === true}}
  ${properties.helperText ? `helperText="${properties.helperText}"` : ''}
  ${properties.error ? 'error' : ''}
/>`;
      },
    },

    textarea: {
      imports: ["import { TextField } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<TextField
  label="${properties.label || ''}"
  placeholder="${properties.placeholder || ''}"
  multiline
  rows={${properties.rows || 4}}
  variant="${properties.variant || 'outlined'}"
  fullWidth={${properties.fullWidth !== false}}
  required={${properties.required === true}}
/>`;
      },
    },

    select: {
      imports: ["import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<FormControl fullWidth variant="${properties.variant || 'outlined'}">
  <InputLabel>${properties.label || 'Select'}</InputLabel>
  <Select
    value={value}
    label="${properties.label || 'Select'}"
    onChange={handleChange}
    ${properties.multiple ? 'multiple' : ''}
  >
    {${properties.options || 'options'}?.map((option) => (
      <MenuItem key={option.value} value={option.value}>
        {option.label}
      </MenuItem>
    ))}
  </Select>
</FormControl>`;
      },
    },

    checkbox: {
      imports: ["import { FormControlLabel, Checkbox } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<FormControlLabel
  control={<Checkbox ${properties.checked ? 'checked' : ''} ${properties.disabled ? 'disabled' : ''} />}
  label="${properties.label || ''}"
/>`;
      },
    },

    radio: {
      imports: ["import { FormControl, FormLabel, RadioGroup, FormControlLabel, Radio } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<FormControl>
  <FormLabel>${properties.label || 'Options'}</FormLabel>
  <RadioGroup row={${properties.orientation === 'horizontal'}}>
    {${properties.options || 'options'}?.map((option) => (
      <FormControlLabel key={option.value} value={option.value} control={<Radio />} label={option.label} />
    ))}
  </RadioGroup>
</FormControl>`;
      },
    },

    slider: {
      imports: ["import { Slider, Box, Typography } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<Box sx={{ width: '100%' }}>
  ${properties.label ? `<Typography gutterBottom>${properties.label}</Typography>` : ''}
  <Slider
    value={value}
    onChange={handleChange}
    min={${properties.min || 0}}
    max={${properties.max || 100}}
    step={${properties.step || 1}}
    ${properties.marks ? 'marks' : ''}
    valueLabelDisplay="${properties.showValue ? 'on' : 'auto'}"
  />
</Box>`;
      },
    },

    switch: {
      imports: ["import { FormControlLabel, Switch } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<FormControlLabel
  control={<Switch ${properties.checked ? 'checked' : ''} ${properties.disabled ? 'disabled' : ''} />}
  label="${properties.label || ''}"
/>`;
      },
    },

    autocomplete: {
      imports: ["import { Autocomplete, TextField } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<Autocomplete
  options={${properties.options || 'options'}}
  ${properties.multiple ? 'multiple' : ''}
  ${properties.freeSolo ? 'freeSolo' : ''}
  renderInput={(params) => (
    <TextField {...params} label="${properties.label || 'Search'}" placeholder="${properties.placeholder || ''}" />
  )}
/>`;
      },
    },

    datepicker: {
      imports: [
        "import { DatePicker } from '@mui/x-date-pickers/DatePicker'",
        "import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'",
        "import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'",
      ],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<LocalizationProvider dateAdapter={AdapterDayjs}>
  <DatePicker
    label="${properties.label || 'Select Date'}"
    value={value}
    onChange={handleChange}
  />
</LocalizationProvider>`;
      },
      dependencies: [
        { name: '@mui/x-date-pickers', version: '^6.0.0' },
        { name: 'dayjs', version: '^1.11.0' },
      ],
    },

    timepicker: {
      imports: [
        "import { TimePicker } from '@mui/x-date-pickers/TimePicker'",
        "import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'",
        "import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'",
      ],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<LocalizationProvider dateAdapter={AdapterDayjs}>
  <TimePicker
    label="${properties.label || 'Select Time'}"
    value={value}
    onChange={handleChange}
  />
</LocalizationProvider>`;
      },
      dependencies: [
        { name: '@mui/x-date-pickers', version: '^6.0.0' },
        { name: 'dayjs', version: '^1.11.0' },
      ],
    },

    // ====================================================================
    // ACTIONS (5 types)
    // ====================================================================

    button: {
      imports: ["import { Button } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        const variant = { primary: 'contained', secondary: 'outlined', danger: 'contained' }[properties.variant || 'primary'] || 'contained';
        const color = properties.variant === 'danger' ? 'error' : 'primary';

        return `<Button
  variant="${variant}"
  color="${color}"
  size="${properties.size || 'medium'}"
  ${properties.disabled ? 'disabled' : ''}
  ${properties.fullWidth ? 'fullWidth' : ''}
  startIcon={${properties.icon ? `<${properties.icon} />` : 'undefined'}}
>
  ${properties.label || 'Button'}
</Button>`;
      },
    },

    'button-group': {
      imports: ["import { ButtonGroup, Button } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;

        return `<ButtonGroup
  variant="${properties.variant || 'outlined'}"
  orientation="${properties.orientation || 'horizontal'}"
  size="${properties.size || 'medium'}"
>
  ${children || '{/* Buttons */}'}
</ButtonGroup>`;
      },
    },

    link: {
      imports: ["import { Link } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<Link
  href="${properties.href || '#'}"
  underline="${properties.underline || 'hover'}"
  ${properties.color ? `color="${properties.color}"` : ''}
  ${properties.external ? 'target="_blank" rel="noopener noreferrer"' : ''}
>
  ${properties.label || 'Link'}
</Link>`;
      },
    },

    icon: {
      imports: ["import { Icon } from '@mui/material'", "// Import specific icons: import { Home, Settings } from '@mui/icons-material'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        const size = properties.size === 'small' ? 'small' : properties.size === 'large' ? 'large' : 'medium';

        return `<${properties.name || 'Icon'} fontSize="${size}" ${properties.color ? `color="${properties.color}"` : ''} />`;
      },
    },

    menu: {
      imports: ["import { Menu, MenuItem, IconButton } from '@mui/material'", "import { MoreVert } from '@mui/icons-material'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<>
  <IconButton onClick={handleClick}>
    <MoreVert />
  </IconButton>
  <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
    {${properties.items || 'menuItems'}?.map((item) => (
      <MenuItem key={item.id} onClick={handleClose}>
        {item.label}
      </MenuItem>
    ))}
  </Menu>
</>`;
      },
    },

    // ====================================================================
    // OVERLAYS & FEEDBACK (9 types)
    // ====================================================================

    modal: {
      imports: ["import { Modal, Box, Typography } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;

        return `<Modal
  open={open}
  onClose={handleClose}
  aria-labelledby="modal-title"
>
  <Box sx={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: ${properties.width || 400},
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4
  }}>
    ${properties.title ? `<Typography id="modal-title" variant="h6" component="h2">${properties.title}</Typography>` : ''}
    ${children || '{/* Content */}'}
  </Box>
</Modal>`;
      },
    },

    dialog: {
      imports: ["import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;

        return `<Dialog open={open} onClose={handleClose} maxWidth="${properties.size || 'sm'}" fullWidth>
  ${properties.title ? `<DialogTitle>${properties.title}</DialogTitle>` : ''}
  <DialogContent>
    ${children || '{/* Content */}'}
  </DialogContent>
  <DialogActions>
    <Button onClick={handleClose}>Cancel</Button>
    <Button onClick={handleConfirm} variant="contained">Confirm</Button>
  </DialogActions>
</Dialog>`;
      },
    },

    drawer: {
      imports: ["import { Drawer, Box } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;
        const anchor = properties.position === 'left' ? 'left' : properties.position === 'right' ? 'right' : properties.position === 'top' ? 'top' : 'bottom';

        return `<Drawer
  anchor="${anchor}"
  open={open}
  onClose={handleClose}
  ${properties.variant === 'persistent' ? 'variant="persistent"' : ''}
>
  <Box sx={{ width: ${properties.width || 250}, p: 2 }}>
    ${children || '{/* Content */}'}
  </Box>
</Drawer>`;
      },
    },

    popover: {
      imports: ["import { Popover, Typography } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;

        return `<Popover
  open={open}
  anchorEl={anchorEl}
  onClose={handleClose}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
>
  <Typography sx={{ p: 2 }}>
    ${children || properties.content || 'Popover content'}
  </Typography>
</Popover>`;
      },
    },

    tooltip: {
      imports: ["import { Tooltip } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;
        const placement = properties.placement || 'top';

        return `<Tooltip title="${properties.content || ''}" placement="${placement}" ${properties.arrow ? 'arrow' : ''}>
  ${children || '<span>{children}</span>'}
</Tooltip>`;
      },
    },

    alert: {
      imports: ["import { Alert, AlertTitle } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        const severity = properties.variant === 'error' ? 'error' : properties.variant === 'warning' ? 'warning' : properties.variant === 'success' ? 'success' : 'info';

        return `<Alert severity="${severity}" ${properties.closable ? 'onClose={handleClose}' : ''}>
  ${properties.title ? `<AlertTitle>${properties.title}</AlertTitle>` : ''}
  ${properties.message || 'Alert message'}
</Alert>`;
      },
    },

    snackbar: {
      imports: ["import { Snackbar, Alert } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        const vertical = properties.position?.includes('top') ? 'top' : 'bottom';
        const horizontal = properties.position?.includes('left') ? 'left' : properties.position?.includes('right') ? 'right' : 'center';

        return `<Snackbar
  open={open}
  autoHideDuration={${properties.duration || 6000}}
  onClose={handleClose}
  anchorOrigin={{ vertical: '${vertical}', horizontal: '${horizontal}' }}
>
  <Alert onClose={handleClose} severity="${properties.variant || 'info'}" sx={{ width: '100%' }}>
    ${properties.message || 'Notification'}
  </Alert>
</Snackbar>`;
      },
    },

    badge: {
      imports: ["import { Badge } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;

        return `<Badge
  badgeContent={${properties.count || 0}}
  color="${properties.color || 'primary'}"
  ${properties.variant === 'dot' ? 'variant="dot"' : ''}
  ${properties.max ? `max={${properties.max}}` : ''}
>
  ${children || '{children}'}
</Badge>`;
      },
    },

    spinner: {
      imports: ["import { CircularProgress, Box } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        const size = properties.size === 'small' ? 20 : properties.size === 'large' ? 60 : 40;

        return `<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
  <CircularProgress size={${size}} ${properties.color ? `color="${properties.color}"` : ''} />
</Box>`;
      },
    },

    // ====================================================================
    // NAVIGATION (5 types)
    // ====================================================================

    tabs: {
      imports: ["import { Tabs, Tab, Box } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
  <Tabs
    value={value}
    onChange={handleChange}
    ${properties.variant === 'scrollable' ? 'variant="scrollable" scrollButtons="auto"' : ''}
    ${properties.centered ? 'centered' : ''}
  >
    {${properties.tabs || 'tabs'}?.map((tab) => (
      <Tab key={tab.value} label={tab.label} value={tab.value} />
    ))}
  </Tabs>
</Box>`;
      },
    },

    breadcrumb: {
      imports: ["import { Breadcrumbs, Link, Typography } from '@mui/material'", "import { NavigateNext } from '@mui/icons-material'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<Breadcrumbs separator={<NavigateNext fontSize="small" />}>
  {${properties.items || 'breadcrumbs'}?.map((item, index) =>
    index === breadcrumbs.length - 1 ? (
      <Typography key={item.label} color="text.primary">{item.label}</Typography>
    ) : (
      <Link key={item.label} underline="hover" color="inherit" href={item.href}>{item.label}</Link>
    )
  )}
</Breadcrumbs>`;
      },
    },

    navbar: {
      imports: ["import { AppBar, Toolbar, Typography, Button, IconButton } from '@mui/material'", "import { Menu as MenuIcon } from '@mui/icons-material'"],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;
        const position = properties.fixed ? 'fixed' : 'static';

        return `<AppBar position="${position}" color="${properties.color || 'primary'}">
  <Toolbar>
    ${properties.showMenuButton ? '<IconButton edge="start" color="inherit" onClick={handleMenuClick}><MenuIcon /></IconButton>' : ''}
    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
      ${properties.brand || 'App'}
    </Typography>
    ${children || '{/* Navigation items */}'}
  </Toolbar>
</AppBar>`;
      },
    },

    sidebar: {
      imports: ["import { Drawer, List, ListItem, ListItemIcon, ListItemText, ListItemButton } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        const variant = properties.variant === 'permanent' ? 'permanent' : properties.variant === 'persistent' ? 'persistent' : 'temporary';

        return `<Drawer
  variant="${variant}"
  anchor="${properties.position || 'left'}"
  open={open}
  ${variant === 'temporary' ? 'onClose={handleClose}' : ''}
  sx={{ width: ${properties.width || 240}, flexShrink: 0, '& .MuiDrawer-paper': { width: ${properties.width || 240}, boxSizing: 'border-box' } }}
>
  <List>
    {${properties.items || 'menuItems'}?.map((item) => (
      <ListItemButton key={item.id}>
        {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
        <ListItemText primary={item.label} />
      </ListItemButton>
    ))}
  </List>
</Drawer>`;
      },
    },

    pagination: {
      imports: ["import { Pagination, Stack } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<Stack spacing={2} alignItems="center">
  <Pagination
    count={${properties.total || 10}}
    page={page}
    onChange={handleChange}
    color="${properties.color || 'primary'}"
    size="${properties.size || 'medium'}"
    ${properties.showFirstLast ? 'showFirstButton showLastButton' : ''}
  />
</Stack>`;
      },
    },

    // ====================================================================
    // LAYOUT (6 types)
    // ====================================================================

    accordion: {
      imports: ["import { Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material'", "import { ExpandMore } from '@mui/icons-material'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `{${properties.items || 'accordionItems'}?.map((item) => (
  <Accordion key={item.id} ${properties.multiple ? '' : 'disableGutters'}>
    <AccordionSummary expandIcon={<ExpandMore />}>
      <Typography>{item.title}</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Typography>{item.content}</Typography>
    </AccordionDetails>
  </Accordion>
))}`;
      },
    },

    carousel: {
      imports: ["import { Box } from '@mui/material'", "// Note: MUI doesn't include carousel. Use react-material-ui-carousel or swiper"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<Box sx={{ maxWidth: '100%', flexGrow: 1 }}>
  {/* TODO: Integrate react-material-ui-carousel or swiper */}
  {/* <Carousel autoPlay={${properties.autoplay !== false}} interval={${properties.interval || 3000}}>
    {items?.map((item) => (
      <Box key={item.id}>{item.content}</Box>
    ))}
  </Carousel> */}
</Box>`;
      },
      dependencies: [
        { name: 'react-material-ui-carousel', version: '^3.4.0' },
      ],
    },

    container: {
      imports: ["import { Container } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;

        return `<Container maxWidth="${properties.maxWidth || 'lg'}" ${properties.fixed ? 'fixed' : ''}>
  ${children || '{/* Content */}'}
</Container>`;
      },
    },

    divider: {
      imports: ["import { Divider } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<Divider ${properties.orientation === 'vertical' ? 'orientation="vertical"' : ''} ${properties.variant ? `variant="${properties.variant}"` : ''} />`;
      },
    },

    header: {
      imports: ["import { Box, Typography } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;

        return `<Box component="header" sx={{ py: 2, borderBottom: 1, borderColor: 'divider' }}>
  ${properties.title ? `<Typography variant="h4" component="h1">${properties.title}</Typography>` : ''}
  ${properties.subtitle ? `<Typography variant="subtitle1" color="text.secondary">${properties.subtitle}</Typography>` : ''}
  ${children || ''}
</Box>`;
      },
    },

    footer: {
      imports: ["import { Box, Container, Typography } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;

        return `<Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
  <Container maxWidth="lg">
    ${properties.copyright ? `<Typography variant="body2" color="text.secondary" align="center">${properties.copyright}</Typography>` : ''}
    ${children || ''}
  </Container>
</Box>`;
      },
    },

    // ====================================================================
    // PROGRESS (2 types)
    // ====================================================================

    'progress-bar': {
      imports: ["import { LinearProgress, Box, Typography } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<Box sx={{ width: '100%' }}>
  ${properties.label ? `<Typography variant="body2" color="text.secondary">${properties.label}</Typography>` : ''}
  <LinearProgress
    variant="${properties.indeterminate ? 'indeterminate' : 'determinate'}"
    value={${properties.value || 0}}
    color="${properties.color || 'primary'}"
  />
  ${properties.showValue ? `<Typography variant="body2" color="text.secondary">{value}%</Typography>` : ''}
</Box>`;
      },
    },

    'progress-circle': {
      imports: ["import { CircularProgress, Box, Typography } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<Box sx={{ position: 'relative', display: 'inline-flex' }}>
  <CircularProgress
    variant="${properties.indeterminate ? 'indeterminate' : 'determinate'}"
    value={${properties.value || 0}}
    size={${properties.size || 40}}
    color="${properties.color || 'primary'}"
  />
  ${properties.showValue ? `
  <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Typography variant="caption" component="div" color="text.secondary">{value}%</Typography>
  </Box>` : ''}
</Box>`;
      },
    },

    // ====================================================================
    // SPECIALIZED (2 types)
    // ====================================================================

    searchBar: {
      imports: ["import { TextField, InputAdornment } from '@mui/material'", "import { Search } from '@mui/icons-material'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<TextField
  placeholder="${properties.placeholder || 'Search...'}"
  variant="${properties.variant || 'outlined'}"
  fullWidth={${properties.fullWidth !== false}}
  InputProps={{
    startAdornment: (
      <InputAdornment position="start">
        <Search />
      </InputAdornment>
    ),
  }}
/>`;
      },
    },

    filterPanel: {
      imports: ["import { Paper, Box, Typography, Divider } from '@mui/material'"],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;

        return `<Paper sx={{ p: 2, mb: 2 }}>
  <Typography variant="h6" gutterBottom>Filters</Typography>
  <Divider sx={{ mb: 2 }} />
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    ${children || '{/* Filter controls */}'}
  </Box>
</Paper>`;
      },
    },
  },
};
