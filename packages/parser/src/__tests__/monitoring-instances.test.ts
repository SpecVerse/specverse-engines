import { describe, it, expect, beforeEach } from 'vitest';
import { ConventionProcessor } from '../convention-processor.js';

describe('Monitoring Instances Processing', () => {
  let processor: ConventionProcessor;

  beforeEach(() => {
    processor = new ConventionProcessor();
  });

  it('should process basic monitoring instance', () => {
    const yamlData = {
      deployments: {
        test: {
          version: '1.0.0',
          instances: {
            monitoring: {
              mainMetrics: {
                component: 'monitoring-service',
                type: 'metrics',
                namespace: 'observability'
              }
            }
          }
        }
      }
    };

    const result = processor.process(yamlData);

    expect(result.deployments).toHaveLength(1);
    expect(result.deployments[0].instances?.monitoring).toBeDefined();
    expect(result.deployments[0].instances!.monitoring!.mainMetrics).toBeDefined();

    const monitoringInstance = result.deployments[0].instances!.monitoring!.mainMetrics;
    expect(monitoringInstance.component).toBe('monitoring-service');
    expect(monitoringInstance.type).toBe('metrics');
    expect(monitoringInstance.namespace).toBe('observability');

    // Test default scale
    expect(monitoringInstance.scale).toBe(1);
  });

  it('should process monitoring instance with all valid properties', () => {
    const yamlData = {
      deployments: {
        test: {
          version: '1.0.0',
          instances: {
            monitoring: {
              prometheusStack: {
                component: 'metrics-service',
                type: 'metrics',
                namespace: 'metrics',
                advertises: ['metrics.*', 'health.*'],
                uses: ['storage.*'],
                scale: 2,
                // v3.5.0: Logical properties at root level (no config)
                scope: 'global',
                retention: '90d',
                alerting: true,
                sampling: 0.1
              }
            }
          }
        }
      }
    };

    const result = processor.process(yamlData);
    const monitoringInstance = result.deployments[0].instances!.monitoring!.prometheusStack;

    expect(monitoringInstance.component).toBe('metrics-service');
    expect(monitoringInstance.type).toBe('metrics');
    expect(monitoringInstance.namespace).toBe('metrics');

    // Check capability expansion
    expect(Array.isArray(monitoringInstance.advertises)).toBe(true);
    expect(monitoringInstance.advertises).toContain('metrics.create');
    expect(monitoringInstance.advertises).toContain('health.create');

    expect(Array.isArray(monitoringInstance.uses)).toBe(true);
    expect(monitoringInstance.uses).toContain('storage.create');

    expect(monitoringInstance.scale).toBe(2);
    // v3.5.0: Check logical properties at root level
    expect(monitoringInstance.scope).toBe('global');
    expect(monitoringInstance.retention).toBe('90d');
    expect(monitoringInstance.alerting).toBe(true);
    expect(monitoringInstance.sampling).toBe(0.1);
  });

  it('should process different monitoring types', () => {
    const yamlData = {
      deployments: {
        test: {
          version: '1.0.0',
          instances: {
            monitoring: {
              logSystem: {
                component: 'service-a',
                type: 'logging'
              },
              metricsCollector: {
                component: 'service-b',
                type: 'metrics'
              },
              tracingService: {
                component: 'service-c',
                type: 'tracing'
              },
              alertManager: {
                component: 'service-d',
                type: 'alerting'
              },
              profiler: {
                component: 'service-e',
                type: 'profiling'
              },
              healthChecker: {
                component: 'service-f',
                type: 'health'
              }
            }
          }
        }
      }
    };

    const result = processor.process(yamlData);
    const monitoring = result.deployments[0].instances!.monitoring!;

    expect(monitoring.logSystem.type).toBe('logging');
    expect(monitoring.metricsCollector.type).toBe('metrics');
    expect(monitoring.tracingService.type).toBe('tracing');
    expect(monitoring.alertManager.type).toBe('alerting');
    expect(monitoring.profiler.type).toBe('profiling');
    expect(monitoring.healthChecker.type).toBe('health');
  });

  it('should expand capability patterns for monitoring instances', () => {
    const yamlData = {
      deployments: {
        test: {
          version: '1.0.0',
          instances: {
            monitoring: {
              metricsService: {
                component: 'metrics-service',
                type: 'metrics',
                advertises: 'operations.*'
              }
            }
          }
        }
      }
    };

    const result = processor.process(yamlData);
    const monitoringInstance = result.deployments[0].instances!.monitoring!.metricsService;

    expect(Array.isArray(monitoringInstance.advertises)).toBe(true);
    expect(monitoringInstance.advertises).toContain('operations.process');
    expect(monitoringInstance.advertises).toContain('operations.validate');
    expect(monitoringInstance.advertises).toContain('operations.transform');
  });

  it('should handle multiple monitoring instances in single deployment', () => {
    const yamlData = {
      deployments: {
        production: {
          version: '1.0.0',
          instances: {
            monitoring: {
              prometheusStack: {
                component: 'metrics-service',
                type: 'metrics',
                scale: 3
              },
              elkLogging: {
                component: 'logging-service',
                type: 'logging',
                scale: 2
              },
              jaegerTracing: {
                component: 'tracing-service',
                type: 'tracing',
                scale: 1
              }
            }
          }
        }
      }
    };

    const result = processor.process(yamlData);
    const monitoring = result.deployments[0].instances!.monitoring!;

    expect(Object.keys(monitoring)).toHaveLength(3);
    expect(monitoring.prometheusStack).toBeDefined();
    expect(monitoring.elkLogging).toBeDefined();
    expect(monitoring.jaegerTracing).toBeDefined();

    expect(monitoring.prometheusStack.type).toBe('metrics');
    expect(monitoring.elkLogging.type).toBe('logging');
    expect(monitoring.jaegerTracing.type).toBe('tracing');

    expect(monitoring.prometheusStack.scale).toBe(3);
    expect(monitoring.elkLogging.scale).toBe(2);
    expect(monitoring.jaegerTracing.scale).toBe(1);
  });
});
