# frozen_string_literal: true

class AnalyticsDataPolicy < Rhino::ResourcePolicy
  self.resource_slug = 'analytics_data'

  def permitted_attributes_for_show(user)
    return ['*'] if has_role?(user, 'admin') || has_role?(user, 'content_manager') || has_role?(user, 'editor')
    return ['id', 'post_id', 'event_type', 'recorded_at', 'created_at'] if has_role?(user, 'contributor')
    []
  end
def hidden_attributes_for_show(user)
  []
end
  def permitted_attributes_for_create(user)
    return ['*'] if has_role?(user, 'admin')
    return ['post_id', 'event_type', 'visitor_id', 'event_data', 'recorded_at'] if has_role?(user, 'content_manager') || has_role?(user, 'editor')
    []
  end
  def permitted_attributes_for_update(user)
    return ['*'] if has_role?(user, 'admin')
    []
  end
end
