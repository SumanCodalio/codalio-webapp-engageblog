# frozen_string_literal: true

class Post < Rhino::RhinoModel
  include Rhino::BelongsToOrganization
  include Discard::Model
  include Rhino::HasAuditTrail
  include AssignsCurrentUser

  belongs_to :user, class_name: 'User'
  has_many :videos, class_name: 'Video', dependent: :nullify
  has_many :analytics_data, class_name: 'AnalyticsData', dependent: :nullify

  rhino_filters :user_id, :title, :slug, :category, :status, :published_at, :scheduled_at
  rhino_sorts :user_id, :title, :slug, :category, :status, :read_time_minutes, :view_count,
              :published_at, :scheduled_at, :created_at
  rhino_default_sort '-created_at'
  rhino_fields :id, :organization_id, :user_id, :title, :slug, :content, :category, :tags,
               :status, :read_time_minutes, :view_count, :published_at, :scheduled_at, :created_at
  rhino_includes :user, :videos
  rhino_search :title, :content, :category
  rhino_pagination_enabled true
  rhino_per_page 25

  validates :title, presence: true, length: { maximum: 255 }
  validates :status, inclusion: { in: %w[draft published scheduled] }, allow_nil: true
  validates :read_time_minutes, numericality: { only_integer: true }, allow_nil: true
  validates :view_count, numericality: { only_integer: true }, allow_nil: true

  before_validation :generate_slug
  before_save :apply_publish_transition
  validate :scheduled_requires_scheduled_at

  # Extra 2: has_video is true when the post has at least one associated video.
  def has_video
    videos.any?
  end

  # Extra 2 + AC-11/AC-21: `has_video` is always emitted; the attached `videos`
  # collection is emitted only when it was eager-loaded via `?include=videos`.
  #
  # Rhino's `?include=` performs eager loading but does not itself nest the
  # relation in the response, so the post editor (`useModelShow('posts', id,
  # { includes: ['videos'] })`) and the dashboard (`useModelIndex('posts', {
  # includes: ['videos'] })`) would otherwise never see the attached media.
  # Emitting the collection only when loaded keeps the index payload slim for
  # requests that did not ask for it (no N+1), while `?include=videos` returns
  # the embedded assets the preview and the published page render.
  def rhino_computed_attributes
    videos_loaded = association(:videos).loaded?
    attributes = { 'has_video' => has_video }
    attributes['videos'] = videos.map(&:as_rhino_json) if videos_loaded
    attributes
  end

  private

  # Extra 4: derive a unique, org-scoped slug from the title when blank.
  def generate_slug
    return if slug.present?
    return if title.blank?

    base = title.to_s.parameterize
    return if base.blank?

    candidate = base
    suffix = 1
    scope = self.class.unscoped.where(organization_id: organization_id)
    scope = scope.where.not(id: id) if persisted?
    while scope.exists?(slug: candidate)
      suffix += 1
      candidate = "#{base}-#{suffix}"
    end
    self.slug = candidate
  end

  # Extra 3: publishing stamps published_at; scheduling requires scheduled_at.
  def apply_publish_transition
    if status == 'published' && published_at.blank?
      self.published_at = Time.current
    end
  end

  def scheduled_requires_scheduled_at
    return unless status == 'scheduled'
    return if scheduled_at.present?

    errors.add(:scheduled_at, "can't be blank when status is scheduled")
  end
end
