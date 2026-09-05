import {initialMigration} from './0001_initial';
import type {Migration} from './types';

export const migrations: readonly Migration[] = [initialMigration];

export * from './runMigrations';
export * from './types';
