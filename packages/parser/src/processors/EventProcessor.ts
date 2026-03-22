import { AbstractProcessor } from './AbstractProcessor.js';
import { AttributeProcessor } from './AttributeProcessor.js';
import { EventSpec, AttributeSpec } from '../types/ast.js';

export class EventProcessor extends AbstractProcessor<any, EventSpec[]> {
  private attributeProcessor: AttributeProcessor;

  constructor(context: any) {
    super(context);
    this.attributeProcessor = new AttributeProcessor(context);
  }

  process(eventsData: any): EventSpec[] {
    return Object.entries(eventsData).map(([eventName, eventDef]: [string, any]) => {
      const payload: AttributeSpec[] = [];
      
      // Process attributes (same as model attributes)
      if (eventDef.attributes) {
        for (const [attrName, attrDef] of Object.entries(eventDef.attributes)) {
          payload.push(this.attributeProcessor.process(attrName, attrDef));
        }
      }
      
      return {
        name: eventName,
        description: eventDef.description,
        version: eventDef.version, // NEW
        previousVersions: eventDef.previousVersions, // NEW
        payload
      };
    });
  }
}