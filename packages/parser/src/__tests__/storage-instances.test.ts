import { describe, it, expect, beforeEach } from 'vitest';
import { ConventionProcessor } from '../convention-processor.js';

describe('Storage Instances Processing', () => {
  let processor: ConventionProcessor;

  beforeEach(() => {
    processor = new ConventionProcessor();
  });

  it('should process basic storage instance', () => {
    const yamlData = {
      deployments: {
        test: {
          version: '1.0.0',
          instances: {
            storage: {
              mainDB: {
                component: 'user-service',
                type: 'relational',
                namespace: 'data'
              }
            }
          }
        }
      }
    };

    const result = processor.process(yamlData);

    expect(result.deployments).toHaveLength(1);
    expect(result.deployments[0].instances?.storage).toBeDefined();
    expect(result.deployments[0].instances!.storage!.mainDB).toBeDefined();

    const storageInstance = result.deployments[0].instances!.storage!.mainDB;
    expect(storageInstance.component).toBe('user-service');
    expect(storageInstance.type).toBe('relational');
    expect(storageInstance.namespace).toBe('data');

    // Test default scale
    expect(storageInstance.scale).toBe(1);
  });

  it('should process storage instance with all valid properties', () => {
    const yamlData = {
      deployments: {
        test: {
          version: '1.0.0',
          instances: {
            storage: {
              enterpriseDB: {
                component: 'user-service',
                type: 'document',
                namespace: 'analytics',
                advertises: ['analytics.*', 'reports.*'],
                uses: ['auth.*'],
                scale: 3,
                // v3.5.0: Logical properties at root level (no config)
                persistence: 'durable',
                consistency: 'eventual',
                encryption: true,
                backup: true
              }
            }
          }
        }
      }
    };

    const result = processor.process(yamlData);
    const storageInstance = result.deployments[0].instances!.storage!.enterpriseDB;

    expect(storageInstance.component).toBe('user-service');
    expect(storageInstance.type).toBe('document');
    expect(storageInstance.namespace).toBe('analytics');

    // Check that pattern expansion worked correctly
    expect(Array.isArray(storageInstance.advertises)).toBe(true);
    expect(storageInstance.advertises).toContain('analytics.create');
    expect(storageInstance.advertises).toContain('analytics.read');
    expect(storageInstance.advertises).toContain('reports.create');
    expect(storageInstance.advertises).toContain('reports.read');

    expect(Array.isArray(storageInstance.uses)).toBe(true);
    expect(storageInstance.uses).toContain('auth.create');

    expect(storageInstance.scale).toBe(3);
    // v3.5.0: Check logical properties at root level
    expect(storageInstance.persistence).toBe('durable');
    expect(storageInstance.consistency).toBe('eventual');
    expect(storageInstance.encryption).toBe(true);
    expect(storageInstance.backup).toBe(true);
  });

  it('should process different storage types', () => {
    const yamlData = {
      deployments: {
        test: {
          version: '1.0.0',
          instances: {
            storage: {
              mainDB: {
                component: 'service-a',
                type: 'relational'
              },
              documentStore: {
                component: 'service-b',
                type: 'document'
              },
              cacheLayer: {
                component: 'service-c',
                type: 'keyvalue'
              },
              memoryCache: {
                component: 'service-d',
                type: 'cache'
              },
              fileStorage: {
                component: 'service-e',
                type: 'file'
              },
              blobStorage: {
                component: 'service-f',
                type: 'blob'
              },
              messageQueue: {
                component: 'service-g',
                type: 'queue'
              },
              searchEngine: {
                component: 'service-h',
                type: 'search'
              }
            }
          }
        }
      }
    };

    const result = processor.process(yamlData);
    const storage = result.deployments[0].instances!.storage!;

    expect(storage.mainDB.type).toBe('relational');
    expect(storage.documentStore.type).toBe('document');
    expect(storage.cacheLayer.type).toBe('keyvalue');
    expect(storage.memoryCache.type).toBe('cache');
    expect(storage.fileStorage.type).toBe('file');
    expect(storage.blobStorage.type).toBe('blob');
    expect(storage.messageQueue.type).toBe('queue');
    expect(storage.searchEngine.type).toBe('search');
  });

  it('should expand capability patterns for storage instances', () => {
    const yamlData = {
      deployments: {
        test: {
          version: '1.0.0',
          instances: {
            storage: {
              mainDB: {
                component: 'user-service',
                type: 'relational',
                advertises: 'operations.*'
              }
            }
          }
        }
      }
    };

    const result = processor.process(yamlData);
    const storageInstance = result.deployments[0].instances!.storage!.mainDB;

    expect(Array.isArray(storageInstance.advertises)).toBe(true);
    expect(storageInstance.advertises).toContain('operations.process');
    expect(storageInstance.advertises).toContain('operations.validate');
    expect(storageInstance.advertises).toContain('operations.transform');
  });

  it('should handle logical properties at root level', () => {
    const yamlData = {
      deployments: {
        test: {
          version: '1.0.0',
          instances: {
            storage: {
              configuredDB: {
                component: 'user-service',
                type: 'relational',
                // v3.5.0: All logical properties at root level (no config)
                persistence: 'durable',
                consistency: 'strong',
                backup: true,
                encryption: true,
                replication: 2
              }
            }
          }
        }
      }
    };

    const result = processor.process(yamlData);
    const storage = result.deployments[0].instances!.storage!.configuredDB;

    // v3.5.0: Check logical properties at root level
    expect(storage.persistence).toBe('durable');
    expect(storage.consistency).toBe('strong');
    expect(storage.backup).toBe(true);
    expect(storage.encryption).toBe(true);
    expect(storage.replication).toBe(2);
  });

  it('should handle multiple storage instances in single deployment', () => {
    const yamlData = {
      deployments: {
        production: {
          version: '1.0.0',
          instances: {
            storage: {
              primaryDB: {
                component: 'user-service',
                type: 'relational',
                scale: 3
              },
              analyticsDB: {
                component: 'analytics-service',
                type: 'document',
                scale: 2
              },
              sessionCache: {
                component: 'session-service',
                type: 'keyvalue',
                scale: 5
              }
            }
          }
        }
      }
    };

    const result = processor.process(yamlData);
    const storage = result.deployments[0].instances!.storage!;

    expect(Object.keys(storage)).toHaveLength(3);
    expect(storage.primaryDB).toBeDefined();
    expect(storage.analyticsDB).toBeDefined();
    expect(storage.sessionCache).toBeDefined();

    expect(storage.primaryDB.type).toBe('relational');
    expect(storage.analyticsDB.type).toBe('document');
    expect(storage.sessionCache.type).toBe('keyvalue');

    expect(storage.primaryDB.scale).toBe(3);
    expect(storage.analyticsDB.scale).toBe(2);
    expect(storage.sessionCache.scale).toBe(5);
  });
});
