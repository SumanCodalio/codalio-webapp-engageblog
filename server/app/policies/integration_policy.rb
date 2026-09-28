# frozen_string_literal: true

class IntegrationPolicy < Rhino::ResourcePolicy
  self.resource_slug = 'integrations'

  def permitted_attributes_for_show(user)
    return ['*'] if has_role?(user, 'admin')
    return ['id', 'name', 'category', 'description', 'connected'] if has_role?(user, 'content_manager') || has_role?(user, 'editor')
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
