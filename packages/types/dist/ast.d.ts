/**
 * SpecVerse v3.5 Convention Processor - Abstract Syntax Tree (AST) Interfaces
 *
 * Defines the structured representation of SpecVerse specifications after convention processing.
 * Includes approved schema extensions as per VALIDATION_REPORT.md.
 */
export interface PrimitiveSpec {
    name: string;
    baseType: 'String' | 'Integer' | 'Number' | 'Boolean';
    description: string;
    typeAlias: boolean;
    required?: boolean;
    unique?: boolean;
    validation?: {
        pattern?: string;
        values?: string[];
        min?: number;
        max?: number;
        format?: string;
    };
}
export interface AttributeSpec {
    name: string;
    type: string;
    required: boolean;
    unique: boolean;
    isArray?: boolean;
    auto?: string;
    min?: number;
    max?: number;
    default?: string;
    verified?: boolean;
    searchable?: boolean;
    values?: string[];
}
export interface RelationshipSpec {
    name: string;
    type: 'hasMany' | 'hasOne' | 'belongsTo' | 'manyToMany';
    target: string;
    cascade?: boolean;
    dependent?: boolean;
    eager?: boolean;
    lazy?: boolean;
    through?: string;
    optional?: boolean;
}
export interface LifecycleSpec {
    name: string;
    type: 'shorthand' | 'structured';
    states: string[];
    transitions?: {
        [action: string]: {
            from: string;
            to: string;
            condition?: string;
        };
    };
    actions: string[];
}
export interface ExecutablePropertiesSpec {
    description?: string;
    parameters: {
        [name: string]: AttributeSpec;
    };
    returns?: string;
    requires?: string[];
    ensures?: string[];
    publishes?: string[];
    steps?: string[];
}
export interface SubscriptionSpec {
    events: string[];
    handlers: {
        [event: string]: string;
    };
}
export interface CuredOperationsSpec {
    create?: ExecutablePropertiesSpec;
    retrieve?: ExecutablePropertiesSpec;
    retrieve_many?: ExecutablePropertiesSpec;
    update?: ExecutablePropertiesSpec;
    evolve?: ExecutablePropertiesSpec;
    delete?: ExecutablePropertiesSpec;
    validate?: ExecutablePropertiesSpec;
}
export interface ModelSpec {
    name: string;
    description?: string;
    extends?: string;
    profiles?: string[];
    metadata?: any;
    attributes: AttributeSpec[];
    relationships: RelationshipSpec[];
    lifecycles: LifecycleSpec[];
    behaviors: {
        [name: string]: ExecutablePropertiesSpec;
    };
    profileAttachment?: ProfileAttachmentSpec;
}
export interface ProfileAttachmentSpec {
    profiles: string[];
    conditions?: {
        [key: string]: string;
    };
    priority?: number;
}
export interface ControllerSpec {
    name: string;
    model: string;
    path?: string;
    description?: string;
    subscriptions: SubscriptionSpec;
    cured: CuredOperationsSpec;
    actions: {
        [name: string]: ExecutablePropertiesSpec;
    };
}
export interface ServiceSpec {
    name: string;
    description?: string;
    subscriptions: SubscriptionSpec;
    operations: {
        [name: string]: ExecutablePropertiesSpec;
    };
}
export interface ViewSpec {
    name: string;
    description?: string;
    type?: string;
    model?: string;
    tags?: string[];
    export?: boolean;
    layout?: any;
    subscriptions: SubscriptionSpec;
    uiComponents: {
        [name: string]: any;
    };
    properties: {
        [name: string]: any;
    };
}
/**
 * @deprecated This will be replaced by the `version` and `previousVersions` fields on `EventSpec`.
 * Kept for backward compatibility parsing of older specs.
 */
export interface EventPayloadSpec {
    name: string;
    description?: string;
    payload: AttributeSpec[];
}
export interface PreviousVersionInfo {
    version: number;
    compatibility?: 'backward' | 'forward' | 'full' | 'none';
    deprecated?: boolean;
    deprecationMessage?: string;
}
export interface EventSpec {
    name: string;
    description?: string;
    version?: number;
    previousVersions?: PreviousVersionInfo[];
    payload: AttributeSpec[];
}
export interface ComponentSpec {
    name: string;
    namespace: string;
    version: string;
    description?: string;
    tags?: string[];
    imports: any[];
    exports: any;
    primitives: PrimitiveSpec[];
    models: ModelSpec[];
    controllers: ControllerSpec[];
    services: ServiceSpec[];
    views: ViewSpec[];
    events: EventSpec[];
    commands?: any[];
    constraints?: ExpandedConstraint[];
    [key: string]: any;
}
/** A behavioural convention expanded into a Quint invariant/rule/temporal property. */
export interface ExpandedConstraint {
    type: 'invariant' | 'rule' | 'temporal';
    name: string;
    body: string;
    source: {
        convention: string;
        entity: string;
        input: string;
    };
}
export interface TransactionalPolicy {
    enabled?: boolean;
    isolation?: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE';
    propagation?: 'REQUIRED' | 'REQUIRES_NEW' | 'SUPPORTS' | 'NOT_SUPPORTED' | 'MANDATORY' | 'NEVER';
    timeout?: number;
    readOnly?: boolean;
}
export interface RetryPolicy {
    enabled?: boolean;
    maxAttempts?: number;
    backoffMs?: number;
    backoffMultiplier?: number;
    maxBackoffMs?: number;
    retryableErrors?: string[];
}
export interface CircuitBreakerPolicy {
    enabled?: boolean;
    failureThreshold?: number;
    successThreshold?: number;
    timeoutMs?: number;
    halfOpenAfterMs?: number;
}
export interface IdempotencyPolicy {
    enabled?: boolean;
    keyField?: string;
    ttlSeconds?: number;
}
export interface CachePolicy {
    enabled?: boolean;
    ttlSeconds?: number;
    keyFields?: string[];
}
export interface OperationPolicies {
    transactional?: TransactionalPolicy;
    retry?: RetryPolicy;
    circuitBreaker?: CircuitBreakerPolicy;
    idempotency?: IdempotencyPolicy;
    cache?: CachePolicy;
}
export interface RateLimitPolicy {
    enabled?: boolean;
    requestsPerMinute?: number;
    burstSize?: number;
    byIP?: boolean;
    byUser?: boolean;
    byApiKey?: boolean;
}
export interface ResourceConfiguration {
    requests?: {
        cpu?: string;
        memory?: string;
        ephemeralStorage?: string;
    };
    limits?: {
        cpu?: string;
        memory?: string;
        ephemeralStorage?: string;
    };
}
export interface AutoscalingConfiguration {
    enabled?: boolean;
    minReplicas?: number;
    maxReplicas?: number;
    targetCPU?: number;
    targetMemory?: number;
    customMetrics?: Array<{
        name: string;
        type: 'pods' | 'object' | 'external';
        target: {
            type: 'Utilization' | 'Value' | 'AverageValue';
            averageValue?: string;
            value?: string;
        };
    }>;
    scaleDown?: {
        stabilizationWindowSeconds?: number;
        selectPolicy?: 'Max' | 'Min' | 'Disabled';
    };
    scaleUp?: {
        stabilizationWindowSeconds?: number;
        selectPolicy?: 'Max' | 'Min' | 'Disabled';
    };
}
export interface InstanceSpec {
    component: string;
    namespace?: string;
    scale?: number;
    config?: {
        [key: string]: any;
    };
}
export interface ControllerInstanceSpec extends InstanceSpec {
    advertises?: string | string[];
    uses?: string | string[];
    rateLimit?: RateLimitPolicy;
    timeout?: {
        enabled?: boolean;
        requestMs?: number;
        keepAliveMs?: number;
    };
    operations?: {
        [name: string]: OperationPolicies;
    };
    resources?: ResourceConfiguration;
    autoscaling?: AutoscalingConfiguration;
}
export interface ServiceInstanceSpec extends InstanceSpec {
    advertises?: string | string[];
    uses?: string | string[];
    operations?: {
        [name: string]: OperationPolicies;
    };
    resources?: ResourceConfiguration;
    autoscaling?: AutoscalingConfiguration;
    security?: {
        enabled?: boolean;
        operations?: {
            [name: string]: {
                requires?: {
                    authenticated?: boolean;
                    roles?: string[];
                    permissions?: string[];
                    scopes?: string[];
                };
            };
        };
    };
    caching?: {
        enabled?: boolean;
        defaultTtlSeconds?: number;
        operations?: {
            [name: string]: {
                enabled?: boolean;
                ttlSeconds?: number;
                keyFields?: string[];
            };
        };
    };
}
export interface ViewInstanceSpec extends InstanceSpec {
    uses?: string | string[];
    caching?: {
        enabled?: boolean;
        ttlSeconds?: number;
    };
    prefetch?: {
        enabled?: boolean;
    };
}
export interface CommunicationInstanceSpec {
    namespace?: string;
    capabilities?: string[];
    type?: 'pubsub' | 'streaming' | 'rpc' | 'queue';
    config?: {
        [key: string]: any;
    };
    events?: {
        [eventName: string]: {
            ordering?: {
                enabled?: boolean;
                partitionKey?: string;
            };
            delivery?: {
                persistent?: boolean;
                retryOnFailure?: boolean;
                maxRetries?: number;
                retryDelayMs?: number;
            };
            deadLetterQueue?: {
                enabled?: boolean;
                maxReceiveCount?: number;
            };
        };
    };
    consumer?: {
        concurrency?: number;
        prefetch?: number;
        autoAck?: boolean;
    };
}
export interface StorageInstanceSpec extends InstanceSpec {
    type: 'relational' | 'document' | 'keyvalue' | 'cache' | 'file' | 'blob' | 'queue' | 'search';
    advertises?: string | string[];
    uses?: string | string[];
    persistence?: 'durable' | 'session' | 'cache' | 'temporary';
    consistency?: 'strong' | 'eventual' | 'weak';
    encryption?: boolean;
    backup?: boolean;
    replication?: number;
}
export interface SecurityInstanceSpec extends InstanceSpec {
    type: 'authentication' | 'authorization' | 'encryption' | 'audit' | 'firewall' | 'scanning' | 'secrets' | 'identity';
    advertises?: string | string[];
    uses?: string | string[];
    scope?: 'global' | 'regional' | 'local';
    policies?: string[];
    encryption?: 'none' | 'basic' | 'strong';
    auditLevel?: 'none' | 'basic' | 'detailed' | 'comprehensive';
}
export interface InfrastructureInstanceSpec extends InstanceSpec {
    type: 'gateway' | 'loadbalancer' | 'proxy' | 'cdn' | 'dns' | 'registry' | 'mesh' | 'ingress';
    advertises?: string | string[];
    uses?: string | string[];
    redundancy?: 'none' | 'low' | 'medium' | 'high' | 'enterprise';
    healthCheck?: boolean;
    loadBalancing?: boolean;
}
export interface MonitoringInstanceSpec extends InstanceSpec {
    type: 'metrics' | 'logging' | 'tracing' | 'alerting' | 'analytics' | 'profiling' | 'uptime' | 'synthetic';
    advertises?: string | string[];
    uses?: string | string[];
    scope?: 'global' | 'regional' | 'local';
    retention?: string;
    alerting?: boolean;
    sampling?: number;
}
export interface InstancesSpec {
    controllers?: {
        [name: string]: ControllerInstanceSpec;
    };
    services?: {
        [name: string]: ServiceInstanceSpec;
    };
    views?: {
        [name: string]: ViewInstanceSpec;
    };
    communications?: {
        [name: string]: CommunicationInstanceSpec;
    };
    storage?: {
        [name: string]: StorageInstanceSpec;
    };
    security?: {
        [name: string]: SecurityInstanceSpec;
    };
    infrastructure?: {
        [name: string]: InfrastructureInstanceSpec;
    };
    monitoring?: {
        [name: string]: MonitoringInstanceSpec;
    };
}
export interface DeploymentSpec {
    name: string;
    namespace: string;
    version: string;
    description?: string;
    environment?: string;
    instances?: InstancesSpec;
    [key: string]: any;
}
export interface ConditionalMappingCondition {
    environment?: string | string[];
    region?: string | string[];
    featureFlags?: string[];
    scale?: {
        min?: number;
        max?: number;
    };
}
export interface FallbackStrategy {
    instanceFactory: string;
    degradedMode?: boolean;
    warnings?: string[];
    errors?: string[];
    requiredAcknowledgment?: boolean;
}
export interface ConditionalCapabilityMapping {
    capability: string;
    instanceFactory: string;
    version?: string;
    configuration?: {
        [key: string]: any;
    };
    fallback?: FallbackStrategy[];
}
export interface ConditionalMapping {
    condition: ConditionalMappingCondition;
    capabilityMappings: ConditionalCapabilityMapping[];
}
export interface TechnologyConflict {
    instanceFactories: string[];
    reason: string;
    severity?: 'error' | 'warning';
}
export interface InstanceFactoryRef {
    name: string;
    source: string;
    version?: string;
    peerDependencies?: Array<{
        name: string;
        version: string;
        optional?: boolean;
    }>;
}
export interface ManifestSpec {
    name: string;
    namespace: string;
    specVersion?: string;
    version?: string;
    description?: string;
    component?: any;
    deployment?: any;
    instanceFactories?: InstanceFactoryRef[];
    conditionalMappings?: ConditionalMapping[];
    capabilityMappings?: Array<{
        capability: string;
        instanceFactory: string;
        version?: string;
        configuration?: {
            [key: string]: any;
        };
    }>;
    conflicts?: TechnologyConflict[];
    implementationTypes?: any;
    logicalDeployment?: any;
    communicationChannels?: any;
    namespaceConfiguration?: any;
    [key: string]: any;
}
export interface SpecVerseAST {
    components: ComponentSpec[];
    deployments: DeploymentSpec[];
    manifests: ManifestSpec[];
}
//# sourceMappingURL=ast.d.ts.map