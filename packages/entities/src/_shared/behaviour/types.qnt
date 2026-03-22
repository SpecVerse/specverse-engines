// SpecVerse Shared Types for Quint Behavioural Specifications
// These types model the SpecVerse specification domain for formal verification.

module specverseTypes {

  // ─── Primitive Types ───────────────────────────────────────────────

  type AttributeType = str  // "String", "Integer", "UUID", "DateTime", etc.

  // ─── Attribute ─────────────────────────────────────────────────────

  type Attribute = {
    name: str,
    attrType: AttributeType,
    required: bool,
    hasConstraints: bool
  }

  // ─── Relationship ──────────────────────────────────────────────────

  type Relationship = {
    name: str,
    relType: str,         // "belongsTo", "hasMany", "hasOne", "manyToMany"
    targetModel: str
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────

  type LifecycleState = {
    name: str,
    isInitial: bool,
    isTerminal: bool
  }

  type LifecycleTransition = {
    name: str,
    from: str,
    to: str
  }

  type Lifecycle = {
    name: str,
    states: Set[LifecycleState],
    transitions: Set[LifecycleTransition]
  }

  // ─── Profile ───────────────────────────────────────────────────────

  type Profile = {
    name: str,
    attributes: Set[Attribute]
  }

  // ─── Model ─────────────────────────────────────────────────────────

  type Model = {
    name: str,
    attributes: str -> Attribute,
    relationships: str -> Relationship,
    hasLifecycle: bool,
    lifecycle: Lifecycle,
    profiles: Set[Profile],
    hasParentRelationship: bool,
    parentModel: str,
    hasExternalIntegration: bool,
    hasValidationConstraints: bool
  }

  // ─── Controller ────────────────────────────────────────────────────

  type Endpoint = {
    operation: str,
    method: str,          // "GET", "POST", "PUT", "DELETE"
    path: str,
    acceptsOperationContext: bool
  }

  type Controller = {
    name: str,
    model: str,
    component: str,
    pattern: str,         // "StandardCURED", "ParentScopedCURED"
    parentModel: str,
    operations: Set[str],
    endpoints: Set[Endpoint],
    hasAssociationOps: bool,
    manyToManyTargets: Set[str],
    path: str,
    dependencies: Set[str]
  }

  // ─── Service ───────────────────────────────────────────────────────

  type ServiceOperation = {
    name: str,
    acceptsOperationContext: bool,
    callsValidateInternally: bool
  }

  type Service = {
    name: str,
    model: str,
    component: str,
    pattern: str,         // "LifecycleService", "RelationshipService", etc.
    operations: Set[ServiceOperation],
    subscribes: Set[str],
    dependencies: Set[str]
  }

  // ─── Event ─────────────────────────────────────────────────────────

  type Event = {
    name: str,
    model: str,
    pattern: str,         // "StandardEvents", "LifecycleEvents", etc.
    attributes: str -> Attribute
  }

  // ─── View ──────────────────────────────────────────────────────────

  type UIComponent = {
    componentType: str,
    name: str,
    tabs: Set[{ name: str }]
  }

  type View = {
    name: str,
    viewType: str,        // "list", "detail", "form", "dashboard"
    primaryModel: str,
    models: Set[str],
    subscribes: Set[str],
    uiComponents: Set[UIComponent],
    hasProfileSupport: bool,
    pattern: str
  }

  // ─── Deployment ────────────────────────────────────────────────────

  type DeploymentInstance = {
    name: str,
    component: str,
    namespace: str,
    advertises: Set[str],
    uses: Set[str],
    scale: int,
    category: str         // "controller", "service", "view"
  }

  type Channel = {
    name: str,
    namespace: str,
    capabilities: Set[str],
    channelType: str      // "pubsub", "request-reply", "stream"
  }

  type Deployment = {
    name: str,
    environment: str,
    instances: Set[DeploymentInstance],
    channels: Set[Channel]
  }

  // ─── Component ─────────────────────────────────────────────────────

  type Component = {
    name: str,
    models: Set[Model],
    controllers: Set[Controller],
    services: Set[Service],
    events: Set[Event],
    views: Set[View]
  }

  // ─── Convention ────────────────────────────────────────────────────

  type ModifierEffect = {
    adds: Set[str]
  }

  type ConventionTemplate = {
    name: str,
    body: str
  }

  type ConventionDefinition = {
    name: str,
    domain: str,          // "specly", "quint"
    baseType: str,
    pattern: str,
    expandsTo: str,
    template: ConventionTemplate,
    whenModifiedBy: str -> ModifierEffect
  }

  // ─── Measure ───────────────────────────────────────────────────────

  type Metric = {
    name: str,
    field: str,
    aggregation: str      // "sum", "count", "avg", "min", "max", etc.
  }

  type Dimension = {
    field: str,
    isTimeDimension: bool,
    isComputedDimension: bool
  }

  type MeasureFilter = {
    field: str,
    isLifecycleFilter: bool
  }

  type KPI = {
    name: str,
    derivedFrom: Set[str]
  }

  type Measure = {
    name: str,
    sourceModel: str,
    metrics: Set[Metric],
    dimensions: Set[Dimension],
    filters: Set[MeasureFilter],
    kpis: Set[KPI]
  }

  // ─── Command ───────────────────────────────────────────────────────

  type CommandArgument = {
    name: str,
    required: bool,
    position: int
  }

  type CommandOption = {
    longName: str,
    shortName: str,
    optionType: str,
    required: bool,
    hasDefault: bool,
    defaultValue: str,
    envVar: str
  }

  type Command = {
    name: str,
    description: str,
    parent: str,
    depth: int,
    arguments: List[CommandArgument],
    options: Set[CommandOption],
    subcommands: Set[str],
    hasDirectAction: bool,
    isIdempotent: bool,
    conventions: Set[str],
    serviceRef: str,
    modelRef: str
  }

}
