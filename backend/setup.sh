#!/bin/bash

# Modules
for module in auth teacher community post engagement membership notification admin file shared
do
nest g module $module
done

# Controllers
for module in auth teacher community post engagement membership notification admin file
do
nest g controller $module --no-spec
done

# Services
for module in auth teacher community post engagement membership notification admin file
do
nest g service $module --no-spec
done

# DTO folders
mkdir -p src/{auth,teacher,community,post,engagement,membership,notification,admin,file}/dto

# Feature folders
mkdir -p src/community/features
mkdir -p src/post/features
mkdir -p src/engagement/features
mkdir -p src/membership/features
mkdir -p src/notification/features
mkdir -p src/admin/features
mkdir -p src/file/features

# Shared
mkdir -p src/shared/{guards,decorators,pipes,filters,constants,utils,interceptors}

echo "✅ ServeLink backend structure created!"
