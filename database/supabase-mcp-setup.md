# Supabase MCP Server Setup Guide

## Overview
This guide sets up the Supabase Model Context Protocol (MCP) server to allow Claude Code to directly interact with your Supabase database for schema management, debugging, and optimization.

## Prerequisites
- Node.js installed (version 16+ recommended)
- Supabase Personal Access Token
- Project Reference ID

## Configuration Files

### 1. MCP Configuration File
**Location:** `.claude-mcp-config.json` (already created)

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref=YOUR_PROJECT_REF"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "YOUR_ACCESS_TOKEN"
      }
    }
  }
}
```

### 2. Environment Variables
Add to your `.env` file if needed:

```bash
# Supabase MCP Configuration
SUPABASE_MCP_PROJECT_REF=YOUR_PROJECT_REF
SUPABASE_MCP_ACCESS_TOKEN=YOUR_ACCESS_TOKEN
```

## Setup Steps

### Step 1: Verify Prerequisites
```bash
# Check Node.js version
node -v

# Should return v16.0.0 or higher
```

### Step 2: Test MCP Server Connection
```bash
# Test the MCP server manually (optional)
npx -y @supabase/mcp-server-supabase@latest --project-ref=YOUR_PROJECT_REF --help
```

### Step 3: Configure Claude Code
1. Ensure `.claude-mcp-config.json` is in your project root
2. Restart Claude Code if it was already running
3. The MCP server should now be available for database operations

## Available Capabilities

With MCP server connected, Claude Code can:

### Database Schema Management
- ✅ View table structures and relationships
- ✅ Create and modify tables
- ✅ Manage indexes and constraints
- ✅ Handle RLS policies

### Query Operations
- ✅ Execute SELECT queries
- ✅ Run EXPLAIN plans for performance analysis
- ✅ View query statistics
- ✅ Analyze slow queries

### Development Operations
- ✅ Run schema migrations
- ✅ Create and test database functions
- ✅ Manage triggers and procedures
- ✅ Backup and restore operations

### Analytics and Monitoring
- ✅ Monitor database performance
- ✅ Analyze table sizes and usage
- ✅ View connection statistics
- ✅ Check RLS policy effectiveness

## Security Considerations

### Current Configuration
- **Project Scoped:** Limited to project `YOUR_PROJECT_REF`
- **Access Token:** Uses personal access token (full permissions)
- **Environment:** Development database

### Recommended Security Practices
1. **Development Only:** Never use with production data
2. **Token Rotation:** Rotate access tokens regularly
3. **Read-Only Mode:** Consider adding `--read-only` for safety
4. **Monitoring:** Monitor all MCP operations in Supabase logs

### Production Safety
For production environments, modify configuration to:
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=YOUR_PROJECT_REF"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "YOUR_ACCESS_TOKEN"
      }
    }
  }
}
```

## Troubleshooting

### Common Issues

#### 1. MCP Server Not Starting
```bash
# Check if npx can access the package
npx @supabase/mcp-server-supabase@latest --version

# Clear npm cache if needed
npm cache clean --force
```

#### 2. Authentication Errors
- Verify access token is valid in Supabase dashboard
- Check project reference ID matches your project
- Ensure token has sufficient permissions

#### 3. Connection Timeouts
- Check network connectivity
- Verify Supabase project is accessible
- Try reducing query complexity

### Debug Commands

```bash
# Test connection manually
npx -y @supabase/mcp-server-supabase@latest \
  --project-ref=YOUR_PROJECT_REF \
  --debug

# Check MCP server logs
# (Logs will appear in Claude Code console)
```

## Usage Examples

Once MCP is connected, you can ask Claude Code to:

```
"Show me the current database schema"
"Check for any RLS policy conflicts"
"Analyze the performance of the expenses table"
"Create an optimized index for user expense queries"
"Fix the user creation trigger issue"
```

## Next Steps

With MCP configured, Claude Code can now:
1. **Directly diagnose** the user creation issue
2. **Execute and test** schema fixes
3. **Apply performance optimizations** safely
4. **Monitor** database health in real-time

This eliminates the need for manual SQL execution and enables real-time database management through AI assistance.