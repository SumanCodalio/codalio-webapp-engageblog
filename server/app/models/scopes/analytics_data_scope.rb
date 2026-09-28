# frozen_string_literal: true

module Scopes
  class AnalyticsDataScope < Rhino::ResourceScope
    # Row-level filtering hook. No additional narrowing is required for this
    # resource; the policy permission matrix governs access.
    def apply(relation)
      relation
    end
  end
end
