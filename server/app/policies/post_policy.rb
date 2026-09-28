# frozen_string_literal: true

class PostPolicy < Rhino::ResourcePolicy
  self.resource_slug = 'posts'

  # Extra 5: content_manager/editor may only update/destroy posts they authored;
  # admin may act on any post in the organization.
  def update?
    super && (has_role?(user, 'admin') || record.user_id == user.id)
  end

  def destroy?
    super && (has_role?(user, 'admin') || record.user_id == user.id)
  end

  def permitted_attributes_for_show(user)
    return ['*'] if has_role?(user, 'admin') || has_role?(user, 'content_manager') || has_role?(user, 'editor')
    return ['id', 'title', 'slug', 'category', 'status', 'read_time_minutes', 'view_count',
            'published_at', 'scheduled_at', 'created_at', 'updated_at', 'has_video'] if has_role?(user, 'contributor')

    []
  end

  def hidden_attributes_for_show(_user)
    []
  end

  def permitted_attributes_for_create(user)
    return ['*'] if has_role?(user, 'admin')
    return post_writable_fields if has_role?(user, 'content_manager') || has_role?(user, 'editor')

    []
  end

  def permitted_attributes_for_update(user)
    return ['*'] if has_role?(user, 'admin')
    return post_writable_fields if has_role?(user, 'content_manager') || has_role?(user, 'editor')

    []
  end

  private

  def post_writable_fields
    %w[title slug content category tags status read_time_minutes published_at scheduled_at]
  end
end
