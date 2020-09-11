terraform {
    backend "remote" {
        hostname = "app.terraform.io"
        organization = "VargasArts"
        workspaces {
            prefix = "floss"
        }
    }
}

variable "secret" {
    type = string
}

provider "aws" {
    region = "us-east-1"
}

module "aws-static-site" {
    source  = "dvargas92495/static-site/aws"
    version = "1.0.0"

    domain = "floss.davidvargas.me"
    secret = var.secret
    tags = {
        Application = "Floss"
    }
}

module "aws-serverless-backend" {
    source  = "dvargas92495/serverless-backend/aws"
    version = "1.1.0"

    api_name = "floss"
    paths = [
        "github-issues/get"
    ]
    tags = {
        Application = "Floss"
    }
}

provider "github" {
    owner = "dvargas92495"
    token = var.github_token
}

resource "github_actions_secret" "deploy_aws_access_key" {
  repository       = "floss"
  secret_name      = "DEPLOY_AWS_ACCESS_KEY_ID"
  plaintext_value  = module.aws-static-site.deploy-id
}

resource "github_actions_secret" "deploy_aws_access_secret" {
  repository       = "floss"
  secret_name      = "DEPLOY_AWS_SECRET_ACCESS_KEY"
  plaintext_value  = module.aws-static-site.deploy-secret
}

resource "github_actions_secret" "lambda_aws_access_key" {
  repository       = "floss"
  secret_name      = "LAMBDA_AWS_ACCESS_KEY_ID"
  plaintext_value  = module.aws-serverless-backend.access_key
}

resource "github_actions_secret" "lambda_aws_access_secret" {
  repository       = "floss"
  secret_name      = "LAMBDA_AWS_SECRET_ACCESS_KEY"
  plaintext_value  = module.aws-serverless-backend.secret_key
}

resource "github_actions_secret" "rest_api_id" {
  repository       = "floss"
  secret_name      = "REST_API_ID"
  plaintext_value  = module.aws-serverless-backend.rest_api_id
}

resource "github_actions_secret" "personal_access_token" {
  repository       = "floss"
  secret_name      = "PERSONAL_ACCESS_TOKEN"
  plaintext_value  = var.github_token
}
