/**
 * Ant Design (antd) Adapter for SpecVerse v3.4.0
 *
 * Maps all 49 atomic component types to Ant Design components.
 *
 * @see https://ant.design/components/overview/
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
 * Ant Design Component Library Adapter
 */
export const antdAdapter: ComponentLibraryAdapter = {
  name: 'Ant Design',
  version: '5.x',
  description: 'Ant Design (antd) component library adapter for SpecVerse v3.4.0',

  baseDependencies: [
    { name: 'antd', version: '^5.15.0' },
    { name: '@ant-design/icons', version: '^5.2.0' },
  ],

  config: {
    importPrefix: 'antd',
    importStyle: 'named',
  },

  components: {
    // ====================================================================
    // DATA DISPLAY (9 types)
    // ====================================================================

    table: {
      imports: ["import { Table } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties, model } = ctx;
        const columns = properties.columns || ['id'];
        const modelVar = model?.name?.toLowerCase() || 'item';

        return `<Table
  dataSource={${modelVar}s}
  columns={[
    ${columns.map((col: string) => `{ title: '${col}', dataIndex: '${col}', key: '${col}'${properties.sortable !== false ? ", sorter: true" : ''} }`).join(',\n    ')}
  ]}
  ${properties.pagination !== false ? `pagination={{ pageSize: ${properties.pageSize || 10} }}` : 'pagination={false}'}
  ${properties.size ? `size="${properties.size}"` : ''}
  ${properties.bordered ? 'bordered' : ''}
  rowKey="id"
/>`;
      },
    },

    list: {
      imports: ["import { List } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties, model } = ctx;
        const modelVar = model?.name?.toLowerCase() || 'item';

        return `<List
  dataSource={${modelVar}s}
  ${properties.bordered ? 'bordered' : ''}
  ${properties.size ? `size="${properties.size}"` : ''}
  ${properties.grid ? `grid={${JSON.stringify(properties.grid)}}` : ''}
  renderItem={(${modelVar}) => (
    <List.Item>
      <List.Item.Meta
        ${properties.showAvatar ? `avatar={<Avatar src={${modelVar}.avatar} />}` : ''}
        title={${modelVar}.${properties.primaryField || 'name'}}
        ${properties.secondaryField ? `description={${modelVar}.${properties.secondaryField}}` : ''}
      />
    </List.Item>
  )}
/>`;
      },
    },

    grid: {
      imports: ["import { Row, Col } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;
        const gutter = properties.gutter || 16;

        return `<Row gutter={${gutter}}>
  {items?.map((item) => (
    <Col xs={${properties.xs || 24}} sm={${properties.sm || 12}} md={${properties.md || 8}} lg={${properties.lg || 6}} key={item.id}>
      ${children || '{/* Item content */}'}
    </Col>
  ))}
</Row>`;
      },
    },

    card: {
      imports: ["import { Card } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;

        return `<Card
  ${properties.title ? `title="${properties.title}"` : ''}
  ${properties.bordered !== false ? 'bordered' : 'bordered={false}'}
  ${properties.hoverable ? 'hoverable' : ''}
  ${properties.size ? `size="${properties.size}"` : ''}
  ${properties.image ? `cover={<img alt="${properties.title || 'Card'}" src="${properties.image}" />}` : ''}
  ${properties.actions ? `actions={[${properties.actions.map((a: string) => `<${a} />`).join(', ')}]}` : ''}
>
  ${children || '{content}'}
</Card>`;
      },
    },

    chart: {
      imports: [
        "// Note: Ant Design doesn't include charts. Use @ant-design/charts or recharts",
        "// import { Line, Bar, Pie } from '@ant-design/charts'",
      ],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        const chartType = properties.chartType || 'line';
        const ChartComponent = chartType === 'line' ? 'Line' : chartType === 'bar' ? 'Bar' : 'Pie';

        return `{/* TODO: Integrate @ant-design/charts */}
{/* <${ChartComponent}
  data={data}
  ${chartType !== 'pie' ? 'xField="name" yField="value"' : 'angleField="value" colorField="name"'}
  ${properties.responsive !== false ? 'responsive' : ''}
  ${properties.showLegend !== false ? '' : 'legend={false}'}
/> */}`;
      },
      dependencies: [
        { name: '@ant-design/charts', version: '^2.0.0' },
      ],
    },

    tree: {
      imports: ["import { Tree } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<Tree
  treeData={treeData}
  ${properties.checkable ? 'checkable' : ''}
  ${properties.defaultExpanded ? 'defaultExpandAll' : ''}
  ${properties.selectable !== false ? '' : 'selectable={false}'}
  ${properties.showLine ? 'showLine' : ''}
/>`;
      },
    },

    timeline: {
      imports: ["import { Timeline } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        const mode = properties.position === 'alternate' ? 'alternate' : properties.position === 'right' ? 'right' : 'left';

        return `<Timeline mode="${mode}">
  {events?.map((event) => (
    <Timeline.Item key={event.id} ${properties.showDateMarkers ? `label={event.date}` : ''}>
      {event.title}
    </Timeline.Item>
  ))}
</Timeline>`;
      },
    },

    avatar: {
      imports: ["import { Avatar } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        const size = properties.size === 'small' ? 'small' : properties.size === 'large' ? 'large' : 'default';

        return `<Avatar
  ${properties.src ? `src="${properties.src}"` : ''}
  ${properties.icon ? `icon={<${properties.icon} />}` : ''}
  size={${typeof properties.size === 'number' ? properties.size : `"${size}"`}}
  ${properties.shape ? `shape="${properties.shape}"` : ''}
>
  ${!properties.src && !properties.icon ? '{initials}' : ''}
</Avatar>`;
      },
    },

    image: {
      imports: ["import { Image } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<Image
  src="${properties.src}"
  alt="${properties.alt || 'Image'}"
  ${properties.width ? `width={${properties.width}}` : ''}
  ${properties.height ? `height={${properties.height}}` : ''}
  ${properties.preview !== false ? '' : 'preview={false}'}
  ${properties.placeholder ? 'placeholder' : ''}
/>`;
      },
    },

    // ====================================================================
    // FORMS & INPUTS (11 types)
    // ====================================================================

    form: {
      imports: ["import { Form } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;

        return `<Form
  layout="${properties.layout || 'vertical'}"
  onFinish={handleSubmit}
  ${properties.initialValues ? 'initialValues={initialValues}' : ''}
>
  ${children || '{/* Form items */}'}
</Form>`;
      },
    },

    input: {
      imports: ["import { Input, Form } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<Form.Item
  label="${properties.label || ''}"
  name="${properties.name || 'field'}"
  ${properties.required ? 'rules={[{ required: true, message: "Please input!" }]}' : ''}
>
  <Input
    type="${properties.type || 'text'}"
    placeholder="${properties.placeholder || ''}"
    ${properties.disabled ? 'disabled' : ''}
    ${properties.prefix ? `prefix={<${properties.prefix} />}` : ''}
    ${properties.suffix ? `suffix={<${properties.suffix} />}` : ''}
  />
</Form.Item>`;
      },
    },

    textarea: {
      imports: ["import { Input, Form } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<Form.Item
  label="${properties.label || ''}"
  name="${properties.name || 'field'}"
  ${properties.required ? 'rules={[{ required: true }]}' : ''}
>
  <Input.TextArea
    placeholder="${properties.placeholder || ''}"
    rows={${properties.rows || 4}}
    ${properties.maxLength ? `maxLength={${properties.maxLength}}` : ''}
    ${properties.showCount ? 'showCount' : ''}
  />
</Form.Item>`;
      },
    },

    select: {
      imports: ["import { Select, Form } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<Form.Item
  label="${properties.label || 'Select'}"
  name="${properties.name || 'field'}"
  ${properties.required ? 'rules={[{ required: true }]}' : ''}
>
  <Select
    placeholder="${properties.placeholder || 'Select...'}"
    ${properties.mode ? `mode="${properties.mode}"` : ''}
    ${properties.allowClear ? 'allowClear' : ''}
    ${properties.showSearch ? 'showSearch' : ''}
    options={${properties.options || 'options'}}
  />
</Form.Item>`;
      },
    },

    checkbox: {
      imports: ["import { Checkbox, Form } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<Form.Item name="${properties.name || 'field'}" valuePropName="checked">
  <Checkbox ${properties.disabled ? 'disabled' : ''}>
    ${properties.label || ''}
  </Checkbox>
</Form.Item>`;
      },
    },

    radio: {
      imports: ["import { Radio, Form } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<Form.Item label="${properties.label || 'Options'}" name="${properties.name || 'field'}">
  <Radio.Group ${properties.buttonStyle ? `buttonStyle="${properties.buttonStyle}"` : ''}>
    {${properties.options || 'options'}?.map((option) => (
      <Radio${properties.buttonStyle ? '.Button' : ''} key={option.value} value={option.value}>
        {option.label}
      </Radio${properties.buttonStyle ? '.Button' : ''}>
    ))}
  </Radio.Group>
</Form.Item>`;
      },
    },

    slider: {
      imports: ["import { Slider, Form } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<Form.Item label="${properties.label || ''}" name="${properties.name || 'field'}">
  <Slider
    min={${properties.min || 0}}
    max={${properties.max || 100}}
    step={${properties.step || 1}}
    ${properties.marks ? 'marks={marks}' : ''}
    ${properties.range ? 'range' : ''}
    ${properties.vertical ? 'vertical' : ''}
  />
</Form.Item>`;
      },
    },

    switch: {
      imports: ["import { Switch, Form } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<Form.Item label="${properties.label || ''}" name="${properties.name || 'field'}" valuePropName="checked">
  <Switch
    ${properties.disabled ? 'disabled' : ''}
    ${properties.checkedChildren ? `checkedChildren="${properties.checkedChildren}"` : ''}
    ${properties.unCheckedChildren ? `unCheckedChildren="${properties.unCheckedChildren}"` : ''}
  />
</Form.Item>`;
      },
    },

    autocomplete: {
      imports: ["import { AutoComplete, Form } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<Form.Item label="${properties.label || ''}" name="${properties.name || 'field'}">
  <AutoComplete
    options={${properties.options || 'options'}}
    placeholder="${properties.placeholder || 'Type to search...'}"
    filterOption={(inputValue, option) =>
      option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
    }
    ${properties.allowClear ? 'allowClear' : ''}
  />
</Form.Item>`;
      },
    },

    datepicker: {
      imports: ["import { DatePicker, Form } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<Form.Item label="${properties.label || 'Select Date'}" name="${properties.name || 'field'}">
  <DatePicker
    ${properties.format ? `format="${properties.format}"` : ''}
    ${properties.showTime ? 'showTime' : ''}
    ${properties.picker ? `picker="${properties.picker}"` : ''}
    style={{ width: '100%' }}
  />
</Form.Item>`;
      },
    },

    timepicker: {
      imports: ["import { TimePicker, Form } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<Form.Item label="${properties.label || 'Select Time'}" name="${properties.name || 'field'}">
  <TimePicker
    ${properties.format ? `format="${properties.format}"` : ''}
    ${properties.use12Hours ? 'use12Hours' : ''}
    style={{ width: '100%' }}
  />
</Form.Item>`;
      },
    },

    // ====================================================================
    // ACTIONS (5 types)
    // ====================================================================

    button: {
      imports: ["import { Button } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        const type = { primary: 'primary', secondary: 'default', danger: 'primary' }[properties.variant || 'primary'] || 'default';
        const danger = properties.variant === 'danger';

        return `<Button
  type="${type}"
  ${danger ? 'danger' : ''}
  size="${properties.size || 'middle'}"
  ${properties.disabled ? 'disabled' : ''}
  ${properties.loading ? 'loading' : ''}
  ${properties.block ? 'block' : ''}
  ${properties.icon ? `icon={<${properties.icon} />}` : ''}
  ${properties.shape ? `shape="${properties.shape}"` : ''}
  onClick={handleClick}
>
  ${properties.label || 'Button'}
</Button>`;
      },
    },

    'button-group': {
      imports: ["import { Button, Space } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;

        return `<Space.Compact ${properties.size ? `size="${properties.size}"` : ''}>
  ${children || '{/* Buttons */}'}
</Space.Compact>`;
      },
    },

    link: {
      imports: ["import { Typography } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<Typography.Link
  href="${properties.href || '#'}"
  ${properties.disabled ? 'disabled' : ''}
  ${properties.underline === false ? 'underline={false}' : ''}
  ${properties.external ? 'target="_blank"' : ''}
>
  ${properties.label || 'Link'}
</Typography.Link>`;
      },
    },

    icon: {
      imports: ["// Import specific icons: import { HomeOutlined, SettingOutlined } from '@ant-design/icons'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<${properties.name || 'Icon'}Outlined style={{ fontSize: '${properties.size === 'small' ? '12px' : properties.size === 'large' ? '24px' : '16px'}' }} />`;
      },
    },

    menu: {
      imports: ["import { Menu, Dropdown, Button } from 'antd'", "import { MoreOutlined } from '@ant-design/icons'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<Dropdown
  menu={{
    items: ${properties.items || 'menuItems'},
    onClick: handleMenuClick
  }}
  trigger={['click']}
>
  <Button icon={<MoreOutlined />} />
</Dropdown>`;
      },
    },

    // ====================================================================
    // OVERLAYS & FEEDBACK (9 types)
    // ====================================================================

    modal: {
      imports: ["import { Modal } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;

        return `<Modal
  title="${properties.title || 'Modal'}"
  open={open}
  onOk={handleOk}
  onCancel={handleCancel}
  ${properties.width ? `width={${properties.width}}` : ''}
  ${properties.centered ? 'centered' : ''}
  ${properties.footer === false ? 'footer={null}' : ''}
>
  ${children || '{/* Content */}'}
</Modal>`;
      },
    },

    dialog: {
      imports: ["import { Modal } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;

        return `<Modal
  title="${properties.title || 'Dialog'}"
  open={open}
  onOk={handleOk}
  onCancel={handleCancel}
  ${properties.closable !== false ? '' : 'closable={false}'}
  ${properties.maskClosable !== false ? '' : 'maskClosable={false}'}
>
  ${children || '{/* Content */}'}
</Modal>`;
      },
    },

    drawer: {
      imports: ["import { Drawer } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;
        const placement = properties.position === 'left' ? 'left' : properties.position === 'right' ? 'right' : properties.position === 'top' ? 'top' : 'bottom';

        return `<Drawer
  title="${properties.title || 'Drawer'}"
  placement="${placement}"
  open={open}
  onClose={handleClose}
  ${properties.width ? `width={${properties.width}}` : ''}
  ${properties.height ? `height={${properties.height}}` : ''}
>
  ${children || '{/* Content */}'}
</Drawer>`;
      },
    },

    popover: {
      imports: ["import { Popover, Button } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;

        return `<Popover
  content={${properties.content ? `"${properties.content}"` : 'content'}}
  title="${properties.title || ''}"
  trigger="${properties.trigger || 'click'}"
  placement="${properties.placement || 'top'}"
>
  ${children || '<Button>Trigger</Button>'}
</Popover>`;
      },
    },

    tooltip: {
      imports: ["import { Tooltip } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;

        return `<Tooltip
  title="${properties.content || ''}"
  placement="${properties.placement || 'top'}"
  ${properties.color ? `color="${properties.color}"` : ''}
>
  ${children || '<span>{children}</span>'}
</Tooltip>`;
      },
    },

    alert: {
      imports: ["import { Alert } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        const type = properties.variant === 'error' ? 'error' : properties.variant === 'warning' ? 'warning' : properties.variant === 'success' ? 'success' : 'info';

        return `<Alert
  message="${properties.title || ''}"
  description="${properties.message || ''}"
  type="${type}"
  ${properties.closable ? 'closable' : ''}
  ${properties.showIcon !== false ? 'showIcon' : ''}
  ${properties.banner ? 'banner' : ''}
/>`;
      },
    },

    snackbar: {
      imports: ["import { message } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `{/* Use Ant Design message API */}
{/* message.${properties.variant || 'info'}('${properties.message || 'Notification'}', ${properties.duration || 3}) */}`;
      },
    },

    badge: {
      imports: ["import { Badge } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;

        return `<Badge
  count={${properties.count || 0}}
  ${properties.dot ? 'dot' : ''}
  ${properties.status ? `status="${properties.status}"` : ''}
  ${properties.color ? `color="${properties.color}"` : ''}
  ${properties.overflowCount ? `overflowCount={${properties.overflowCount}}` : ''}
>
  ${children || '{children}'}
</Badge>`;
      },
    },

    spinner: {
      imports: ["import { Spin } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;
        const size = properties.size === 'small' ? 'small' : properties.size === 'large' ? 'large' : 'default';

        return `<Spin size="${size}" ${properties.tip ? `tip="${properties.tip}"` : ''} />`;
      },
    },

    // ====================================================================
    // NAVIGATION (5 types)
    // ====================================================================

    tabs: {
      imports: ["import { Tabs } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<Tabs
  activeKey={activeKey}
  onChange={handleChange}
  ${properties.type ? `type="${properties.type}"` : ''}
  ${properties.tabPosition ? `tabPosition="${properties.tabPosition}"` : ''}
  items={${properties.items || 'tabItems'}}
/>`;
      },
    },

    breadcrumb: {
      imports: ["import { Breadcrumb } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<Breadcrumb
  items={${properties.items || 'breadcrumbItems'}}
  ${properties.separator ? `separator="${properties.separator}"` : ''}
/>`;
      },
    },

    navbar: {
      imports: ["import { Layout, Menu } from 'antd'", "const { Header } = Layout"],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;

        return `<Header ${properties.className ? `className="${properties.className}"` : ''}>
  <div style={{ float: 'left', color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
    ${properties.brand || 'App'}
  </div>
  ${children || '<Menu theme="dark" mode="horizontal" items={menuItems} />'}
</Header>`;
      },
    },

    sidebar: {
      imports: ["import { Layout, Menu } from 'antd'", "const { Sider } = Layout"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<Sider
  ${properties.collapsible ? 'collapsible' : ''}
  ${properties.collapsed !== undefined ? `collapsed={${properties.collapsed}}` : ''}
  width={${properties.width || 200}}
  ${properties.theme ? `theme="${properties.theme}"` : ''}
>
  <Menu
    mode="inline"
    ${properties.theme ? `theme="${properties.theme}"` : ''}
    items={${properties.items || 'menuItems'}}
  />
</Sider>`;
      },
    },

    pagination: {
      imports: ["import { Pagination } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<Pagination
  current={current}
  total={${properties.total || 100}}
  pageSize={${properties.pageSize || 10}}
  onChange={handleChange}
  ${properties.showSizeChanger ? 'showSizeChanger' : ''}
  ${properties.showQuickJumper ? 'showQuickJumper' : ''}
  ${properties.showTotal ? `showTotal={(total) => \`Total \${total} items\`}` : ''}
  ${properties.size ? `size="${properties.size}"` : ''}
/>`;
      },
    },

    // ====================================================================
    // LAYOUT (6 types)
    // ====================================================================

    accordion: {
      imports: ["import { Collapse } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<Collapse
  ${properties.accordion ? 'accordion' : ''}
  ${properties.bordered !== false ? '' : 'bordered={false}'}
  ${properties.expandIconPosition ? `expandIconPosition="${properties.expandIconPosition}"` : ''}
  items={${properties.items || 'collapseItems'}}
/>`;
      },
    },

    carousel: {
      imports: ["import { Carousel } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<Carousel
  ${properties.autoplay ? 'autoplay' : ''}
  ${properties.autoplaySpeed ? `autoplaySpeed={${properties.autoplaySpeed}}` : ''}
  ${properties.dots !== false ? '' : 'dots={false}'}
  ${properties.effect ? `effect="${properties.effect}"` : ''}
>
  {items?.map((item) => (
    <div key={item.id}>{item.content}</div>
  ))}
</Carousel>`;
      },
    },

    container: {
      imports: ["import { Layout } from 'antd'", "const { Content } = Layout"],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;

        return `<Content style={{ padding: '${properties.padding || '24px'}', ${properties.maxWidth ? `maxWidth: '${properties.maxWidth}'` : ''} }}>
  ${children || '{/* Content */}'}
</Content>`;
      },
    },

    divider: {
      imports: ["import { Divider } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<Divider
  ${properties.type === 'vertical' ? 'type="vertical"' : ''}
  ${properties.dashed ? 'dashed' : ''}
  ${properties.orientation ? `orientation="${properties.orientation}"` : ''}
>
  ${properties.text || ''}
</Divider>`;
      },
    },

    header: {
      imports: ["import { Layout, Typography } from 'antd'", "const { Header } = Layout", "const { Title } = Typography"],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;

        return `<Header style={{ padding: '16px 24px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
  ${properties.title ? `<Title level={4}>${properties.title}</Title>` : ''}
  ${properties.subtitle ? `<Typography.Text type="secondary">${properties.subtitle}</Typography.Text>` : ''}
  ${children || ''}
</Header>`;
      },
    },

    footer: {
      imports: ["import { Layout, Typography } from 'antd'", "const { Footer } = Layout"],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;

        return `<Footer style={{ textAlign: 'center', padding: '24px 50px' }}>
  ${properties.copyright ? `<Typography.Text>${properties.copyright}</Typography.Text>` : ''}
  ${children || ''}
</Footer>`;
      },
    },

    // ====================================================================
    // PROGRESS (2 types)
    // ====================================================================

    'progress-bar': {
      imports: ["import { Progress } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<Progress
  percent={${properties.value || 0}}
  ${properties.status ? `status="${properties.status}"` : ''}
  ${properties.showInfo !== false ? '' : 'showInfo={false}'}
  ${properties.strokeColor ? `strokeColor="${properties.strokeColor}"` : ''}
  ${properties.size ? `size="${properties.size}"` : ''}
/>`;
      },
    },

    'progress-circle': {
      imports: ["import { Progress } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<Progress
  type="circle"
  percent={${properties.value || 0}}
  ${properties.status ? `status="${properties.status}"` : ''}
  ${properties.width ? `width={${properties.width}}` : ''}
  ${properties.strokeColor ? `strokeColor="${properties.strokeColor}"` : ''}
/>`;
      },
    },

    // ====================================================================
    // SPECIALIZED (2 types)
    // ====================================================================

    searchBar: {
      imports: ["import { Input } from 'antd'", "import { SearchOutlined } from '@ant-design/icons'"],
      render: (ctx: RenderContext) => {
        const { properties } = ctx;

        return `<Input.Search
  placeholder="${properties.placeholder || 'Search...'}"
  ${properties.enterButton !== false ? 'enterButton' : ''}
  ${properties.loading ? 'loading' : ''}
  ${properties.size ? `size="${properties.size}"` : ''}
  onSearch={handleSearch}
/>`;
      },
    },

    filterPanel: {
      imports: ["import { Card, Space } from 'antd'"],
      render: (ctx: RenderContext) => {
        const { properties, children } = ctx;

        return `<Card title="Filters" ${properties.bordered !== false ? '' : 'bordered={false}'}>
  <Space direction="vertical" style={{ width: '100%' }}>
    ${children || '{/* Filter controls */}'}
  </Space>
</Card>`;
      },
    },
  },
};
