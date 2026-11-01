# The story robot (bot.py) with Chromium, to draw a story when Maite doesn't have its image yet
FROM mcr.microsoft.com/playwright/python:v1.48.0-jammy
WORKDIR /bot
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY bot.py .
# The Instagram session lives here, so a restart doesn't sign in again
VOLUME /bot/data
CMD ["python", "bot.py"]
