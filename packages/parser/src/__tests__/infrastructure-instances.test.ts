import { describe, it, expect, beforeEach } from 'vitest';
import { ConventionProcessor } from '../convention-processor.js';

describe('Infrastructure Instances Processing', () => {
  let processor: ConventionProcessor;

  beforeEach(() => {
    processor = new ConventionProcessor();
  });

  it('should process basic infrastructure instance', () => {
    const yamlData = {
      deployments: {
        test: {
          version: '1.0.0',
          instances: {
            infrastructure: {
              mainGateway: {
                component: 'gateway-service',
                type: 'gateway',
                namespace: 'infra'
              }
            }
          }
        }
      }
    };

    const result = processor.process(yamlData);

    expect(result.deployments).toHaveLength(1);
    expect(result.deployments[0].instances?.infrastructure).toBeDefined();
    expect(result.deployments[0].instances!.infrastructure!.mainGateway).toBeDefined();

    const infraInstance = result.deployments[0].instances!.infrastructure!.mainGateway;
    expect(infraInstance.component).toBe('gateway-service');
    expect(infraInstance.type).toBe('gateway');
    expect(infraInstance.namespace).toBe('infra');

    // Test default scale
    expect(infraInstance.scale).toBe(1);
  });

  it('should process infrastructure instance with all valid properties', () => {
    const yamlData = {
      deployments: {
        test: {
          version: '1.0.0',
          instances: {
            infrastructure: {
              apiGateway: {
                component: 'gateway-service',
                type: 'gateway',
                namespace: 'api',
                advertises: ['routing.*', 'balancing.*'],
                uses: ['backend.*'],
                scale: 3,
                // v3.5.0: Logical properties at root level (no config)
                redundancy: 'high',
                healthCheck: true,
                loadBalancing: true
              }
            }
          }
        }
      }
    };

    const result = processor.process(yamlData);
    const infraInstance = result.deployments[0].instances!.infrastructure!.apiGateway;

    expect(infraInstance.component).toBe('gateway-service');
    expect(infraInstance.type).toBe('gateway');
    expect(infraInstance.namespace).toBe('api');

    // Check capability expansion
    expect(Array.isArray(infraInstance.advertises)).toBe(true);
    expect(infraInstance.advertises).toContain('routing.create');
    expect(infraInstance.advertises).toContain('balancing.create');

    expect(Array.isArray(infraInstance.uses)).toBe(true);
    expect(infraInstance.uses).toContain('backend.create');

    expect(infraInstance.scale).toBe(3);
    // v3.5.0: Check logical properties at root level
    expect(infraInstance.redundancy).toBe('high');
    expect(infraInstance.healthCheck).toBe(true);
    expect(infraInstance.loadBalancing).toBe(true);
  });

  it('should process different infrastructure types', () => {
    const yamlData = {
      deployments: {
        test: {
          version: '1.0.0',
          instances: {
            infrastructure: {
              gateway: {
                component: 'service-a',
                type: 'gateway'
              },
              loadBalancer: {
                component: 'service-b',
                type: 'loadbalancer'
              },
              cdn: {
                component: 'service-c',
                type: 'cdn'
              },
              dns: {
                component: 'service-d',
                type: 'dns'
              },
              proxyServer: {
                component: 'service-e',
                type: 'proxy'
              },
              meshController: {
                component: 'service-f',
                type: 'servicemesh'
              }
            }
          }
        }
      }
    };

    const result = processor.process(yamlData);
    const infrastructure = result.deployments[0].instances!.infrastructure!;

    expect(infrastructure.gateway.type).toBe('gateway');
    expect(infrastructure.loadBalancer.type).toBe('loadbalancer');
    expect(infrastructure.cdn.type).toBe('cdn');
    expect(infrastructure.dns.type).toBe('dns');
    expect(infrastructure.proxyServer.type).toBe('proxy');
    expect(infrastructure.meshController.type).toBe('servicemesh');
  });

  it('should expand capability patterns for infrastructure instances', () => {
    const yamlData = {
      deployments: {
        test: {
          version: '1.0.0',
          instances: {
            infrastructure: {
              gatewayService: {
                component: 'gateway-service',
                type: 'gateway',
                advertises: 'operations.*'
              }
            }
          }
        }
      }
    };

    const result = processor.process(yamlData);
    const infraInstance = result.deployments[0].instances!.infrastructure!.gatewayService;

    expect(Array.isArray(infraInstance.advertises)).toBe(true);
    expect(infraInstance.advertises).toContain('operations.process');
    expect(infraInstance.advertises).toContain('operations.validate');
    expect(infraInstance.advertises).toContain('operations.transform');
  });

  it('should handle multiple infrastructure instances in single deployment', () => {
    const yamlData = {
      deployments: {
        production: {
          version: '1.0.0',
          instances: {
            infrastructure: {
              apiGateway: {
                component: 'gateway-service',
                type: 'gateway',
                scale: 2
              },
              loadBalancer: {
                component: 'lb-service',
                type: 'loadbalancer',
                scale: 3
              },
              cdnNetwork: {
                component: 'cdn-service',
                type: 'cdn',
                scale: 1
              }
            }
          }
        }
      }
    };

    const result = processor.process(yamlData);
    const infrastructure = result.deployments[0].instances!.infrastructure!;

    expect(Object.keys(infrastructure)).toHaveLength(3);
    expect(infrastructure.apiGateway).toBeDefined();
    expect(infrastructure.loadBalancer).toBeDefined();
    expect(infrastructure.cdnNetwork).toBeDefined();

    expect(infrastructure.apiGateway.type).toBe('gateway');
    expect(infrastructure.loadBalancer.type).toBe('loadbalancer');
    expect(infrastructure.cdnNetwork.type).toBe('cdn');

    expect(infrastructure.apiGateway.scale).toBe(2);
    expect(infrastructure.loadBalancer.scale).toBe(3);
    expect(infrastructure.cdnNetwork.scale).toBe(1);
  });
});
