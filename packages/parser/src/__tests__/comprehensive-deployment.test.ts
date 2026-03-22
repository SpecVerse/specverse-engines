import { describe, it, expect, beforeEach } from 'vitest';
import { ConventionProcessor } from '../convention-processor.js';

describe('Comprehensive Deployment with All Instance Types', () => {
  let processor: ConventionProcessor;

  beforeEach(() => {
    processor = new ConventionProcessor();
  });

  it('should process complete deployment with all 4 instance types', () => {
    const yamlData = {
      deployments: {
        enterpriseApp: {
          version: '3.5.0',
          description: 'Enterprise application with complete instance ecosystem',
          environment: 'production',
          instances: {
            // Logical instances
            controllers: {
              apiController: {
                component: 'enterprise-app',
                namespace: 'api',
                advertises: '*',
                uses: ['data.*', 'cache.*'],
                scale: 5
              }
            },
            services: {
              businessService: {
                component: 'enterprise-app',
                namespace: 'business',
                advertises: ['operations.*'],
                uses: ['database.*'],
                scale: 3
              }
            },
            views: {
              webUI: {
                component: 'enterprise-app',
                namespace: 'web',
                uses: ['models.*'],
                scale: 2
              }
            },
            communications: {
              eventBus: {
                namespace: 'global',
                capabilities: ['api.*', 'business.*', 'data.*'],
                type: 'pubsub'
              }
            },

            // Phase 1: Storage instances (v3.5.0: logical properties at root)
            storage: {
              mainDatabase: {
                component: 'enterprise-app',
                namespace: 'data',
                type: 'relational',
                advertises: ['persistence.*'],
                scale: 3,
                persistence: 'durable',
                consistency: 'strong',
                replication: 2,
                backup: true,
                encryption: true
              },
              cacheLayer: {
                component: 'enterprise-app',
                namespace: 'cache',
                type: 'keyvalue',
                advertises: ['cache.*'],
                scale: 6,
                persistence: 'cache',
                consistency: 'eventual',
                backup: false
              },
              fileStorage: {
                component: 'enterprise-app',
                namespace: 'files',
                type: 'blob',
                advertises: ['storage.*'],
                persistence: 'durable',
                consistency: 'eventual',
                backup: true,
                encryption: true
              }
            },

            // Phase 2: Security instances (v3.5.0: logical properties at root)
            security: {
              authProvider: {
                component: 'enterprise-app',
                namespace: 'auth',
                type: 'authentication',
                advertises: ['auth.*'],
                scope: 'global',
                policies: ['oauth2', 'jwt-validation'],
                encryption: 'strong',
                auditLevel: 'detailed'
              },
              authzProvider: {
                component: 'enterprise-app',
                namespace: 'authz',
                type: 'authorization',
                advertises: ['authz.*'],
                uses: ['auth.identity.*'],
                scope: 'regional',
                policies: ['role-based'],
                encryption: 'basic',
                auditLevel: 'detailed'
              },
              auditLogger: {
                component: 'enterprise-app',
                namespace: 'audit',
                type: 'audit',
                advertises: ['audit.*'],
                scope: 'global',
                policies: ['pci-compliance'],
                auditLevel: 'comprehensive'
              }
            },

            // Phase 3: Infrastructure instances (v3.5.0: logical properties at root)
            infrastructure: {
              apiGateway: {
                component: 'enterprise-app',
                namespace: 'gateway',
                type: 'gateway',
                advertises: ['routing.*'],
                redundancy: 'high',
                healthCheck: true,
                loadBalancing: true
              },
              loadBalancer: {
                component: 'enterprise-app',
                namespace: 'lb',
                type: 'loadbalancer',
                advertises: ['balancing.*'],
                redundancy: 'high',
                healthCheck: true,
                loadBalancing: true
              },
              cdn: {
                component: 'enterprise-app',
                namespace: 'cdn',
                type: 'cdn',
                redundancy: 'high',
                healthCheck: true,
                loadBalancing: false
              }
            },

            // Phase 4: Monitoring instances (v3.5.0: logical properties at root)
            monitoring: {
              metrics: {
                component: 'enterprise-app',
                namespace: 'metrics',
                type: 'metrics',
                advertises: ['metrics.*'],
                scope: 'global',
                retention: '90d',
                alerting: true,
                sampling: 1.0
              },
              logging: {
                component: 'enterprise-app',
                namespace: 'logging',
                type: 'logging',
                advertises: ['logs.*'],
                scope: 'global',
                retention: '365d',
                alerting: false,
                sampling: 0.5
              },
              tracing: {
                component: 'enterprise-app',
                namespace: 'tracing',
                type: 'tracing',
                advertises: ['traces.*'],
                scope: 'global',
                retention: '30d',
                alerting: false,
                sampling: 0.1
              },
              alerting: {
                component: 'enterprise-app',
                namespace: 'alerts',
                type: 'alerting',
                advertises: ['alerts.*'],
                scope: 'global',
                retention: '365d',
                alerting: true,
                sampling: 1.0
              }
            }
          }
        }
      }
    };

    const result = processor.process(yamlData);

    // Verify deployment was processed
    expect(result.deployments).toHaveLength(1);
    const deployment = result.deployments[0];
    expect(deployment.name).toBe('enterpriseApp');
    expect(deployment.version).toBe('3.5.0');
    expect(deployment.environment).toBe('production');

    // Verify all instance types exist
    expect(deployment.instances).toBeDefined();
    const instances = deployment.instances!;

    // Verify logical instances
    expect(instances.controllers).toBeDefined();
    expect(Object.keys(instances.controllers!)).toHaveLength(1);
    expect(instances.services).toBeDefined();
    expect(Object.keys(instances.services!)).toHaveLength(1);
    expect(instances.views).toBeDefined();
    expect(Object.keys(instances.views!)).toHaveLength(1);
    expect(instances.communications).toBeDefined();
    expect(Object.keys(instances.communications!)).toHaveLength(1);

    // Verify Phase 1: Storage instances (v3.5.0: check properties at root level)
    expect(instances.storage).toBeDefined();
    expect(Object.keys(instances.storage!)).toHaveLength(3);
    expect(instances.storage!.mainDatabase).toBeDefined();
    expect(instances.storage!.mainDatabase.type).toBe('relational');
    expect(instances.storage!.mainDatabase.persistence).toBe('durable');
    expect(instances.storage!.mainDatabase.consistency).toBe('strong');
    expect(instances.storage!.cacheLayer).toBeDefined();
    expect(instances.storage!.cacheLayer.type).toBe('keyvalue');
    expect(instances.storage!.fileStorage).toBeDefined();
    expect(instances.storage!.fileStorage.type).toBe('blob');

    // Verify Phase 2: Security instances (v3.5.0: check properties at root level)
    expect(instances.security).toBeDefined();
    expect(Object.keys(instances.security!)).toHaveLength(3);
    expect(instances.security!.authProvider).toBeDefined();
    expect(instances.security!.authProvider.type).toBe('authentication');
    expect(instances.security!.authProvider.scope).toBe('global');
    expect(instances.security!.authProvider.encryption).toBe('strong');
    expect(instances.security!.authzProvider).toBeDefined();
    expect(instances.security!.authzProvider.type).toBe('authorization');
    expect(instances.security!.auditLogger).toBeDefined();
    expect(instances.security!.auditLogger.type).toBe('audit');

    // Verify Phase 3: Infrastructure instances (v3.5.0: check properties at root level)
    expect(instances.infrastructure).toBeDefined();
    expect(Object.keys(instances.infrastructure!)).toHaveLength(3);
    expect(instances.infrastructure!.apiGateway).toBeDefined();
    expect(instances.infrastructure!.apiGateway.type).toBe('gateway');
    expect(instances.infrastructure!.apiGateway.redundancy).toBe('high');
    expect(instances.infrastructure!.loadBalancer).toBeDefined();
    expect(instances.infrastructure!.loadBalancer.type).toBe('loadbalancer');
    expect(instances.infrastructure!.cdn).toBeDefined();
    expect(instances.infrastructure!.cdn.type).toBe('cdn');

    // Verify Phase 4: Monitoring instances (v3.5.0: check properties at root level)
    expect(instances.monitoring).toBeDefined();
    expect(Object.keys(instances.monitoring!)).toHaveLength(4);
    expect(instances.monitoring!.metrics).toBeDefined();
    expect(instances.monitoring!.metrics.type).toBe('metrics');
    expect(instances.monitoring!.metrics.scope).toBe('global');
    expect(instances.monitoring!.logging).toBeDefined();
    expect(instances.monitoring!.logging.type).toBe('logging');
    expect(instances.monitoring!.tracing).toBeDefined();
    expect(instances.monitoring!.tracing.type).toBe('tracing');
    expect(instances.monitoring!.alerting).toBeDefined();
    expect(instances.monitoring!.alerting.type).toBe('alerting');

    // Verify capability expansion works across all instance types
    expect(instances.storage!.mainDatabase.advertises).toContain('persistence.create');
    expect(instances.security!.authProvider.advertises).toContain('auth.create');
    expect(instances.infrastructure!.apiGateway.advertises).toContain('routing.create');
    expect(instances.monitoring!.metrics.advertises).toContain('metrics.create');

    // Verify logical property values at root level (v3.5.0)
    expect(instances.infrastructure!.loadBalancer.redundancy).toBe('high');
    expect(instances.monitoring!.metrics.retention).toBe('90d');
    expect(instances.monitoring!.metrics.scope).toBe('global');
    expect(instances.storage!.mainDatabase.encryption).toBe(true);
    expect(instances.security!.authProvider.policies).toEqual(['oauth2', 'jwt-validation']);
  });

  it('should validate instance relationships and dependencies', () => {
    const yamlData = {
      deployments: {
        test: {
          version: '3.5.0',
          instances: {
            controllers: {
              mainController: {
                component: 'app',
                namespace: 'main',
                advertises: '*',
                uses: ['storage.*', 'security.*', 'monitoring.*']
              }
            },
            storage: {
              db: {
                component: 'app',
                namespace: 'data',
                type: 'relational',
                advertises: ['storage.*'],
                uses: ['security.encrypt.*', 'monitoring.metrics.*']
              }
            },
            security: {
              auth: {
                component: 'app',
                namespace: 'auth',
                type: 'authentication',
                advertises: ['security.*'],
                uses: ['monitoring.audit.*']
              }
            },
            infrastructure: {
              gateway: {
                component: 'app',
                namespace: 'gateway',
                type: 'gateway',
                advertises: ['routing.*'],
                uses: ['security.auth.*', 'monitoring.health.*']
              }
            },
            monitoring: {
              metrics: {
                component: 'app',
                namespace: 'monitoring',
                type: 'metrics',
                advertises: ['monitoring.*']
              }
            }
          }
        }
      }
    };

    const result = processor.process(yamlData);
    const instances = result.deployments[0].instances!;

    // Verify cross-instance dependencies via uses
    expect(instances.controllers!.mainController.uses).toContain('storage.create');
    expect(instances.controllers!.mainController.uses).toContain('security.create');
    expect(instances.controllers!.mainController.uses).toContain('monitoring.create');

    expect(instances.storage!.db.uses).toContain('security.encrypt.create');
    expect(instances.storage!.db.uses).toContain('monitoring.metrics.create');

    expect(instances.security!.auth.uses).toContain('monitoring.audit.create');

    expect(instances.infrastructure!.gateway.uses).toContain('security.auth.create');
    expect(instances.infrastructure!.gateway.uses).toContain('monitoring.health.create');
  });
});
