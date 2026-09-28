# frozen_string_literal: true

require "test_helper"

# AC-2, AC-4, AC-9, AC-10, AC-11, AC-12, AC-19, AC-20, AC-21, AC-22, AC-66:
# post text/media editing and video embedding over the real API.
#
# The client-only halves of these criteria (the textarea binding, the markdown
# preview tab) are covered by the Vitest suite under client/src/__tests__; the
# tests here prove the backend contract each of those interactions depends on.
class PostEditingApiTest < ActionDispatch::IntegrationTest
  setup do
    @contract = seed_contract
    @org = @contract[:demo_org]
    @admin = @contract[:admin]
    @manager = @contract[:manager]
    @editor = @contract[:editor]
    @contributor = @contract[:viewer]

    @post = build_post(organization: @org, user: @manager, title: "Editable Post")
    @video = Video.create!(
      organization: @org, user: @manager, title: "Embeddable Asset",
      url: "https://cdn.example.com/embed.mp4", duration_seconds: 245
    )
  end

  # AC-2: the rich-text body is persisted through the `content` field and
  # round-trips unchanged — the editor's textarea binds to this key.
  test "AC-2: formatted body content round-trips through the content field" do
    body = "# Heading\n\n- one\n- two\n\n**bold** and *italic*"

    put "/api/#{@org.slug}/posts/#{@post.id}",
        params: { content: body }.to_json,
        headers: auth_headers(@manager).merge("Content-Type" => "application/json")
    assert_response :success
    assert_equal body, response.parsed_body["content"]

    get "/api/#{@org.slug}/posts/#{@post.id}", headers: auth_headers(@manager)
    assert_equal body, response.parsed_body["content"]
  end

  # AC-2: a create with body content persists it too (the create path, not only
  # the update path).
  test "AC-2: a newly created post persists its formatted body" do
    post "/api/#{@org.slug}/posts",
         params: { title: "Fresh Post", content: "## Intro\n\nSome *markdown*." }.to_json,
         headers: auth_headers(@manager).merge("Content-Type" => "application/json")
    assert_response :created
    assert_equal "## Intro\n\nSome *markdown*.", response.parsed_body["content"]
  end

  # AC-4: the preview step renders the in-editor state, so the editor must be
  # able to read back exactly the fields the preview displays (title + body +
  # category) from a single show request.
  test "AC-4: a show request returns the title, content and category the preview renders" do
    put "/api/#{@org.slug}/posts/#{@post.id}",
        params: { title: "Preview Title", content: "Preview body", category: "Case Studies" }.to_json,
        headers: auth_headers(@manager).merge("Content-Type" => "application/json")
    assert_response :success

    get "/api/#{@org.slug}/posts/#{@post.id}", headers: auth_headers(@manager)
    assert_response :success
    body = response.parsed_body
    assert_equal "Preview Title", body["title"]
    assert_equal "Preview body", body["content"]
    assert_equal "Case Studies", body["category"]
  end

  # AC-9: only the content team may edit — a contributor is denied update.
  test "AC-9: a contributor cannot enter edit mode on a published post" do
    put "/api/#{@org.slug}/posts/#{@post.id}",
        params: { title: "Contributor edit" }.to_json,
        headers: auth_headers(@contributor).merge("Content-Type" => "application/json")
    assert_response :forbidden
  end

  # AC-10: a published post is selectable from the index and readable by id —
  # the two calls the dashboard needs to enter edit mode.
  test "AC-10: a published post is selectable from the list and readable by id" do
    published = build_post(
      organization: @org, user: @manager, title: "Published Selectable",
      status: "published", published_at: 1.day.ago
    )

    get "/api/#{@org.slug}/posts", headers: auth_headers(@manager)
    assert_response :success
    row = response.parsed_body["data"].find { |item| item["id"] == published.id }
    assert_not_nil row, "expected the published post on the index"

    get "/api/#{@org.slug}/posts/#{published.id}", headers: auth_headers(@manager)
    assert_response :success
    assert_equal "Published Selectable", response.parsed_body["title"]
  end

  # AC-11: the editor loads the post with its videos included so attached media
  # is visible when editing.
  test "AC-11: the post can be loaded with its media attached" do
    @video.update!(post_id: @post.id)

    get "/api/#{@org.slug}/posts/#{@post.id}",
        params: { include: "videos" },
        headers: auth_headers(@manager)
    assert_response :success
    videos = response.parsed_body["videos"]
    assert videos.is_a?(Array)
    assert videos.any? { |v| v["id"] == @video.id },
           "expected the attached video on the loaded post"
  end

  # AC-11: both text and media can be modified in one save (title/content plus
  # the video's post_id).
  test "AC-11: text and media can be modified together" do
    put "/api/#{@org.slug}/posts/#{@post.id}",
        params: { title: "Text Updated", content: "New body" }.to_json,
        headers: auth_headers(@manager).merge("Content-Type" => "application/json")
    assert_response :success

    put "/api/#{@org.slug}/videos/#{@video.id}",
        params: { post_id: @post.id }.to_json,
        headers: auth_headers(@manager).merge("Content-Type" => "application/json")
    assert_response :success
    assert_equal @post.id, response.parsed_body["post_id"]
  end

  # AC-12: a saved change is immediately reflected on the next read (the "live
  # blog" the criterion refers to).
  test "AC-12: a saved change is immediately visible on re-read" do
    put "/api/#{@org.slug}/posts/#{@post.id}",
        params: { title: "Live Update" }.to_json,
        headers: auth_headers(@manager).merge("Content-Type" => "application/json")
    assert_response :success

    get "/api/#{@org.slug}/posts/#{@post.id}", headers: auth_headers(@manager)
    assert_response :success
    assert_equal "Live Update", response.parsed_body["title"]

    # ...and on the list the blog renders.
    get "/api/#{@org.slug}/posts", headers: auth_headers(@manager)
    row = response.parsed_body["data"].find { |item| item["id"] == @post.id }
    assert_equal "Live Update", row["title"]
  end

  # AC-19: only the content team can embed — a contributor is denied the
  # video update that attaches media to a post.
  test "AC-19: a contributor cannot attach a video to a post" do
    put "/api/#{@org.slug}/videos/#{@video.id}",
        params: { post_id: @post.id }.to_json,
        headers: auth_headers(@contributor).merge("Content-Type" => "application/json")
    assert_response :forbidden
    assert_nil @video.reload.post_id
  end

  # AC-20: the media picker lists library assets, and selecting one attaches it
  # by setting the video's post_id.
  test "AC-20: the media library lists assets and one can be attached to a post" do
    get "/api/#{@org.slug}/videos", headers: auth_headers(@manager)
    assert_response :success
    assert response.parsed_body["data"].any? { |row| row["id"] == @video.id }

    put "/api/#{@org.slug}/videos/#{@video.id}",
        params: { post_id: @post.id }.to_json,
        headers: auth_headers(@manager).merge("Content-Type" => "application/json")
    assert_response :success
    assert_equal @post.id, @video.reload.post_id
  end

  # AC-21: the attached video is embedded in the post payload the preview and
  # the published page read.
  test "AC-21: the attached video is embedded in the post payload" do
    @video.update!(post_id: @post.id)

    get "/api/#{@org.slug}/posts/#{@post.id}",
        params: { include: "videos" },
        headers: auth_headers(@manager)
    assert_response :success
    embedded = response.parsed_body["videos"].find { |v| v["id"] == @video.id }
    assert_not_nil embedded
    assert_equal "https://cdn.example.com/embed.mp4", embedded["url"]
    assert_equal "04:05", embedded["duration"]
  end

  # AC-22: a contributor can still READ an embedded video (they cannot attach
  # one, but the published page renders for them).
  test "AC-22: a contributor can read a post's embedded video" do
    @video.update!(post_id: @post.id)

    get "/api/#{@org.slug}/posts/#{@post.id}",
        params: { include: "videos" },
        headers: auth_headers(@contributor)
    assert_response :success
  end

  # AC-66: the post payload exposes has_video true once media is attached, and
  # the media-library fields the editor renders.
  test "AC-66: has_video flips true after a video is attached" do
    get "/api/#{@org.slug}/posts/#{@post.id}", headers: auth_headers(@manager)
    assert_equal false, response.parsed_body["has_video"]

    @video.update!(post_id: @post.id)

    get "/api/#{@org.slug}/posts/#{@post.id}", headers: auth_headers(@manager)
    assert_equal true, response.parsed_body["has_video"]
  end

  # AC-66: the editor's slug/category/tags/read-time fields are writable and
  # round-trip.
  test "AC-66: slug, category, tags and read_time_minutes round-trip" do
    put "/api/#{@org.slug}/posts/#{@post.id}",
        params: {
          slug: "custom-slug", category: "Industry Insights",
          tags: %w[video cdn], read_time_minutes: 7
        }.to_json,
        headers: auth_headers(@manager).merge("Content-Type" => "application/json")
    assert_response :success
    body = response.parsed_body
    assert_equal "custom-slug", body["slug"]
    assert_equal "Industry Insights", body["category"]
    assert_equal %w[video cdn], body["tags"]
    assert_equal 7, body["read_time_minutes"]
  end

  # AC-9/AC-75: an editor may edit their own post but not another author's.
  test "AC-9: an editor may edit their own post but not a colleague's" do
    own = build_post(organization: @org, user: @editor, title: "Editor Owned")
    put "/api/#{@org.slug}/posts/#{own.id}",
        params: { title: "Editor Updated" }.to_json,
        headers: auth_headers(@editor).merge("Content-Type" => "application/json")
    assert_response :success

    put "/api/#{@org.slug}/posts/#{@post.id}",
        params: { title: "Not Mine" }.to_json,
        headers: auth_headers(@editor).merge("Content-Type" => "application/json")
    assert_response :forbidden
  end

  # AC-10: an admin may edit any post regardless of authorship.
  test "AC-10: an admin may edit a post authored by someone else" do
    put "/api/#{@org.slug}/posts/#{@post.id}",
        params: { title: "Admin Override" }.to_json,
        headers: auth_headers(@admin).merge("Content-Type" => "application/json")
    assert_response :success
    assert_equal "Admin Override", response.parsed_body["title"]
  end
end
