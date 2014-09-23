#!/bin/bash

SOURCE_DIR=.

sources=(events.js handlers.js tests.js)

rm index.js

for var in "${sources[@]}"
do
    cat $SOURCE_DIR/${var} >> index.js
done
