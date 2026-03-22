/**
 * Processor interfaces — shared between parser and entity modules.
 *
 * These types break the circular dependency between parser and entities.
 * Both packages import from @specverse/types instead of from each other.
 */
export class AbstractProcessor {
    context;
    constructor(context) {
        this.context = context;
    }
    addWarning(message) {
        this.context.addWarning(message);
    }
}
//# sourceMappingURL=processor.js.map