#!/bin/bash
cd /home/kavia/workspace/code-generation/enterprise-insights-dashboard-50449-50458/dashboard_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

