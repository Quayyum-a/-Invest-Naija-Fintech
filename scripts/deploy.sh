#!/bin/bash

# InvestNaija Production Deployment Script
set -e

echo "🚀 Starting InvestNaija deployment..."

# Configuration
REPO_URL=${REPO_URL:-"https://github.com/your-username/investnaija.git"}
DEPLOY_DIR=${DEPLOY_DIR:-"/opt/investnaija"}
SERVICE_NAME="investnaija"
BACKUP_DIR="/opt/backups/investnaija"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    print_error "This script should not be run as root for security reasons"
    exit 1
fi

# Check required dependencies
check_dependencies() {
    print_status "Checking dependencies..."
    
    commands=("node" "npm" "git" "docker" "docker-compose")
    for cmd in "${commands[@]}"; do
        if ! command -v $cmd &> /dev/null; then
            print_error "$cmd is required but not installed"
            exit 1
        fi
    done
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $NODE_VERSION -lt 18 ]]; then
        print_error "Node.js 18 or higher is required (current: $NODE_VERSION)"
        exit 1
    fi
    
    print_success "All dependencies are available"
}

# Create backup of current deployment
create_backup() {
    if [[ -d $DEPLOY_DIR ]]; then
        print_status "Creating backup..."
        
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        BACKUP_PATH="$BACKUP_DIR/$TIMESTAMP"
        
        mkdir -p $BACKUP_DIR
        cp -r $DEPLOY_DIR $BACKUP_PATH
        
        print_success "Backup created at $BACKUP_PATH"
        
        # Keep only last 5 backups
        cd $BACKUP_DIR
        ls -t | tail -n +6 | xargs -r rm -rf
    fi
}

# Clone or update repository
update_code() {
    print_status "Updating application code..."
    
    if [[ -d $DEPLOY_DIR ]]; then
        cd $DEPLOY_DIR
        git fetch origin
        git reset --hard origin/main
    else
        git clone $REPO_URL $DEPLOY_DIR
        cd $DEPLOY_DIR
    fi
    
    print_success "Code updated successfully"
}

# Install dependencies and build
build_application() {
    print_status "Installing dependencies..."
    cd $DEPLOY_DIR
    
    # Install dependencies
    npm ci --only=production
    
    print_status "Building application..."
    npm run build
    
    print_success "Application built successfully"
}

# Setup environment
setup_environment() {
    print_status "Setting up environment..."
    cd $DEPLOY_DIR
    
    if [[ ! -f .env ]]; then
        print_warning ".env file not found. Creating from template..."
        cp .env.example .env
        print_warning "Please update .env file with your production values"
        print_warning "Especially change JWT_SECRET and ENCRYPTION_KEY"
    fi
    
    # Check critical environment variables
    if grep -q "development-jwt-secret" .env; then
        print_error "Please update JWT_SECRET in .env file"
        exit 1
    fi
    
    if grep -q "development-encryption-key" .env; then
        print_error "Please update ENCRYPTION_KEY in .env file"
        exit 1
    fi
    
    print_success "Environment configuration verified"
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    # Start PostgreSQL and Redis with Docker Compose
    docker-compose up -d postgres redis
    
    # Wait for database to be ready
    print_status "Waiting for database to be ready..."
    sleep 10
    
    # Run database migrations (if you have them)
    # npm run db:migrate
    
    print_success "Database setup completed"
}

# Deploy application
deploy_app() {
    print_status "Deploying application..."
    
    # Stop existing service
    docker-compose down app || true
    
    # Build and start new version
    docker-compose build app
    docker-compose up -d
    
    # Wait for application to start
    print_status "Waiting for application to start..."
    sleep 15
    
    # Health check
    if curl -f http://localhost:8080/api/ping &> /dev/null; then
        print_success "Application is running and healthy"
    else
        print_error "Application health check failed"
        docker-compose logs app
        exit 1
    fi
}

# Setup systemd service (alternative to Docker)
setup_systemd() {
    if [[ "$1" == "--systemd" ]]; then
        print_status "Setting up systemd service..."
        
        sudo tee /etc/systemd/system/$SERVICE_NAME.service > /dev/null <<EOF
[Unit]
Description=InvestNaija Fintech Application
After=network.target

[Service]
Type=simple
User=investnaija
WorkingDirectory=$DEPLOY_DIR
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
        
        sudo systemctl daemon-reload
        sudo systemctl enable $SERVICE_NAME
        sudo systemctl restart $SERVICE_NAME
        
        print_success "Systemd service configured"
    fi
}

# Setup SSL certificate (Let's Encrypt)
setup_ssl() {
    if [[ "$1" == "--ssl" ]]; then
        print_status "Setting up SSL certificate..."
        
        # Install certbot if not present
        if ! command -v certbot &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y certbot python3-certbot-nginx
        fi
        
        # Generate certificate (replace with your domain)
        DOMAIN=${2:-"investnaija.com"}
        sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN
        
        print_success "SSL certificate configured for $DOMAIN"
    fi
}

# Main deployment function
main() {
    print_status "🇳🇬 InvestNaija Production Deployment Starting..."
    print_status "================================================"
    
    check_dependencies
    create_backup
    update_code
    build_application
    setup_environment
    setup_database
    deploy_app
    
    # Optional features
    setup_systemd $1 $2
    setup_ssl $1 $2
    
    print_success "🎉 Deployment completed successfully!"
    print_status "================================================"
    print_status "Application is running at: http://localhost:8080"
    print_status "Health check: http://localhost:8080/api/ping"
    print_status "Admin panel: http://localhost:8080/admin"
    print_status ""
    print_warning "Next steps:"
    print_warning "1. Update your DNS to point to this server"
    print_warning "2. Configure your payment providers (Paystack)"
    print_warning "3. Set up KYC verification (VerifyMe/Smile Identity)"
    print_warning "4. Configure email/SMS services"
    print_warning "5. Set up monitoring and backups"
    print_status ""
    print_status "For support: https://github.com/investnaija/support"
}

# Run main function with all arguments
main "$@"
