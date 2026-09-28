# frozen_string_literal: true

class SystemReportPolicy < Rhino::ResourcePolicy
  self.resource_slug = 'system_reports'

  def permitted_attributes_for_show(user)
    return ['*'] if has_role?(user, 'admin')
    []
  end
def hidden_attributes_for_show(user)
  []
end
  def permitted_attributes_for_create(user)
    return ['*'] if has_role?(user, 'admin')
    []
  end
  def permitted_attributes_for_update(user)
    return ['*'] if has_role?(user, 'admin')
    []
  end
end
