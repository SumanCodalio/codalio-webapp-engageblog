# frozen_string_literal: true

class VideoPolicy < Rhino::ResourcePolicy
  self.resource_slug = 'videos'

  def permitted_attributes_for_show(user)
    return ['*'] if has_role?(user, 'admin') || has_role?(user, 'content_manager') || has_role?(user, 'editor')
    return ['id', 'title', 'description', 'url', 'media_type', 'format', 'file_size',
            'resolution', 'duration_seconds', 'status', 'post_id', 'created_at', 'updated_at',
            'duration'] if has_role?(user, 'contributor')

    []
  end

  def hidden_attributes_for_show(_user)
    []
  end

  def permitted_attributes_for_create(user)
    return ['*'] if has_role?(user, 'admin')
    return video_writable_fields if has_role?(user, 'content_manager') || has_role?(user, 'editor')

    []
  end

  def permitted_attributes_for_update(user)
    return ['*'] if has_role?(user, 'admin')
    return video_writable_fields if has_role?(user, 'content_manager') || has_role?(user, 'editor')

    []
  end

  private

  def video_writable_fields
    %w[title description url media_type format file_size resolution bitrate thumbnail_url
       duration_seconds status post_id]
  end
end
