Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Custom (non-CRUD) tenant-scoped endpoints. Rhino's generated CRUD routes are
  # appended by the engine; these are the hand-written Extras.
  scope "api/:organization", defaults: { format: :json } do
    get "me", to: "api/me#show"
    get "analytics/summary", to: "api/analytics#summary"
    get "system/health", to: "api/system#health"
    post "system/restore", to: "api/system#restore"
    post "webhooks/:id/ping", to: "api/webhooks#ping"
  end

  # Defines the root path route ("/")
  # root "posts#index"
end
