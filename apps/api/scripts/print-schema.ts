#!/usr/bin/env bun

import { print } from 'graphql';
import { typeDefs } from '../src/graphql/schema.js';

console.log(print(typeDefs));
