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
  source  = "github.com/dvargas92495/aws-static-site"

  domain = "floss.davidvargas.me"
  secret = var.secret
  tags = {
      Application = "Floss"
  }
}

module "aws-serverless-backend" {
    source = "github.com/dvargas92495/aws-serverless-backend"

    api_name = "floss"
    paths = []
    tags = {
        Application = "Floss"
    }
}

/*
https://github.com/dvargas92495/roam-js-extensions/issues/1

provider "github" {
    organization = "dvargas92495"
    individual = true
}

resource "github_actions_secret" "deploy_aws_access_key" {
  repository       = "floss"
  secret_name      = "DEPLOY_AWS_ACCESS_KEY"
  plaintext_value  = module.terraform-aws-s3-static-site.deploy-id
}

resource "github_actions_secret" "deploy_aws_access_secret" {
  repository       = "floss"
  secret_name      = "DEPLOY_AWS_ACCESS_SECRET"
  plaintext_value  = module.terraform-aws-s3-static-site.deploy-secret
}
*/
