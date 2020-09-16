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

variable "github_token" {
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
    version = "1.2.1"

    api_name = "floss"
    paths = [
        "contract/get",
        "contract/post",
        "contracts/get",
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
    name = "reward"
    type = "N"
  }

  attribute {
    name = "lifecycle"
    type = "S"
  }

  global_secondary_index {
    hash_key           = "reward"
    name               = "reward-lifecycle-index"
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

data "aws_iam_role" "lambda_role" {
  name = "floss-lambda-execution"
}

resource "aws_lambda_function" "github_issue_query" {
  function_name    = "floss_github-issue-query"
  role             = data.aws_iam_role.lambda_role.arn
  handler          = "floss_github-issue-query.handler"
  runtime          = "nodejs12.x"
  filename         = "dummy.zip"
  publish          = false

  tags = {
    Application = "Floss"
  }
}
 
resource "aws_cloudwatch_event_rule" "trigger_query" {
  name        = "FlossGithubIssueQuery"
  description = "Triggers every day at midnight, querying issues from active contracts"
  schedule_expression = "cron(0 0 * * ? *)"
}

resource "aws_lambda_permission" "allow_query" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.github_issue_query.arn
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.trigger_query.arn
}

resource "aws_cloudwatch_event_target" "trigger_scheduler" {
  rule      = aws_cloudwatch_event_rule.trigger_query.name
  arn       = aws_lambda_function.github_issue_query.arn
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
