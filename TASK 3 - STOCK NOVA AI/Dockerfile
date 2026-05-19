FROM python:3.10-slim

# Set the working directory
WORKDIR /app

# Create a user to run the app (Hugging Face Spaces requirement)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Change ownership of /app to the user
WORKDIR $HOME/app

# Copy requirement list first to cache dependencies
COPY --chown=user backend/requirements.txt $HOME/app/backend/requirements.txt

# Install dependencies
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy the rest of the application
COPY --chown=user . $HOME/app

# Expose the port Hugging Face Spaces uses
EXPOSE 7860

# Run gunicorn on port 7860 (running from backend folder so imports work)
WORKDIR $HOME/app/backend
CMD ["gunicorn", "-w", "2", "--timeout", "120", "-b", "0.0.0.0:7860", "server:app"]
