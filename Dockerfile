# Use a lightweight Python image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies for Postgres and Chromium (for scraping)
RUN apt-get update && apt-get install -y \
    libpq-dev gcc chromium-driver \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy your project files
COPY . .

# Run the server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]