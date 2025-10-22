#!/usr/bin/env node

import { generateSchema } from '../src/schema/generate';

generateSchema({ destination: 'schema/schema.json' });
