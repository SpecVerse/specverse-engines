import { describe, it, expect, beforeEach } from 'vitest';
import { ConventionProcessor } from '../convention-processor.js';

describe('Security Instances Processing', () => {
  let processor: ConventionProcessor;

  beforeEach(() => {
    processor = new ConventionProcessor();
  });

  it('should process basic security instance', () => {
    const yamlData = {
      deployments: {
        test: {
          version: '1.0.0',
          instances: {
            security: {
              mainAuth: {
                component: 'auth-service',
                type: 'authentication',
                namespace: 'security'
              }
            }
          }
        }
      }
    };

    const result = processor.process(yamlData);

    expect(result.deployments).toHaveLength(1);
    expect(result.deployments[0].instances?.security).toBeDefined();
    expect(result.deployments[0].instances!.security!.mainAuth).toBeDefined();

    const securityInstance = result.deployments[0].instances!.security!.mainAuth;
    expect(securityInstance.component).toBe('auth-service');
    expect(securityInstance.type).toBe('authentication');
    expect(securityInstance.namespace).toBe('security');

    // Test default scale
    expect(securityInstance.scale).toBe(1);
  });

  it('should process security instance with all valid properties', () => {
    const yamlData = {
      deployments: {
        test: {
          version: '1.0.0',
          instances: {
            security: {
              rbacSystem: {
                component: 'auth-service',
                type: 'authorization',
                namespace: 'authz',
                advertises: ['authz.*', 'permissions.*'],
                uses: ['auth.identity.*'],
                scale: 2,
                // v3.5.0: Logical properties at root level (no config)
                scope: 'global',
                policies: ['admin', 'user'],
                encryption: 'strong',
                auditLevel: 'detailed'
              }
            }
          }
        }
      }
    };

    const result = processor.process(yamlData);
    const securityInstance = result.deployments[0].instances!.security!.rbacSystem;

    expect(securityInstance.component).toBe('auth-service');
    expect(securityInstance.type).toBe('authorization');
    expect(securityInstance.namespace).toBe('authz');

    // Check capability expansion
    expect(Array.isArray(securityInstance.advertises)).toBe(true);
    expect(securityInstance.advertises).toContain('authz.create');
    expect(securityInstance.advertises).toContain('permissions.create');

    expect(Array.isArray(securityInstance.uses)).toBe(true);
    expect(securityInstance.uses).toContain('auth.identity.create');

    expect(securityInstance.scale).toBe(2);
    // v3.5.0: Check logical properties at root level
    expect(securityInstance.scope).toBe('global');
    expect(securityInstance.policies).toEqual(['admin', 'user']);
    expect(securityInstance.encryption).toBe('strong');
    expect(securityInstance.auditLevel).toBe('detailed');
  });

  it('should process different security types', () => {
    const yamlData = {
      deployments: {
        test: {
          version: '1.0.0',
          instances: {
            security: {
              authProvider: {
                component: 'service-a',
                type: 'authentication'
              },
              rbacEngine: {
                component: 'service-b',
                type: 'authorization'
              },
              encryptionService: {
                component: 'service-c',
                type: 'encryption'
              },
              auditLog: {
                component: 'service-d',
                type: 'audit'
              },
              firewall: {
                component: 'service-e',
                type: 'firewall'
              },
              vulnerabilityScanner: {
                component: 'service-f',
                type: 'scanner'
              }
            }
          }
        }
      }
    };

    const result = processor.process(yamlData);
    const security = result.deployments[0].instances!.security!;

    expect(security.authProvider.type).toBe('authentication');
    expect(security.rbacEngine.type).toBe('authorization');
    expect(security.encryptionService.type).toBe('encryption');
    expect(security.auditLog.type).toBe('audit');
    expect(security.firewall.type).toBe('firewall');
    expect(security.vulnerabilityScanner.type).toBe('scanner');
  });

  it('should expand capability patterns for security instances', () => {
    const yamlData = {
      deployments: {
        test: {
          version: '1.0.0',
          instances: {
            security: {
              authService: {
                component: 'auth-service',
                type: 'authentication',
                advertises: 'operations.*'
              }
            }
          }
        }
      }
    };

    const result = processor.process(yamlData);
    const securityInstance = result.deployments[0].instances!.security!.authService;

    expect(Array.isArray(securityInstance.advertises)).toBe(true);
    expect(securityInstance.advertises).toContain('operations.process');
    expect(securityInstance.advertises).toContain('operations.validate');
    expect(securityInstance.advertises).toContain('operations.transform');
  });

  it('should handle multiple security instances in single deployment', () => {
    const yamlData = {
      deployments: {
        production: {
          version: '1.0.0',
          instances: {
            security: {
              oauthProvider: {
                component: 'auth-service',
                type: 'authentication',
                scale: 2
              },
              rbacSystem: {
                component: 'authz-service',
                type: 'authorization',
                scale: 2
              },
              encryptionService: {
                component: 'crypto-service',
                type: 'encryption',
                scale: 1
              }
            }
          }
        }
      }
    };

    const result = processor.process(yamlData);
    const security = result.deployments[0].instances!.security!;

    expect(Object.keys(security)).toHaveLength(3);
    expect(security.oauthProvider).toBeDefined();
    expect(security.rbacSystem).toBeDefined();
    expect(security.encryptionService).toBeDefined();

    expect(security.oauthProvider.type).toBe('authentication');
    expect(security.rbacSystem.type).toBe('authorization');
    expect(security.encryptionService.type).toBe('encryption');

    expect(security.oauthProvider.scale).toBe(2);
    expect(security.rbacSystem.scale).toBe(2);
    expect(security.encryptionService.scale).toBe(1);
  });
});
