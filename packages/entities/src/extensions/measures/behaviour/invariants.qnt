// Measures Entity — Invariants
// Formal properties for analytics measure specifications.

module measureInvariants {

  import specverseTypes.* from "../../../_shared/behaviour/types"

  // ─── State ─────────────────────────────────────────────────────────

  var models: Set[Model]
  var measures: Set[Measure]

  // ─── Structural Invariants ─────────────────────────────────────────

  /// Every measure must have a name.
  val measuresHaveNames: bool =
    measures.forall(m => m.name != "")

  /// Measure names must be unique.
  val measureNamesUnique: bool =
    measures.forall(m1 => measures.forall(m2 =>
      (m1 != m2) implies (m1.name != m2.name)))

  /// Every measure must reference a source model that exists.
  val measuresReferenceValidModel: bool =
    measures.forall(m =>
      models.exists(model => model.name == m.sourceModel))

  /// Every measure must have at least one metric.
  val measuresHaveMetrics: bool =
    measures.forall(m => m.metrics.size() > 0)

  // ─── Aggregation Invariants ────────────────────────────────────────

  /// Aggregation functions must be valid.
  val validAggregationFunctions: bool =
    measures.forall(m =>
      m.metrics.forall(metric =>
        Set("sum", "count", "avg", "min", "max", "count_distinct",
            "percentile", "median", "stddev", "variance")
          .contains(metric.aggregation)))

  /// Aggregated fields must exist on the source model.
  val aggregatedFieldsExist: bool =
    measures.forall(m =>
      m.metrics.forall(metric =>
        metric.aggregation == "count" or
        models.filter(model => model.name == m.sourceModel)
          .forall(model =>
            model.attributes.keys().contains(metric.field))))

  // ─── KPI Invariants ────────────────────────────────────────────────

  /// KPIs that reference other measures must reference existing ones.
  val kpiMeasureRefsValid: bool =
    measures.forall(m =>
      m.kpis.forall(kpi =>
        kpi.derivedFrom.forall(ref =>
          measures.exists(m2 => m2.name == ref) or
          m.metrics.exists(metric => metric.name == ref))))

}
