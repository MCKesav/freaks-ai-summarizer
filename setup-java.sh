#!/bin/bash

# Set JAVA_HOME for this project
export JAVA_HOME="$(pwd)/jvm"
export PATH="$JAVA_HOME/bin:$PATH"

echo "Java environment configured:"
echo "JAVA_HOME: $JAVA_HOME"
java -version