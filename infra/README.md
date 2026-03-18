# OCI Infrastructure Deployment Guide

This guide explains how to deploy the Rezumerai background worker to Oracle Cloud Infrastructure (OCI) using Always Free resources.

> **Note for Root/Tenancy Owners**: You already have full administrative access. You do NOT need to create a compartment or IAM policies — use your tenancy OCID as the `compartment_ocid`.

## Architecture Overview

```
GitHub
│
▼
GitHub Actions (CI/CD)
│
├ Build worker Docker image (ARM64)
├ Push to GitHub Container Registry (GHCR)
└ Deploy to Oracle VM via SSH
    │
    ▼
    Oracle Cloud VM (Ampere A1)
    │
    ├ Docker Engine
    └ Worker Container
        │
        ├ bun run worker:all
        ├ pg-boss job processing
        └ PostgreSQL (external)
```

## Infrastructure Components

### OCI Resources (Terraform)

| Resource | Description |
|----------|-------------|
| VCN | Virtual Cloud Network (10.0.0.0/16) |
| Subnet | Public subnet with internet access |
| Internet Gateway | Outbound connectivity for Docker pulls |
| Route Table | Routes traffic to internet gateway |
| Security List | Allows SSH (port 22) inbound, all outbound |
| Compute Instance | VM.Standard.A1.Flex (1 OCPU, 6GB RAM, ARM64) |

### Compute Instance Specifications

- **Shape**: VM.Standard.A1.Flex (Ampere A1 ARM64)
- **OCPUs**: 1
- **Memory**: 6 GB
- **Architecture**: ARM64 (aarch64)
- **OS**: Ubuntu 24.04 LTS Minimal
- **Storage**: 50GB boot volume (Always Free eligible)
- **Network**: Public IP enabled

**Note**: The VM.Standard.A1.Flex shape is Always Free-eligible with up to 4 OCPUs and 24GB RAM. We use 1 OCPU and 6GB RAM for optimal worker performance.

## Prerequisites

### 1. Oracle Cloud Account

- Active OCI account with Always Free eligibility

> **Note for Root/Tenancy Owners**: You already have full administrative access. You do NOT need to create a compartment or IAM policies. Skip to step 2.

- Compartment created for resource organization (optional - root owners can use tenancy OCID)
- API signing key pair generated (required for all users)
- User policies configured for resource management (non-root users only)

### 2. Local Tools

```bash
# Required
terraform >= 1.6.0
bun >= 1.0.0
git

# Optional (for OCI CLI)
oci-cli
```

### 3. SSH Key Pair

Generate an SSH key pair for accessing the worker instance:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/rezumerai-worker -C "rezumerai-worker"
chmod 600 ~/.ssh/rezumerai-worker
```

## Setup Instructions

### Step 1: Configure OCI Authentication

1. **Generate API Signing Key** (if not already done):

```bash
mkdir -p ~/.oci
openssl genrsa -out ~/.oci/oci_api_key.pem 2048
chmod 600 ~/.oci/oci_api_key.pem
openssl rsa -pubout -in ~/.oci/oci_api_key.pem -out ~/.oci/oci_api_key_public.pem
```

2. **Upload Public Key to OCI**:
   - Go to OCI Console → Profile → API Keys
   - Add the public key from `~/.oci/oci_api_key_public.pem`
   - Note the fingerprint displayed

3. **Get OCIDs**:
   - Tenancy OCID: Console → Administration → Tenancy Details
   - User OCID: Console → Profile → User Details
   - Compartment OCID: Console → Identity → Compartments
     - **Root owners**: Use your tenancy OCID as the compartment OCID

4. **Get Availability Domain**:

```bash
# Using OCI CLI
oci iam availability-domain list --compartment-id <your-compartment-ocid>

# Or using Terraform
terraform init
terraform plan  # Will show available ADs in error/output
```

### Step 2: Configure Terraform Variables

1. Copy the example variables file:

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars
```

2. Edit `terraform.tfvars` with your values:

```hcl
tenancy_ocid     = "ocid1.tenancy.oc1.."
user_ocid        = "ocid1.user.oc1.."
fingerprint      = "xx:xx:xx:..."
private_key_path = "~/.oci/oci_api_key.pem"
compartment_ocid = "ocid1.compartment.oc1.."
region           = "us-ashburn-1"
availability_domain = "Uocm:US-ASHBURN-AD-1"
ssh_public_key       = "ssh-ed25519 AAAA... rezumerai-worker"  # paste full key content
ssh_private_key_path = "/Users/you/.ssh/rezumerai-worker"
database_url         = "postgresql://..."
openrouter_api_key   = "sk-or-..."
```

### Step 3: Deploy Infrastructure

```bash
cd infra

# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply the configuration
terraform apply
```

After successful deployment, note the outputs:
- `worker_public_ip` - The VM's public IP address
- `ssh_connection_command` - SSH command to connect

### Step 4: Configure GitHub Secrets

Add the following secrets to your GitHub repository:

| Secret Name | Description |
|-------------|-------------|
| `OCI_WORKER_HOST` | Public IP of the OCI VM |
| `OCI_SSH_PRIVATE_KEY` | SSH private key (full content of `~/.ssh/rezumerai-worker`) |
| `PROD_DATABASE_URL` | PostgreSQL connection string |
| `OPENROUTER_API_KEY` | OpenRouter API key |

To add the SSH key:

```bash
# Copy the private key content
cat ~/.ssh/rezumerai-worker | gh secret set OCI_SSH_PRIVATE_KEY
```

Or manually in GitHub: Settings → Secrets and variables → Actions

### Step 5: Trigger Deployment

Push to main or manually trigger the workflow:

```bash
# Push to trigger automatic deployment
git add .
git commit -m "Deploy worker to OCI"
git push origin main

# Or trigger manually in GitHub Actions → "Deploy Worker to OCI" → Run workflow
```

## Deployment Workflow

### GitHub Actions Process

1. **Checkout** - Clone repository
2. **Docker Setup** - Configure Buildx for multi-arch builds
3. **GHCR Login** - Authenticate with GitHub Container Registry
4. **Build** - Build Docker image for ARM64
5. **Push** - Push image to GHCR
6. **SSH Deploy** - Connect to OCI VM and:
   - Login to GHCR with `GITHUB_TOKEN`
   - Pull latest image
   - Stop existing container
   - Remove old container
   - Start new container with environment variables
7. **Verify** - Check container is running

### Container Deployment

The worker runs with:

```bash
docker run -d \
  --name rezumerai-worker \
  --restart unless-stopped \
  --env NODE_ENV=production \
  --env DATABASE_URL="..." \
  --env OPENROUTER_API_KEY="..." \
  ghcr.io/zomeru/rezumerai-worker:latest \
  bun run worker:all
```

## Management Commands

### SSH Access

```bash
ssh -i ~/.ssh/rezumerai-worker ubuntu@<worker-public-ip>
```

### Container Management

```bash
# View logs
docker logs rezumerai-worker --tail 50

# Follow logs
docker logs -f rezumerai-worker

# Restart container
docker restart rezumerai-worker

# Stop container
docker stop rezumerai-worker

# Start container
docker start rezumerai-worker

# View container status
docker ps -a --filter name=rezumerai-worker

# Access container shell
docker exec -it rezumerai-worker /bin/bash
```

### Manual Deployment

SSH into the VM and run:

```bash
cd /opt/rezumerai
./deploy.sh
```

### Health Check

```bash
cd /opt/rezumerai
./health-check.sh
```

## Monitoring

### View Worker Logs

```bash
# Real-time logs
docker logs -f rezumerai-worker

# Last 100 lines
docker logs --tail 100 rezumerai-worker

# With timestamps
docker logs -f --timestamps rezumerai-worker
```

### Check Resource Usage

```bash
# Container stats
docker stats rezumerai-worker

# System resources
htop

# Disk usage
df -h
```

## Troubleshooting

### Container Won't Start

1. Check logs:
```bash
docker logs rezumerai-worker
```

2. Verify environment variables:
```bash
docker inspect rezumerai-worker | grep -A 20 Env
```

3. Check database connectivity:
```bash
docker exec rezumerai-worker bun -e "console.log('DB check')"
```

### SSH Connection Fails

1. Verify security list allows port 22
2. Check instance has public IP
3. Verify SSH key permissions:
```bash
chmod 600 ~/.ssh/rezumerai-worker
```

### Deployment Fails

1. Check GitHub Actions logs
2. Verify SSH secret is correctly formatted (no extra newlines)
3. Test SSH manually:
```bash
ssh -i ~/.ssh/rezumerai-worker -v ubuntu@<ip>
```

### Image Pull Fails

1. Verify GHCR login in GitHub Actions
2. Check image exists:
```bash
docker pull ghcr.io/zomeru/rezumerai-worker:latest
```

## Cost Estimation

### Always Free Resources

| Resource | Always Free Limit | Usage | Cost |
|----------|------------------|-------|------|
| Ampere A1 Compute | 4 OCPUs, 24GB RAM | 1 OCPU, 6GB RAM | Free |
| Block Volume | 200GB total | ~50GB | Free |
| VCN | Free | 1 VCN | Free |
| Public IP | Free (ephemeral) | 1 IP | Free |
| Data Transfer | 10TB/month outbound | ~1GB | Free |

**Total Monthly Cost: $0.00** (within Always Free limits)

## Security Considerations

1. **SSH Key Security**
   - Use ed25519 keys (stronger, smaller)
   - Never commit private keys to Git
   - Store in GitHub Secrets encrypted

2. **Network Security**
   - Only SSH port (22) is open inbound
   - No inbound database access from internet
   - Outbound restricted to necessary ports

3. **Secrets Management**
   - Database URL via GitHub Secrets
   - API keys via GitHub Secrets
   - Never hardcode in Dockerfile or code

4. **Container Security**
   - Runs as non-root user
   - Minimal base image (bun:1-slim)
   - Regular security updates via base image

## Cleanup

To destroy all resources:

```bash
cd infra
terraform destroy
```

This will:
- Terminate the compute instance
- Delete the VCN and all networking resources
- Remove all tags and resources created by Terraform

**Warning**: This is irreversible. Backup any data first.

## Migration from AWS

This deployment replaces the AWS ECS/Fargate infrastructure:

| AWS Resource | OCI Equivalent |
|--------------|----------------|
| ECS Cluster | Docker on Compute |
| Fargate Task | Docker Container |
| ECR | GHCR |
| VPC | VCN |
| Subnet | Subnet |
| Security Group | Security List |
| Internet Gateway | Internet Gateway |
| ECS Service | docker run --restart |
| CodeDeploy | GitHub Actions SSH |

## Next Steps

1. Set up monitoring and alerting
2. Configure log aggregation
3. Implement backup strategies
4. Set up auto-scaling (if needed beyond Always Free)
5. Configure database connection pooling

## Support

For issues:
1. Check this documentation
2. Review GitHub Actions logs
3. Check container logs via SSH
4. Verify OCI Console resource status
5. Review Terraform state
