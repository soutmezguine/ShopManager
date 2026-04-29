# Deployment Guide

## Local Deployment

### System Requirements

- Windows 7+, macOS 10.12+, or Linux with Node.js v14+
- 50MB disk space minimum (200MB recommended)
- 512MB RAM minimum

### Installation

1. Extract the project files
2. Run `setup.bat` (Windows) or `./setup.sh` (Mac/Linux)
3. Start with `npm start`
4. Access at `http://localhost:3000`

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  shop-manager:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    environment:
      NODE_ENV: production
      PORT: 3000
    restart: unless-stopped
```

### Build and Run

```bash
docker build -t shop-manager .
docker run -p 3000:3000 -v $(pwd)/data:/app/data shop-manager
```

## Production Server Deployment

### Using PM2 (Process Manager)

1. **Install PM2**:
   ```bash
   npm install -g pm2
   ```

2. **Start Application**:
   ```bash
   pm2 start server.js --name "shop-manager"
   ```

3. **Enable Auto-restart**:
   ```bash
   pm2 startup
   pm2 save
   ```

4. **Monitor**:
   ```bash
   pm2 logs shop-manager
   pm2 monit
   ```

### Using Nginx as Reverse Proxy

```nginx
upstream shop_manager {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://shop_manager;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### SSL/TLS Setup (Let's Encrypt)

```bash
sudo certbot certonly --standalone -d yourdomain.com
```

### Nginx with SSL

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## AWS EC2 Deployment

### EC2 Instance Setup

1. **Launch Instance**:
   - Ubuntu 20.04 LTS
   - t2.small or larger
   - Open ports: 80, 443, 22

2. **SSH and Update**:
   ```bash
   ssh -i your-key.pem ubuntu@your-instance-ip
   sudo apt update && sudo apt upgrade -y
   ```

3. **Install Node.js**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

4. **Install and Configure**:
   ```bash
   cd /home/ubuntu
   git clone your-repo-url shop-manager
   cd shop-manager
   npm install
   npm install -g pm2
   pm2 start server.js
   pm2 startup
   pm2 save
   ```

5. **Install Nginx**:
   ```bash
   sudo apt install -y nginx
   sudo systemctl start nginx
   sudo systemctl enable nginx
   ```

## DigitalOcean Deployment

### Using DigitalOcean App Platform

1. Connect your GitHub repository
2. Select Node.js as runtime
3. Set environment variables
4. Deploy automatically

### Manual Droplet Setup

Similar to AWS EC2:
1. Create Ubuntu 20.04 Droplet
2. SSH and install Node.js
3. Clone repository
4. Run with PM2
5. Set up Nginx reverse proxy

## Heroku Deployment

### Procfile

```
web: npm start
```

### Deploy

```bash
heroku login
heroku create shop-manager
git push heroku main
heroku config:set SESSION_SECRET=your-secret
```

## Environment Variables

### Production Setup

```bash
export NODE_ENV=production
export PORT=3000
export SESSION_SECRET=your-very-secure-random-string-here
export DB_PATH=/var/lib/shopmanager/shopmanager.db
```

### .env File

```
NODE_ENV=production
PORT=3000
SESSION_SECRET=your-secure-key
DB_PATH=/var/lib/shopmanager/shopmanager.db
LOG_LEVEL=info
```

## Database Backup Strategy

### Automated Backup Script

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/shopmanager"
DB_PATH="/var/lib/shopmanager/shopmanager.db"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")

mkdir -p $BACKUP_DIR

cp $DB_PATH $BACKUP_DIR/shopmanager_$DATE.db

# Keep only last 30 days
find $BACKUP_DIR -name "*.db" -mtime +30 -delete
```

### Cron Job

```bash
# Daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

## Monitoring and Logging

### PM2 Monitoring

```bash
pm2 log
pm2 save
pm2 resurrect
```

### Log Rotation

```bash
sudo apt install -y logrotate
```

Create `/etc/logrotate.d/shop-manager`:

```
/app/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 node node
    sharedscripts
}
```

## Security Checklist

- [ ] Change SESSION_SECRET
- [ ] Enable HTTPS/SSL
- [ ] Set strong database password
- [ ] Keep Node.js updated
- [ ] Keep dependencies updated
- [ ] Configure firewall
- [ ] Enable automatic backups
- [ ] Set up monitoring
- [ ] Configure log rotation
- [ ] Regular security audits

## Update Instructions

### Updating Dependencies

```bash
npm update
npm audit fix
```

### Deploying Updates

1. Pull latest code
2. Run `npm install`
3. Test thoroughly
4. Run `pm2 restart shop-manager`

## Troubleshooting

### Application won't start
```bash
pm2 delete shop-manager
pm2 start server.js --name "shop-manager"
```

### Database locked
- Restart the application
- Check no other processes are accessing the database

### High memory usage
- Check for memory leaks
- Restart the application
- Monitor with `pm2 monit`

### SSL certificate expiry
```bash
sudo certbot renew --dry-run
sudo certbot renew
```

## Support and Monitoring

### Health Check Endpoint (Optional)

Add to `server.js`:
```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});
```

### Performance Monitoring

- Monitor CPU and memory usage
- Track response times
- Monitor error rates
- Check database performance
