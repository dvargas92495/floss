terraform {
  backend "remote" {
    hostname = "app.terraform.io"
    organization = "VargasArts"
    workspaces {
      prefix = "floss"
    }
  }

  required_providers {
    github = {
      source = "integrations/github"
      version = "4.2.0"
    }
    aws = {
      source = "hashicorp/aws"
      version = "3.74.2"
    }
  }
}

variable "secret" {
    type = string
}

variable "github_token" {
    type = string
}

variable "github_client_id" {
    type = string
}

variable "github_client_secret" {
    type = string
}

variable "stripe_public" {
    type = string
}

variable "stripe_secret" {
    type = string
}

variable "twitter_bearer_token" {
    type = string
}

variable "twitter_consumer_key" {
    type = string
}

variable "twitter_consumer_secret" {
    type = string
}

variable "auth0_client_id" {
    type = string
}

variable "auth0_client_secret" {
    type = string
}

variable "roamjs_floss_token" {
    type = string
}

provider "aws" {
    region = "us-east-1"
}

module "aws-static-site" {
    source  = "dvargas92495/static-site/aws"
    version = "1.2.0"

    domain = "floss.davidvargas.me"
    secret = var.secret
    tags = {
        Application = "Floss"
    }
}

module "aws-serverless-backend" {
    source  = "dvargas92495/serverless-backend/aws"
    version = "1.4.1"

    api_name = "floss"
    domain = "davidvargas.me"
    paths = [
        "auth-user-metadata/get",
        "auth-user-metadata/put",
        "aws-check-domain/get",
        "checkout-session-completed/post",
        "contract/delete",
        "contract/get",
        "contract/post",
        "contract/put",
        "contracts/get",
        "contract-by-email/get",
        "issue/get",
        "project/get",
        "project-fund/delete",
        "project-fund/post",
        "projects/get",
        "github-auth/post",
        "name/put",
        "stripe-balance/get",
        "stripe-cancel/post",
        "stripe-invoice-paid/post",
        "stripe-is-subscribed/get",
        "stripe-products/get",
        "stripe-session/post",
        "stripe-setup-intent/post",
        "stripe-payment-attached/post",
        "stripe-payment-intent/post",
        "stripe-payment-method/delete",
        "stripe-payment-method/put",
        "stripe-payment-method/post",
        "stripe-payment-methods/get",
        "stripe-payment-succeeded/post",
        "stripe-setup-succeeded/post",
        "stripe-subscribe/post",
        "stripe-subscriptions/get",
        "stripe-user/put",
        "twitter-auth/post",
        "twitter-auto/post",
        "twitter-login/post"
    ]
    
    tags = {
        Application = "Floss"
    }
}

resource "aws_dynamodb_table" "basic-dynamodb-table" {
  name           = "FlossContracts"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "uuid"

  attribute {
    name = "uuid"
    type = "S"
  }

  attribute {
    name = "priority"
    type = "S"
  }

  attribute {
    name = "lifecycle"
    type = "S"
  }

  attribute {
    name = "stripe"
    type = "S"
  }

  attribute {
    name = "link"
    type = "S"
  }

  attribute {
    name = "createdBy"
    type = "S"
  }

  global_secondary_index {
    hash_key           = "link"
    name               = "link-index"
    non_key_attributes = []
    projection_type    = "ALL"
    read_capacity      = 0
    write_capacity     = 0
  }

  global_secondary_index {
    hash_key           = "lifecycle"
    name               = "lifecycle-priority-index"
    non_key_attributes = []
    projection_type    = "ALL"
    range_key          = "priority"
    read_capacity      = 0
    write_capacity     = 0
  }

  global_secondary_index {
    hash_key           = "stripe"
    name               = "stripe-index"
    non_key_attributes = []
    projection_type    = "ALL"
    read_capacity      = 0
    write_capacity     = 0
  }

  global_secondary_index {
    hash_key           = "createdBy"
    name               = "createdBy-lifecycle-index"
    non_key_attributes = []
    projection_type    = "ALL"
    range_key          = "lifecycle"
    read_capacity      = 0
    write_capacity     = 0
  }

  tags = {
    Application = "Floss"
  }
}

resource "aws_dynamodb_table" "projects" {
  name           = "FlossProjects"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "uuid"

  attribute {
    name = "uuid"
    type = "S"
  }

  attribute {
    name = "tenant"
    type = "S"
  }

  attribute {
    name = "link"
    type = "S"
  }

  attribute {
    name = "customer"
    type = "S"
  }

  global_secondary_index {
    hash_key           = "tenant"
    name               = "tenant-index"
    non_key_attributes = []
    projection_type    = "ALL"
    read_capacity      = 0
    write_capacity     = 0
  }

  global_secondary_index {
    hash_key           = "customer"
    name               = "customer-index"
    non_key_attributes = []
    projection_type    = "ALL"
    read_capacity      = 0
    write_capacity     = 0
  }

  global_secondary_index {
    hash_key           = "link"
    name               = "link-index"
    non_key_attributes = []
    projection_type    = "ALL"
    read_capacity      = 0
    write_capacity     = 0
  }
}

resource "aws_dynamodb_table" "user-table" {
  name           = "FlossUsers"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "uuid"

  attribute {
    name = "uuid"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  attribute {
    name = "client"
    type = "S"
  }

  global_secondary_index {
    hash_key           = "email"
    name               = "email-index"
    non_key_attributes = []
    projection_type    = "ALL"
    read_capacity      = 0
    write_capacity     = 0
  }

  global_secondary_index {
    hash_key           = "client"
    name               = "client-index"
    non_key_attributes = []
    projection_type    = "ALL"
    read_capacity      = 0
    write_capacity     = 0
  }

  tags = {
    Application = "Floss"
  }
}
resource "aws_ses_domain_identity" "domain" {
  domain = "floss.davidvargas.me"
}

resource "aws_ses_domain_dkim" "domain" {
  domain = aws_ses_domain_identity.domain.domain
}

resource "aws_ses_domain_mail_from" "domain" {
  domain           = aws_ses_domain_identity.domain.domain
  mail_from_domain = "noreply.${aws_ses_domain_identity.domain.domain}"
}

resource "aws_route53_record" "ses_verification_record" {
  zone_id = module.aws-static-site.route53_zone_id
  name    = "_amazonses.${aws_ses_domain_identity.domain.domain}"
  type    = "TXT"
  ttl     = "1800"
  records = [aws_ses_domain_identity.domain.verification_token]
}

resource "aws_route53_record" "dkim_record" {
  count   = 3
  zone_id = module.aws-static-site.route53_zone_id
  name    = "${element(aws_ses_domain_dkim.domain.dkim_tokens, count.index)}._domainkey.${aws_ses_domain_identity.domain.domain}"
  type    = "CNAME"
  ttl     = "1800"
  records = ["${element(aws_ses_domain_dkim.domain.dkim_tokens, count.index)}.dkim.amazonses.com"]
}

resource "aws_route53_record" "mail_from_txt_record" {
  zone_id = module.aws-static-site.route53_zone_id
  name    = "noreply.${aws_ses_domain_identity.domain.domain}"
  type    = "TXT"
  ttl     = "300"
  records = ["v=spf1 include:amazonses.com ~all"]
}

data "aws_iam_policy_document" "lambda_extra_policy" {
  statement {
    actions = [
      "route53domains:CheckDomainAvailability",
      "route53:ListHostedZones"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "lambda_extra_policy" {
  name = "floss-lambda-extra"
  policy = data.aws_iam_policy_document.lambda_extra_policy.json
}

resource "aws_iam_role_policy_attachment" "lambda_extra_attach" {
  role       = "floss-lambda-execution"
  policy_arn = aws_iam_policy.lambda_extra_policy.arn
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

resource "github_actions_secret" "github_client_id" {
  repository       = "floss"
  secret_name      = "OAUTH_CLIENT_ID"
  plaintext_value  = var.github_client_id
}

resource "github_actions_secret" "github_client_secret" {
  repository       = "floss"
  secret_name      = "OAUTH_CLIENT_SECRET"
  plaintext_value  = var.github_client_secret
}

resource "github_actions_secret" "stripe_public" {
  repository       = "floss"
  secret_name      = "STRIPE_PUBLIC_KEY"
  plaintext_value  = var.stripe_public
}

resource "github_actions_secret" "stripe_secret" {
  repository       = "floss"
  secret_name      = "STRIPE_SECRET_KEY"
  plaintext_value  = var.stripe_secret
}

resource "github_actions_secret" "twitter_bearer_token" {
  repository       = "floss"
  secret_name      = "TWITTER_BEARER_TOKEN"
  plaintext_value  = var.twitter_bearer_token
}

resource "github_actions_secret" "twitter_consumer_key" {
  repository       = "floss"
  secret_name      = "TWITTER_CONSUMER_KEY"
  plaintext_value  = var.twitter_consumer_key
}

resource "github_actions_secret" "twitter_consumer_secret" {
  repository       = "floss"
  secret_name      = "TWITTER_CONSUMER_SECRET"
  plaintext_value  = var.twitter_consumer_secret
}

resource "github_actions_secret" "auth0_client_id" {
  repository       = "floss"
  secret_name      = "AUTH0_CLIENT_ID"
  plaintext_value  = var.auth0_client_id
}

resource "github_actions_secret" "auth0_client_secret" {
  repository       = "floss"
  secret_name      = "AUTH0_CLIENT_SECRET"
  plaintext_value  = var.auth0_client_secret
}

resource "github_actions_secret" "roamjs_floss_token" {
  repository       = "floss"
  secret_name      = "ROAMJS_FLOSS_TOKEN"
  plaintext_value  = var.roamjs_floss_token
}
