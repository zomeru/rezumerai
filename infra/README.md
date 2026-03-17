# Rezumerai Infrastructure

Terraform configuration for Rezumerai production infrastructure on AWS.

## Architecture

- **VPC**: Public and private subnets across 2 AZs
- **RDS**: PostgreSQL with pgvector extension
- **ECS Fargate**: Web and worker services (Docker-based)
- **ALB**: Application Load Balancer with HTTPS
- **Secrets Manager**: Centralized secret storage
- **ECR**: Elastic Container Registry for Docker images
- **CloudWatch**: Logging and monitoring

## Container Platform

This infrastructure uses **AWS ECS Fargate** for container-based deployment. This platform was chosen because:

- **Serverless**: No EC2 instances to manage
- **Autoscaling**: Built-in CPU/memory-based scaling
- **Rolling deployments**: Safe zero-downtime updates
- **Cost-effective**: Pay only for container resources used
- **AWS native**: Tight integration with other AWS services

## Prerequisites

- Terraform 1.6+
- Docker 20.x+ (for local builds)
- AWS account with appropriate permissions
- ACM certificate for HTTPS (us-east-1 recommended)
- GitHub OAuth credentials
- OpenRouter API key

## Docker Build

### Local Development

Build the Docker image locally:

```bash
# Build with environment variables
docker build \
  -f apps/web/Dockerfile \
  -t rezumerai-web:latest \
  --build-arg DATABASE_URL="postgresql://user:pass@host:5432/db" \
  --build-arg DIRECT_URL="postgresql://user:pass@host:5432/db" \
  --build-arg OPENROUTER_API_KEY="your-key" \
  --build-arg BETTER_AUTH_SECRET="your-secret" \
  --build-arg BETTER_AUTH_URL="https://your-domain.com" \
  --build-arg NEXT_PUBLIC_SITE_URL="https://your-domain.com" \
  --build-arg BETTER_AUTH_GITHUB_CLIENT_ID="your-client-id" \
  --build-arg BETTER_AUTH_GITHUB_CLIENT_SECRET="your-client-secret" \
  .
```

### Using Docker Compose

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your values
# Then build and start
docker compose up --build
```

## Terraform Configuration

### Required Variables

Create a `terraform.tfvars` file:

```hcl
aws_region         = "us-east-1"
environment         = "production"
project_name        = "rezumerai"
domain_name         = "yourdomain.com"
certificate_arn     = "arn:aws:acm:us-east-1:123456789:certificate/xxxxx"

# Secrets (use environment variables or tfvars)
better_auth_secret        = "your-better-auth-secret"
better_auth_url          = "https://yourdomain.com"
github_client_id         = "your-github-client-id"
github_client_secret      = "your-github-client-secret"
openrouter_api_key       = "your-openrouter-key"
```

### Deployment Steps

1. **Configure AWS credentials**
   ```bash
   aws configure
   # Or set environment variables
   export AWS_ACCESS_KEY_ID="your-key"
   export AWS_SECRET_ACCESS_KEY="your-secret"
   ```

2. **Initialize Terraform**
   ```bash
   cd infra
   terraform init
   ```

3. **Plan deployment**
   ```bash
   terraform plan -var-file=tfvars.production
   ```

4. **Apply infrastructure**
   ```bash
   terraform apply -var-file=tfvars.production
   ```

## CI/CD Pipeline

### GitHub Actions Workflow

The repository includes CI/CD workflows:

- **main.yml**: Runs on every PR/push to main
  - Linting, type checking, tests
  - **Docker build validation** (new)
  
- **deploy.yml**: Runs on push to main
  - Builds Docker image
  - Pushes to ECR
  - Triggers ECS deployment

### Docker Build in CI

The CI pipeline now validates Docker builds:

```yaml
docker-build:
  needs: check-test-build
  steps:
    - uses: docker/setup-buildx-action@v3
    - uses: docker/build-push-action@v5
      with:
        context: .
        file: ./apps/web/Dockerfile
        load: true
        # ... build args and cache configuration
```

## Environment Variables

### Build-time (Docker build args)

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Prisma client connection |
| `DIRECT_URL` | Yes | Prisma CLI connection |
| `OPENROUTER_API_KEY` | Yes | AI services |
| `BETTER_AUTH_SECRET` | Yes | Auth encryption |
| `BETTER_AUTH_URL` | Yes | Auth base URL |
| `NEXT_PUBLIC_SITE_URL` | Yes | Public site URL |
| `BETTER_AUTH_GITHUB_CLIENT_ID` | Yes | GitHub OAuth |
| `BETTER_AUTH_GITHUB_CLIENT_SECRET` | Yes | GitHub OAuth |

### Runtime (ECS Secrets)

| Variable | Source | Purpose |
|----------|--------|---------|
| `DATABASE_URL` | Secrets Manager | Database connection |
| `BETTER_AUTH_SECRET` | Secrets Manager | Auth encryption |
| `BETTER_AUTH_URL` | Secrets Manager | Auth base URL |
| `BETTER_AUTH_GITHUB_CLIENT_ID` | Secrets Manager | GitHub OAuth |
| `BETTER_AUTH_GITHUB_CLIENT_SECRET` | Secrets Manager | GitHub OAuth |
| `OPENROUTER_API_KEY` | Secrets Manager | AI services |

## ECS Services

### Web Service

- **Purpose**: Serves the Next.js application
- **Port**: 3000
- **Scaling**: 2-10 instances based on CPU
- **Health Check**: `/api/health`

### Worker Service

- **Purpose**: Background job processing
- **Command**: `bun run worker`
- **Scaling**: 1 instance

## Networking

```
Internet → ALB (443) → ECS Fargate (private subnet) → RDS (private subnet)
                                    ↓
                            Secrets Manager
```

- **Public Subnet**: ALB
- **Private Subnet**: ECS tasks, RDS
- **Database**: Not accessible from internet
- **Secrets**: Stored in AWS Secrets Manager

## Rollback Procedure

If deployment fails:

```bash
# Rollback to previous task definition
aws ecs update-service \
  --cluster rezumerai-production-cluster \
  --service rezumerai-production-web \
  --force-new-deployment

# Or restore previous image
aws ecs register-task-definition \
  --cli-input-json file://previous-task-def.json
```

## Monitoring

- **CloudWatch Logs**: `/ecs/rezumerai-production-*`
- **ECS Container Insights**: Enabled
- **ALB Access Logs**: S3 bucket

## Modules

- `vpc`: Networking infrastructure
- `rds`: PostgreSQL database with pgvector
- `ecs`: ECS cluster, services, and tasks
- `alb`: Application Load Balancer
- `secrets`: AWS Secrets Manager configuration

## Outputs

- `alb_dns_name`: DNS name of the load balancer
- `database_endpoint`: RDS endpoint
- `web_service_url`: Application URL
