/**
 * SpecVerse v3.3 Schema Validation Tests
 *
 * Tests for Metadata Primitives and Validate Operation features
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { UnifiedSpecVerseParser } from '../unified-parser.js';
import fs from 'fs';
import path from 'path';

// Load the schema for testing
const schemaPath = path.join(__dirname, '../../../schema/SPECVERSE-SCHEMA.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

describe('v3.3 Schema Features', () => {
  let parser: UnifiedSpecVerseParser;

  beforeEach(() => {
    parser = new UnifiedSpecVerseParser(schema);
  });

  describe('Metadata Primitives', () => {
    describe('ID Generation', () => {
      it('should accept simple ID strategy (uuid)', () => {
        const yamlContent = `
components:
  TestApp:
    version: "3.3.0"
    models:
      User:
        metadata:
          id: uuid
        attributes:
          name: String required
`;
        const result = parser.parse(yamlContent);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept simple ID strategy (integer)', () => {
        const yamlContent = `
components:
  TestApp:
    version: "3.3.0"
    models:
      User:
        metadata:
          id: integer
        attributes:
          name: String required
`;
        const result = parser.parse(yamlContent);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept simple ID strategy (auto)', () => {
        const yamlContent = `
components:
  TestApp:
    version: "3.3.0"
    models:
      User:
        metadata:
          id: auto
        attributes:
          name: String required
`;
        const result = parser.parse(yamlContent);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept advanced ID configuration with custom name', () => {
        const yamlContent = `
components:
  TestApp:
    version: "3.3.0"
    models:
      User:
        metadata:
          id:
            type: uuid
            name: userId
        attributes:
          name: String required
`;
        const result = parser.parse(yamlContent);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept composite ID configuration', () => {
        const yamlContent = `
components:
  TestApp:
    version: "3.3.0"
    models:
      OrderItem:
        metadata:
          id:
            type: composite
            fields:
              - orderId
              - productId
        attributes:
          orderId: UUID required
          productId: UUID required
          quantity: Integer required
`;
        const result = parser.parse(yamlContent);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject invalid ID strategy', () => {
        const yamlContent = `
components:
  TestApp:
    version: "3.3.0"
    models:
      User:
        metadata:
          id: invalid_strategy
        attributes:
          name: String required
`;
        const result = parser.parse(yamlContent);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('Label Configuration', () => {
      it('should accept single label field (string)', () => {
        const yamlContent = `
components:
  TestApp:
    version: "3.3.0"
    models:
      User:
        metadata:
          label: name
        attributes:
          name: String required
`;
        const result = parser.parse(yamlContent);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept multiple label fields (array)', () => {
        const yamlContent = `
components:
  TestApp:
    version: "3.3.0"
    models:
      User:
        metadata:
          label:
            - firstName
            - lastName
        attributes:
          firstName: String required
          lastName: String required
`;
        const result = parser.parse(yamlContent);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('Audit Configuration', () => {
      it('should accept simple audit (boolean)', () => {
        const yamlContent = `
components:
  TestApp:
    version: "3.3.0"
    models:
      User:
        metadata:
          audit: true
        attributes:
          name: String required
`;
        const result = parser.parse(yamlContent);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept advanced audit with timestamps only', () => {
        const yamlContent = `
components:
  TestApp:
    version: "3.3.0"
    models:
      User:
        metadata:
          audit:
            timestamps: true
            users: false
        attributes:
          name: String required
`;
        const result = parser.parse(yamlContent);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept advanced audit with user tracking', () => {
        const yamlContent = `
components:
  TestApp:
    version: "3.3.0"
    models:
      User:
        metadata:
          audit:
            timestamps: true
            users: true
        attributes:
          name: String required
`;
        const result = parser.parse(yamlContent);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept custom audit field names', () => {
        const yamlContent = `
components:
  TestApp:
    version: "3.3.0"
    models:
      Order:
        metadata:
          audit:
            timestamps: true
            users: true
            timestampNames:
              created: orderDate
              updated: lastModified
            userNames:
              created: placedBy
              updated: modifiedBy
        attributes:
          total: Money required
`;
        const result = parser.parse(yamlContent);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('Soft Delete Configuration', () => {
      it('should accept simple soft delete (boolean)', () => {
        const yamlContent = `
components:
  TestApp:
    version: "3.3.0"
    models:
      User:
        metadata:
          softDelete: true
        attributes:
          name: String required
`;
        const result = parser.parse(yamlContent);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept advanced soft delete with custom field names', () => {
        const yamlContent = `
components:
  TestApp:
    version: "3.3.0"
    models:
      User:
        metadata:
          softDelete:
            enabled: true
            fieldNames:
              deletedAt: removedAt
              isDeleted: isRemoved
        attributes:
          name: String required
`;
        const result = parser.parse(yamlContent);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('Status Configuration', () => {
      it('should accept status from lifecycle (string)', () => {
        const yamlContent = `
components:
  TestApp:
    version: "3.3.0"
    models:
      Post:
        metadata:
          status: publishing
        lifecycles:
          publishing:
            flow: draft -> published
        attributes:
          title: String required
`;
        const result = parser.parse(yamlContent);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept explicit status values', () => {
        const yamlContent = `
components:
  TestApp:
    version: "3.3.0"
    models:
      User:
        metadata:
          status:
            field: accountStatus
            values:
              - active
              - suspended
              - deleted
        attributes:
          name: String required
`;
        const result = parser.parse(yamlContent);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept status with custom field name and lifecycle', () => {
        const yamlContent = `
components:
  TestApp:
    version: "3.3.0"
    models:
      Order:
        metadata:
          status:
            field: orderStatus
            lifecycle: fulfillment
        lifecycles:
          fulfillment:
            flow: pending -> shipped -> delivered
        attributes:
          total: Money required
`;
        const result = parser.parse(yamlContent);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('Version Configuration', () => {
      it('should accept simple version (boolean)', () => {
        const yamlContent = `
components:
  TestApp:
    version: "3.3.0"
    models:
      User:
        metadata:
          version: true
        attributes:
          name: String required
`;
        const result = parser.parse(yamlContent);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept advanced version with integer type', () => {
        const yamlContent = `
components:
  TestApp:
    version: "3.3.0"
    models:
      User:
        metadata:
          version:
            enabled: true
            field: revisionNumber
            type: integer
        attributes:
          name: String required
`;
        const result = parser.parse(yamlContent);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept advanced version with timestamp type', () => {
        const yamlContent = `
components:
  TestApp:
    version: "3.3.0"
    models:
      Document:
        metadata:
          version:
            enabled: true
            field: versionTimestamp
            type: timestamp
        attributes:
          content: Text required
`;
        const result = parser.parse(yamlContent);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('Combined Metadata', () => {
      it('should accept all metadata features together', () => {
        const yamlContent = `
components:
  TestApp:
    version: "3.3.0"
    models:
      User:
        metadata:
          id: uuid
          label: email
          audit: true
          softDelete: true
          version: true
        attributes:
          email: Email required unique
          name: String required
`;
        const result = parser.parse(yamlContent);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept complex combined metadata with custom names', () => {
        const yamlContent = `
components:
  TestApp:
    version: "3.3.0"
    models:
      Order:
        metadata:
          id:
            type: composite
            fields:
              - customerId
              - orderNumber
          label:
            - orderNumber
            - customerName
          audit:
            timestamps: true
            users: true
            timestampNames:
              created: orderDate
              updated: lastModified
          softDelete:
            enabled: true
            fieldNames:
              deletedAt: cancelledAt
              isDeleted: isCancelled
          status:
            field: orderStatus
            lifecycle: fulfillment
          version:
            enabled: true
            type: integer
        lifecycles:
          fulfillment:
            flow: pending -> processing -> shipped -> delivered
        attributes:
          orderNumber: String required
          customerName: String required
          total: Money required
`;
        const result = parser.parse(yamlContent);
        expect(result.errors).toHaveLength(0);
      });
    });
  });

  describe('Validate Operation', () => {
    describe('Simple Validation', () => {
      it('should accept validate as ExecutableProperties', () => {
        const yamlContent = `
components:
  TestApp:
    version: "3.3.0"
    models:
      User:
        attributes:
          name: String required
          email: Email required
    controllers:
      UserController:
        model: User
        cured:
          validate: {}
          create:
            parameters:
              name: String required
              email: Email required
`;
        const result = parser.parse(yamlContent);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept controller without validate', () => {
        const yamlContent = `
components:
  TestApp:
    version: "3.3.0"
    models:
      User:
        attributes:
          name: String required
    controllers:
      UserController:
        model: User
        cured:
          create:
            parameters:
              name: String required
`;
        const result = parser.parse(yamlContent);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('Validation with Multiple Operations', () => {
      it('should accept validate with multiple operations', () => {
        const yamlContent = `
components:
  TestApp:
    version: "3.3.0"
    models:
      User:
        attributes:
          name: String required
    controllers:
      UserController:
        model: User
        cured:
          validate: {}
          create:
            parameters:
              name: String required
          update:
            parameters:
              name: String
`;
        const result = parser.parse(yamlContent);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept validate with evolve operation', () => {
        const yamlContent = `
components:
  TestApp:
    version: "3.3.0"
    models:
      Post:
        attributes:
          title: String required
          content: Text required
    controllers:
      PostController:
        model: Post
        cured:
          validate: {}
          create:
            parameters:
              title: String required
              content: Text required
          evolve:
            parameters:
              status: String required
`;
        const result = parser.parse(yamlContent);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept validate with requires clauses', () => {
        const yamlContent = `
components:
  TestApp:
    version: "3.3.0"
    models:
      User:
        attributes:
          name: String required
          email: Email required
    controllers:
      UserController:
        model: User
        cured:
          validate: {}
          create:
            parameters:
              name: String required
              email: Email required
            requires:
              - "name length >= 3"
              - "email is valid"
`;
        const result = parser.parse(yamlContent);
        expect(result.errors).toHaveLength(0);
      });
    });
  });

  describe('Combined Metadata and Validate', () => {
    it('should accept models with metadata and controllers with validate', () => {
      const yamlContent = `
components:
  TestApp:
    version: "3.3.0"
    models:
      User:
        metadata:
          id: uuid
          label: email
          audit: true
          softDelete: true
        attributes:
          email: Email required unique
          name: String required
    controllers:
      UserController:
        model: User
        cured:
          validate: {}
          create:
            parameters:
              email: Email required
              name: String required
          update:
            parameters:
              name: String
`;
      const result = parser.parse(yamlContent);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept complex example with all features', () => {
      const yamlContent = `
components:
  BlogAPI:
    version: "3.3.0"
    models:
      User:
        metadata:
          id: uuid
          label: email
          audit:
            timestamps: true
            users: false
          softDelete: true
          version: true
        attributes:
          email: Email required unique
          username: String required unique
          firstName: String required
          lastName: String required

      Post:
        metadata:
          id: uuid
          label: title
          audit: true
          softDelete: true
          status: publishing
          version:
            enabled: true
            type: integer
        lifecycles:
          publishing:
            flow: draft -> published -> archived
        attributes:
          title: String required
          content: Text required
          excerpt: String

    controllers:
      UserController:
        model: User
        cured:
          validate: {}
          create:
            parameters:
              email: Email required
              username: String required
              firstName: String required
              lastName: String required
            requires:
              - "email is valid"
              - "username length > 3"
          update:
            parameters:
              firstName: String
              lastName: String

      PostController:
        model: Post
        cured:
          validate: {}
          create:
            parameters:
              title: String required
              content: Text required
              excerpt: String
            requires:
              - "title length > 5"
              - "content length > 100"
          update:
            parameters:
              title: String
              content: Text
          evolve:
            parameters:
              status: String required
`;
      const result = parser.parse(yamlContent);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Backward Compatibility', () => {
    it('should accept v3.2 specs without metadata or validate', () => {
      const yamlContent = `
components:
  TestApp:
    version: "3.2.0"
    models:
      User:
        attributes:
          id: UUID required unique
          name: String required
    controllers:
      UserController:
        model: User
        cured:
          create:
            parameters:
              name: String required
`;
      const result = parser.parse(yamlContent);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept v3.3 specs without metadata or validate (optional features)', () => {
      const yamlContent = `
components:
  TestApp:
    version: "3.3.0"
    models:
      User:
        attributes:
          id: UUID required unique
          name: String required
    controllers:
      UserController:
        model: User
        cured:
          create:
            parameters:
              name: String required
`;
      const result = parser.parse(yamlContent);
      expect(result.errors).toHaveLength(0);
    });
  });
});
