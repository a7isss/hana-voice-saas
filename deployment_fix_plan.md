# Railway Deployment Fix Plan

## Issue Analysis
The deployment is failing because Railway's Nixpacks is trying to use `uv` command in the Docker build process, but `uv` is not available in the base image.

## Root Cause
- Railway auto-detects Python projects and tries to use `uv sync`
- The base Ubuntu image doesn't include `uv` by default
- Build fails with: `/bin/bash: line 1: uv: command not found`

## Solution Steps

### Option 1: Install uv in Nixpacks (Recommended)
- Create a `nixpacks.toml` configuration file
- Install uv during the Nixpacks setup phase
- Ensure uv is available during build

### Option 2: Disable uv Detection
- Force Railway to use pip/requirements.txt instead of uv
- Remove pyproject.toml or add nixpacks config to disable uv

### Option 3: Use requirements.txt Only
- Simplify to pure pip-based approach
- Remove any uv-specific build commands

## Implementation Plan
1. Create nixpacks.toml configuration
2. Add uv installation to Nixpacks setup
3. Test deployment
4. Verify both services start correctly
