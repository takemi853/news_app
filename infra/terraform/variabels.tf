variable "project" {
  type        = string
  description = "GCP プロジェクト ID"
}
variable "region" {
  type        = string
  default     = "us-central1"
  description = "GCP リージョン"
}

variable "gemini_model" {
   type        = string
   default     = "gemini-2.0-flash-001"
   description = "使用する Gemini モデル名"
}