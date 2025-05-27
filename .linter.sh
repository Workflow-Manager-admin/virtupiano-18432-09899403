#!/bin/bash
cd /home/kavia/workspace/code-generation/virtupiano-18432-09899403/virtu_piano
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

