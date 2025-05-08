# main.tf

# 1) 必要な API を有効化
resource "google_project_service" "enabled_apis" {
  for_each = toset([
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "aiplatform.googleapis.com",         # Vertex AI (Gemini) 用
    "cloudbuild.googleapis.com",
    "containerregistry.googleapis.com",
  ])
  service = each.key
}

# 2) Artifact Registry リポジトリ
resource "google_artifact_registry_repository" "backend_repo" {
  location      = var.region
  repository_id = "news-backend-repo"
  format        = "DOCKER"
  description   = "Docker repo for News App backend"
  depends_on    = [google_project_service.enabled_apis]
}

# 3) Cloud Run 用サービスアカウント
resource "google_service_account" "run_sa" {
  account_id   = "news-backend-run-sa"
  display_name = "Service Account for News App Cloud Run"
}

# 4) Cloud Run サービス
resource "google_cloud_run_service" "backend" {
  name     = "news-backend"
  location = var.region

  template {
    spec {
      service_account_name = google_service_account.run_sa.email

      containers {
        image = format(
            "%s-docker.pkg.dev/%s/%s/%s:latest",
            var.region,
            var.project,
            google_artifact_registry_repository.backend_repo.repository_id,
            "news-backend"
        )

        # Vertex AI (Gemini) に必要な環境変数だけ定義
        env {
          name  = "GOOGLE_CLOUD_PROJECT"
          value = var.project
        }
        env {
          name  = "GOOGLE_CLOUD_LOCATION"
          value = var.region
        }
        env {
          name  = "GEMINI_MODEL"
          value = var.gemini_model
        }
      }
    }
  }
  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [
    google_artifact_registry_repository.backend_repo,
    google_project_service.enabled_apis
  ]
}

# 5) Cloud Run を全員に呼び出せるよう公開
resource "google_cloud_run_service_iam_member" "public_invoker" {
  location = google_cloud_run_service.backend.location
  project  = var.project
  service  = google_cloud_run_service.backend.name
  role     = "roles/run.invoker"
  member   = "allUsers"

  depends_on = [google_cloud_run_service.backend]
}
