# Docker Build Fix Documentation

## Issue Summary
The Docker build was failing with the following error:
```
OSError: Readme file does not exist: README.md
```

This occurred because the build process tried to install the package in editable mode (`uv pip install -e .`) but the `README.md` file wasn't being copied to the Docker context before the installation step.

## Root Cause
The original Dockerfile was using:
```dockerfile
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
```

However, the build environment was attempting to use `uv pip install --system --no-cache-dir -e .` which requires the package metadata files (including README.md) to be present during the build process.

## Fix Applied
Updated the Dockerfile to copy essential files in the correct order:

```dockerfile
# Copy dependency files first for better caching
COPY pyproject.toml uv.lock* ./
COPY README.md ./

# Install uv and dependencies using uv for better package management
RUN pip install uv && uv pip install --system --no-cache-dir -e .

# Copy remaining application code (if needed)
COPY app/ ./app/
COPY models/ ./models/
COPY tests/ ./tests/
```

## Key Changes
1. **Copy order**: README.md and pyproject.toml are now copied before dependency installation
2. **Build method**: Switched to uv package manager for consistent dependency management
3. **Editable installation**: The `-e .` flag allows the package to be installed in development/editable mode
4. **Granular copying**: Application code is copied after dependencies are installed

## Verification
The fix ensures that:
- README.md exists in the Docker context during build
- pyproject.toml and uv.lock are available for dependency resolution
- The build process follows modern Python packaging best practices
- Dependencies are cached properly for faster subsequent builds

## Next Steps
1. Test the Docker build in an environment with Docker available
2. Verify that the voice service starts correctly in the container
3. Ensure all Arabic voice processing models are accessible within the container
4. Update any CI/CD pipelines that build this Docker image

## Prevention
This type of error can be prevented by:
- Always copying package metadata files before installation steps
- Using consistent build methods across development and production environments
- Testing Docker builds in isolated environments before deployment
- Maintaining clear separation between dependency installation and code copying

---
*Fix applied on: 2025-11-20*
*Issue: Docker build failure due to missing README.md*
