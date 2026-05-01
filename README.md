# Ramu & Sahasra — Wedding Invitation

A modern Hindu wedding e-invite with RSVP system, built with React + Express + SQLite.

## Quick Start (Local)

```bash
# 1. Install dependencies
cd server && npm install
cd ../client && npm install

# 2. Configure environment
cp .env server/.env
# Edit server/.env with your settings

# 3. Start backend
cd server && npm run dev

# 4. Start frontend (separate terminal)
cd client && npm run dev

# 5. Open http://localhost:5173
```

## Production Build

```bash
# Build frontend into server/public/
cd client && npm run build

# Start production server
cd ../server && NODE_ENV=production npm start
# App served at http://localhost:3001
```

## Environment Variables (.env)

```env
PORT=3001
DB_PATH=./wedding.db
ADMIN_PASSWORD=your-secure-password
RSVP_DEADLINE=2026-05-06T23:59:59

# Email (optional — uses Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
ADMIN_EMAIL=notifications@yourdomain.com
```

## Features

- **Landing page** — Ganesha emblem, couple names, countdown timer, elegant gold/maroon theme
- **RSVP form** — Attend/decline toggle, guest count, validation, deadline enforcement
- **Admin panel** — `/admin` route, view/delete RSVPs, export CSV, manage settings & invites
- **Invite links** — Unique URLs with pre-filled guest info (`/?invite=<id>`)
- **Map** — OpenStreetMap embed with Get Directions link
- **Email** — Confirmation emails to guests + admin notifications
- **WhatsApp share** — One-tap sharing button in footer

## Deploy on Oracle Cloud VM (Ubuntu)

```bash
# 1. SSH into your VM
ssh ubuntu@your-vm-ip

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Clone and build
git clone <your-repo> wedding && cd wedding
cd client && npm install && npm run build
cd ../server && npm install

# 4. Configure
cp ../.env .env
nano .env  # set ADMIN_PASSWORD, email creds, etc.

# 5. Run with PM2
sudo npm install -g pm2
pm2 start index.js --name wedding
pm2 save && pm2 startup

# 6. Nginx reverse proxy
sudo apt install -y nginx
sudo tee /etc/nginx/sites-available/wedding << 'EOF'
server {
    listen 80;
    server_name yourdomain.com;
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF
sudo ln -s /etc/nginx/sites-available/wedding /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 7. HTTPS with Certbot
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Admin Panel

Visit `/admin` and enter your `ADMIN_PASSWORD` to:
- View all RSVPs in a table
- Export responses as CSV
- Create unique invite links
- Update event details, venue, and RSVP deadline
