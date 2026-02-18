# Workflow Monitoring System

## Overview

The workflow monitoring system automatically tracks and reports the status of all GitHub Actions workflows in this repository. It provides real-time notifications when workflows start, are in progress, or complete.

## How It Works

The monitoring system uses the `workflow_run` event to trigger when other workflows change state. It monitors:

- **Android Build** - Tracks Android app builds and deployments
- **iOS Build** - Monitors iOS build processes
- **Quality Checks** - Reports on lint, test, and type-check runs

## Event Types

The monitor tracks three workflow states:

1. **requested** - When a workflow is queued to run
2. **in_progress** - When a workflow starts executing
3. **completed** - When a workflow finishes (success, failure, cancelled, or skipped)

## Information Reported

For each workflow run, the monitor reports:

### Basic Information
- Workflow name
- Run ID and attempt number
- Direct link to the workflow run
- Branch and commit SHA
- User who triggered the workflow

### Timing (for completed workflows)
- Start time
- End time
- Total duration

### Status
- Current status (queued, in_progress, completed)
- Conclusion (success, failure, cancelled, skipped)
- Visual indicators (✅, ❌, 🚫, ⏭️)

### Artifacts (for successful workflows)
- Lists all artifacts produced by the workflow
- Shows artifact names and sizes
- Helpful for finding build outputs (APKs, logs, etc.)

## Viewing Reports

Reports are available in two places:

### 1. Workflow Run Logs
Each monitoring run outputs a formatted report in the console logs:
```
==========================================
WORKFLOW MONITORING REPORT
==========================================

📊 Event Type: completed
📝 Workflow: Android Build
🔗 Run URL: https://github.com/.../actions/runs/...
🔢 Run ID: 123456789
🔄 Attempt: 1
🌿 Branch: dev
📍 Commit: abc12345
👤 Triggered by: username
⏱️  Status: completed
✅ Conclusion: success

==========================================
```

### 2. GitHub Actions Summary
A formatted markdown summary appears in the workflow run's Summary tab with:
- Workflow overview
- Links to the monitored workflow
- Status indicators
- Completion messages

## Use Cases

### Development Workflow
Monitor build status during active development:
1. Push changes to a branch
2. Quality checks and builds trigger automatically
3. Monitor workflow provides instant feedback on each stage
4. Quickly identify and respond to failures

### CI/CD Pipeline
Track deployment progress:
1. Merge to dev branch triggers Android build
2. Monitor reports build start
3. Monitor reports build completion and artifact creation
4. Monitor reports promotion to main/master branch

### Debugging
When workflows fail:
1. Monitor provides direct links to failed runs
2. Shows which step(s) failed
3. Reports timing to identify performance issues
4. Lists available artifacts for debugging

## Configuration

### Adding New Workflows to Monitor

Edit `.github/workflows/workflow-monitor.yml` and update the `workflows` list:

```yaml
on:
  workflow_run:
    workflows: ["Android Build", "iOS Build", "Quality Checks", "Your New Workflow"]
    types:
      - requested
      - in_progress
      - completed
```

### Customizing Report Format

Modify the "Report Workflow Status" step to change:
- Report formatting
- Information displayed
- Emoji indicators
- Summary content

### Notification Integration

To add external notifications (Slack, Discord, email), add additional steps after the monitoring steps:

```yaml
- name: Send Slack Notification
  if: github.event.action == 'completed'
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "workflow": "${{ github.event.workflow_run.name }}",
        "status": "${{ github.event.workflow_run.conclusion }}"
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Permissions

The monitoring workflow requires minimal permissions:
- `actions: read` - To query workflow run details and artifacts
- `contents: read` - To access repository information

## Troubleshooting

### Monitor Not Triggering

1. Verify the monitored workflow name matches exactly
2. Check that the workflow is enabled in repository settings
3. Ensure the monitor workflow has proper permissions

### Missing Information

1. Some fields may be null for certain event types
2. Artifacts are only available for completed, successful workflows
3. Timing calculations require valid timestamps

### GitHub CLI Issues

The artifact checking step requires GitHub CLI (`gh`). If unavailable:
- The step will skip gracefully
- Other monitoring features continue to work
- Consider using GitHub API directly as an alternative

## Best Practices

1. **Keep monitor lightweight** - Avoid heavy processing in monitoring jobs
2. **Use conditional steps** - Only run expensive operations when needed
3. **Add summaries** - Use `$GITHUB_STEP_SUMMARY` for readable reports
4. **Filter events** - Monitor only events you care about
5. **Preserve logs** - Don't delete workflow runs too quickly

## Future Enhancements

Potential improvements to consider:

- Integration with external notification services
- Custom dashboards for workflow status
- Historical trend analysis
- Performance metrics tracking
- Automated issue creation for failures
- Cost tracking for workflow runs
- Custom alerting rules based on patterns
